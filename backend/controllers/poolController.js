const Pool = require('../models/Pool');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const web3Service = require('../services/web3Service');


// Create a new pool
exports.createPool = async (req, res) => {
    try {
        const { monthlyPay, members, creatorWallet, status } = req.body;
        if (!monthlyPay) {
            return res.status(400).json({ error: 'monthlyPay is required' });
        }
        
        let totalAmount = 0;
        if (members) {
            totalAmount = monthlyPay * members;
        }

        const newPool = new Pool({
            monthlyPay,
            totalAmount,
            members,
            status: status || 'OPEN',
            creatorWallet
        });
        
        await newPool.save();
        res.status(201).json({ message: 'Pool created successfully', pool: newPool });
    } catch (error) {
        console.error('Error creating pool:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all pools
exports.getAllPools = async (req, res) => {
    try {
        const pools = await Pool.find().sort({ createdAt: -1 });
        res.status(200).json({ pools });
    } catch (error) {
        console.error('Error fetching pools:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete a pool — ONLY the creator can delete
exports.deletePool = async (req, res) => {
    try {
        const poolId = req.params.id;
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        const pool = await Pool.findById(poolId);
        if (!pool) {
            return res.status(404).json({ error: 'Pool not found' });
        }

        // Creator-only check
        if (pool.creatorWallet !== walletAddress.toLowerCase()) {
            return res.status(403).json({ error: 'Only the pool creator can delete this pool.' });
        }

        // Refund all members their fixed deposits before deleting
        if (pool.contributions && pool.contributions.length > 0) {
            for (const contrib of pool.contributions) {
                const member = await User.findOne({ walletAddress: contrib.walletAddress });
                if (member) {
                    member.tokensIssued += contrib.fixedDeposit;
                    await member.save();
                    console.log(`💰 Refunded ${contrib.fixedDeposit} CTX to ${contrib.walletAddress}`);
                }
            }
        }

        await Pool.findByIdAndDelete(poolId);
        res.status(200).json({ message: 'Pool deleted successfully. All members refunded.' });
    } catch (error) {
        console.error('Error deleting pool:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Join a pool — deducts fixed deposit (2x monthlyPay) from user's CTX balance
exports.joinPool = async (req, res) => {
    try {
        const poolId = req.params.id;
        const { walletAddress } = req.body;
        
        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const pool = await Pool.findById(poolId);
        if (!pool) return res.status(404).json({ error: 'Pool not found' });

        // Check if already joined
        if (pool.joinedMembers && pool.joinedMembers.includes(walletAddress.toLowerCase())) {
            return res.status(400).json({ error: 'You have already joined this pool' });
        }

        const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found in system. Please register.' });
        }

        // ── Eligibility Logic (Synchronized with Frontend) ────────────────────────
        const disposable = user.income - user.expenses;
        const fixedDeposit = pool.monthlyPay * 2;
        const isMicroPool  = pool.monthlyPay >= 5 && pool.monthlyPay <= 10;
        const isLowTrust   = user.trustScore < 50;

        // Check on-chain CTX balance
        let onChainBalance = 0;
        const balanceResult = await web3Service.getBalance(walletAddress);
        onChainBalance = parseFloat(balanceResult.balance) || 0;
        console.log(`💰 On-chain CTX balance for ${walletAddress}: ${onChainBalance}`);

        const incomeOk  = disposable >= pool.monthlyPay;
        const balanceOk = onChainBalance >= fixedDeposit;
        
        // Low trust users can join micro-pools IF balance is OK.
        // For larger pools, low trust is a hard fail.
        const trustOk = user.trustScore >= 50 || (isMicroPool && balanceOk);

        // ── Hard Requirements ───────────────────────────────────────────────────
        if (isLowTrust) {
            if (!isMicroPool) {
                return res.status(403).json({ 
                    error: `Trust score too low (${user.trustScore}/100). Pools above $10 require a minimum trust score of 50.` 
                });
            }
            if (!balanceOk) {
                return res.status(403).json({ 
                    error: `For micro-pools, a sufficient CTX balance (${fixedDeposit} required) is compulsory for low-trust users.` 
                });
            }
        }

        const passedCount = [trustOk, incomeOk, balanceOk].filter(Boolean).length;

        if (passedCount < 2) {
            const reasons = [];
            if (!trustOk)   reasons.push(`Trust score too low (${user.trustScore}/100, min 50)`);
            if (!incomeOk)  reasons.push(`Disposable income ($${disposable}) is less than monthly pay ($${pool.monthlyPay})`);
            if (!balanceOk) reasons.push(`CTX balance (${onChainBalance.toFixed(1)}) is less than required deposit (${fixedDeposit})`);
            
            return res.status(403).json({
                error: `You need at least 2 of 3 eligibility criteria to join. Failed: ${reasons.join('; ')}.`
            });
        }

        // Check if pool is full
        if (pool.members && pool.joinedMembers && pool.joinedMembers.length >= pool.members) {
            return res.status(400).json({ error: 'Pool is full.' });
        }

        // === DEDUCT from DB balance ===
        user.tokensIssued = Math.max(0, (user.tokensIssued || 0) - fixedDeposit);
        await user.save();

        // Add to pool
        if (!pool.joinedMembers) pool.joinedMembers = [];
        pool.joinedMembers.push(walletAddress.toLowerCase());

        if (!pool.contributions) pool.contributions = [];
        pool.contributions.push({
            walletAddress: walletAddress.toLowerCase(),
            fixedDeposit: fixedDeposit,
            monthlyPayments: 0,
            totalContributed: fixedDeposit
        });

        pool.poolTreasury = (pool.poolTreasury || 0) + fixedDeposit;
        await pool.save();

        // ── Record transaction ──────────────────────────────────────
        try {
            await Transaction.create({
                walletAddress: walletAddress.toLowerCase(),
                type: 'POOL_JOIN',
                direction: 'DEBIT',
                amount: fixedDeposit,
                poolId: poolId,
                poolMonthlyPay: pool.monthlyPay,
                description: `Joined pool — ${fixedDeposit} CTX fixed deposit locked`,
                txHash: req.body.txHash || null,
                status: 'SUCCESS'
            });
        } catch (txErr) { console.error('Transaction record error:', txErr.message); }

        // Fetch updated on-chain balance for display
        const updatedBalance = await web3Service.getBalance(walletAddress);
        const displayBalance = parseFloat(updatedBalance.balance) || (onChainBalance - fixedDeposit);

        console.log(`✅ ${walletAddress} joined pool ${poolId}. Fixed deposit: ${fixedDeposit} CTX deducted.`);
        res.status(200).json({ 
            message: `Successfully joined! ${fixedDeposit} CTX fixed deposit deducted.`, 
            pool,
            deducted: fixedDeposit,
            remainingBalance: displayBalance.toFixed(1),
            onChainBalance: displayBalance.toFixed(1)
        });

    } catch (error) {
        console.error('Error joining pool:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Leave a pool — refund fixed deposit ONLY if no monthly payments made yet
exports.leavePool = async (req, res) => {
    try {
        const poolId = req.params.id;
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        const pool = await Pool.findById(poolId);
        if (!pool) return res.status(404).json({ error: 'Pool not found' });

        const wallet = walletAddress.toLowerCase();

        // Check if user is actually in the pool
        if (!pool.joinedMembers || !pool.joinedMembers.includes(wallet)) {
            return res.status(400).json({ error: 'You are not a member of this pool.' });
        }

        // Find their contribution record
        const contrib = pool.contributions ? pool.contributions.find(c => c.walletAddress === wallet) : null;

        if (!contrib) {
            return res.status(400).json({ error: 'No contribution record found.' });
        }

        // Only allow leaving if NO monthly payments made
        if (contrib.monthlyPayments > 0) {
            return res.status(403).json({ 
                error: 'You have already made monthly payments. You cannot leave the pool after the first payment.' 
            });
        }

        // === REFUND FIXED DEPOSIT ===
        const refundAmount = contrib.fixedDeposit;
        
        // 1. On-chain refund from Treasury to User
        try {
            await web3Service.transferTokens(wallet, refundAmount);
        } catch (err) {
            return res.status(500).json({ error: 'On-chain refund failed: ' + err.message });
        }

        // 2. Update Database Balance
        const user = await User.findOne({ walletAddress: wallet });
        
        if (user) {
            user.tokensIssued = (user.tokensIssued || 0) + refundAmount;
            await user.save();
        }

        // Remove from pool
        pool.joinedMembers = pool.joinedMembers.filter(m => m !== wallet);
        pool.contributions = pool.contributions.filter(c => c.walletAddress !== wallet);
        pool.poolTreasury = Math.max(0, (pool.poolTreasury || 0) - refundAmount);

        await pool.save();

        // ── Record transaction ──────────────────────────────────────
        try {
            await Transaction.create({
                walletAddress: wallet,
                type: 'POOL_LEAVE',
                direction: 'CREDIT',
                amount: refundAmount,
                poolId: poolId,
                poolMonthlyPay: pool.monthlyPay,
                description: `Left pool — ${refundAmount} CTX fixed deposit refunded`,
                txHash: null,
                status: 'SUCCESS'
            });
        } catch (txErr) { console.error('Transaction record error:', txErr.message); }

        // Get updated balance
        const updatedBalance = await web3Service.getBalance(wallet);
        const displayBalance = parseFloat(updatedBalance.balance) || (user ? user.tokensIssued : 0);

        console.log(`🔙 ${wallet} left pool ${poolId}. Refunded: ${refundAmount} CTX.`);
        res.status(200).json({ 
            message: `Successfully left the pool. ${refundAmount} CTX refunded.`,
            refunded: refundAmount,
            newBalance: displayBalance.toFixed(1)
        });

    } catch (error) {
        console.error('Error leaving pool:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get user's CTX balance (on-chain + DB)
exports.getUserBalance = async (req, res) => {
    try {
        const { walletAddress } = req.params;
        if (!walletAddress) return res.status(400).json({ error: 'Wallet address required' });

        const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
        const onChain = await web3Service.getBalance(walletAddress);

        res.status(200).json({
            walletAddress,
            onChainBalance: parseFloat(onChain.balance) || 0,
            dbBalance: user ? user.tokensIssued : 0,
            trustScore: user ? user.trustScore : 0
        });
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// ============================================
// AI Dynamic Simulators & Synthetic Data
// ============================================

exports.fillSynthetic = async (req, res) => {
    try {
        const poolId = req.params.id;
        const pool = await Pool.findById(poolId);
        if (!pool) return res.status(404).json({ error: 'Pool not found' });
        
        const MAX_POOL_SIZE = pool.members || 15;
        const currentCount = pool.joinedMembers ? pool.joinedMembers.length : 0;
        const toFill = MAX_POOL_SIZE - currentCount;

        if (toFill <= 0) {
            return res.status(400).json({ error: 'Pool is already full.' });
        }

        // Initialize dynamic parameters if not present
        if (!pool.isDynamic) {
            pool.isDynamic = true;
            pool.currentBalance = pool.poolTreasury || 0;
            pool.totalMonthlyCollection = pool.contributions ? pool.contributions.reduce((acc, c) => acc + (c.monthlyContribution || pool.monthlyPay), 0) : 0;
            pool.simulationMonth = 0;
            pool.cycleLimit = 1;
        }

        // Generate Synthetic Users
        if (!pool.joinedMembers) pool.joinedMembers = [];
        if (!pool.contributions) pool.contributions = [];

        for (let i = 0; i < toFill; i++) {
            const isHighTrust = Math.random() > 0.7; // 30% chance high trust
            const isLowTrust = Math.random() < 0.2; // 20% chance low trust
            
            const trustScore = isHighTrust ? Math.floor(Math.random() * 20 + 80) :
                               isLowTrust ? Math.floor(Math.random() * 20 + 30) :
                               Math.floor(Math.random() * 30 + 50); // 50-80 base
            
            const randomIncomeMultiplier = Math.random() * 2 + 1; // 1x to 3x base payload
            const monthlyContri = Math.floor(pool.monthlyPay * (Math.random() > 0.5 ? 1 : randomIncomeMultiplier));
            const dummyWallet = `0xSYNTHETIC_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            
            pool.joinedMembers.push(dummyWallet);
            pool.contributions.push({
                walletAddress: dummyWallet,
                monthlyContribution: monthlyContri,
                targetAmount: monthlyContri * MAX_POOL_SIZE, // Approximate a basic target (assumes max size duration)
                fixedDeposit: pool.monthlyPay * 2,
                trustScoreAtJoin: trustScore,
                priorityScore: 0,
                hasBeenPaid: false,
                payoutMonth: 0
            });
            pool.totalMonthlyCollection += monthlyContri;
        }

        await pool.save();

        res.status(200).json({
            message: `Successfully populated pool with ${toFill} synthetic members balanced by varying algorithmic trust tiers.`,
            pool
        });

    } catch (e) {
        console.error('Synthetic fill error:', e);
        res.status(500).json({ error: 'Failed to fill synthetic data.' });
    }
};

exports.simulateMonth = async (req, res) => {
    try {
        const poolId = req.params.id;
        const pool = await Pool.findById(poolId);
        
        if (!pool) return res.status(404).json({ error: 'Pool not found' });
        
        // Remove strictly dynamic requirement and implicitly upgrade pool logic
        if (!pool.isDynamic) {
            pool.isDynamic = true;
            // Map legacy base pools to dynamic config
            pool.totalMonthlyCollection = pool.contributions ? pool.contributions.reduce((acc, c) => {
                if (!c.monthlyContribution || c.monthlyContribution === 0) c.monthlyContribution = pool.monthlyPay;
                if (!c.targetAmount || c.targetAmount === 0) c.targetAmount = pool.monthlyPay * pool.members;
                return acc + c.monthlyContribution;
            }, 0) : 0;
            pool.cycleLimit = 1;
            pool.currentBalance = pool.poolTreasury || 0;
            pool.simulationMonth = 0;
        }

        // Add monthly collection to current balance
        pool.currentBalance += pool.totalMonthlyCollection;
        pool.simulationMonth += 1;

        const winnersThisMonth = [];
        let balanceRemaining = pool.currentBalance;

        // Get members who haven't won in this cycle
        let eligible = pool.contributions.filter(c => !c.hasBeenPaid && c.targetAmount <= balanceRemaining);

        // Sort by AI Priority Score / Trust score
        const totalEligible = eligible.length;
        eligible.sort((a, b) => b.trustScoreAtJoin - a.trustScoreAtJoin);

        while (eligible.length > 0) {
            const winner = eligible[0]; // Highest priority
            
            // Mark as paid
            winner.hasBeenPaid = true;
            winner.payoutMonth = pool.simulationMonth;
            
            // Generate detailed AI Context/Reasoning
            const rankStr = `Ranked #1 out of ${totalEligible} eligible members.`;
            const reasoning = `Winner AI selection logic: Trust Score (${winner.trustScoreAtJoin}%) secured priority. Their requested target ($${winner.targetAmount.toLocaleString()}) safely fit within the current pooled treasury balance ($${balanceRemaining.toLocaleString()}). ${rankStr}`;
            
            // Deduct
            balanceRemaining -= winner.targetAmount;
            winnersThisMonth.push({
                walletAddress: winner.walletAddress,
                targetAmount: winner.targetAmount,
                trustScore: winner.trustScoreAtJoin,
                aiReasoning: reasoning
            });

            // Re-eval for any remaining balance for remaining unpaid users
            eligible = pool.contributions.filter(c => !c.hasBeenPaid && c.targetAmount <= balanceRemaining);
            eligible.sort((a, b) => b.trustScoreAtJoin - a.trustScoreAtJoin);
        }

        pool.currentBalance = balanceRemaining;

        // Check if cycle is complete (everyone has won once)
        const allPaid = pool.contributions.every(c => c.hasBeenPaid);
        let cycleReset = false;
        if (allPaid) {
            // Reset for next cycle if we haven't hit the cycle limit
            cycleReset = true;
            pool.contributions.forEach(c => {
                c.hasBeenPaid = false;
            });
            pool.cycleLimit -= 1; // Used one cycle
            if (pool.cycleLimit <= 0) {
                pool.status = 'CLOSED';
            }
        }

        await pool.save();

        res.status(200).json({
            message: `Simulation for Month ${pool.simulationMonth} complete.`,
            month: pool.simulationMonth,
            collectionAdded: pool.totalMonthlyCollection,
            winners: winnersThisMonth,
            balanceRemaining: pool.currentBalance,
            cycleReset,
            poolStatus: pool.status
        });

    } catch (error) {
        console.error('Simulation error:', error);
        res.status(500).json({ error: 'Server simulation failed' });
    }
};
