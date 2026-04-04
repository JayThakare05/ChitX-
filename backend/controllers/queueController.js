const Pool = require('../models/Pool');
const User = require('../models/User');

/**
 * bifurcateQueue
 * Simulates receiving a list of users, splitting them into pools of max size 15,
 * and mapping their individual contributions. 
 * If 16 join, it splits into 8 and 8.
 */
exports.bifurcateQueue = async (req, res) => {
    try {
        const { usersList, baseDuration } = req.body; 
        // usersList = [{ walletAddress, monthlyContribution, trustScore }]
        const MAX_POOL_SIZE = 15;
        const totalUsers = usersList.length;

        if (!totalUsers) {
            return res.status(400).json({ error: 'No users provided.' });
        }

        // Determine number of pools needed
        const numPools = Math.ceil(totalUsers / MAX_POOL_SIZE);
        const targetSize = Math.ceil(totalUsers / numPools); 
        const cycleLimit = Math.ceil(MAX_POOL_SIZE / targetSize);

        // Sort globally by trust score descending
        let sortedUsers = [...usersList].sort((a, b) => b.trustScore - a.trustScore);

        const createdPools = [];

        // Distribute evenly
        for (let i = 0; i < numPools; i++) {
            const chunk = sortedUsers.splice(0, targetSize);
            
            let poolCollection = 0;
            const contributions = chunk.map(u => {
                poolCollection += u.monthlyContribution;
                return {
                    walletAddress: u.walletAddress,
                    monthlyContribution: u.monthlyContribution,
                    targetAmount: u.monthlyContribution * (baseDuration || 5),
                    trustScoreAtJoin: u.trustScore,
                    hasBeenPaid: false
                };
            });

            // Create Dynamic Pool
            const newPool = new Pool({
                monthlyPay: chunk[0] ? chunk[0].monthlyContribution : 100, // Dummy
                totalAmount: poolCollection * (baseDuration || 5),
                members: chunk.length,
                status: 'ACTIVE',
                isDynamic: true,
                currentBalance: 0,
                totalMonthlyCollection: poolCollection,
                simulationMonth: 0,
                cycleLimit: cycleLimit,
                joinedMembers: chunk.map(u => u.walletAddress),
                contributions: contributions
            });

            await newPool.save();
            createdPools.push(newPool);
        }

        res.status(200).json({
            message: `Bifurcated ${totalUsers} users into ${numPools} pools (size ~${targetSize}, cycles: ${cycleLimit}).`,
            pools: createdPools
        });

    } catch (error) {
        console.error('Bifurcation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
