const Pool = require('../models/Pool');
const User = require('../models/User');
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

        // Eligibility Check 1: Trust Score
        if (user.trustScore < 50) {
            return res.status(403).json({ error: 'Your trust score is too low to join a pool. Minimum required: 50.' });
        }

        // Eligibility Check 2: Income - Expenses limit
        const disposable = user.income - user.expenses;
        if (disposable < pool.monthlyPay) {
            return res.status(403).json({ 
                error: `Insufficient disposable income. Your limit ($${disposable}) is less than the pool's monthly pay ($${pool.monthlyPay}).`
            });
        }

        const fixedDeposit = pool.monthlyPay * 2;

        // Check on-chain CTX balance
        let onChainBalance = 0;
        const balanceResult = await web3Service.getBalance(walletAddress);
        onChainBalance = parseFloat(balanceResult.balance) || 0;
        console.log(`💰 On-chain CTX balance for ${walletAddress}: ${onChainBalance}`);

        if (onChainBalance < fixedDeposit) {
            return res.status(403).json({ 
                error: `Insufficient CTX balance. You need ${fixedDeposit} CTX but only have ${onChainBalance.toFixed(1)} CTX on-chain.`
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
