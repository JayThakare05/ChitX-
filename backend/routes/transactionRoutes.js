const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// GET /api/transactions/:walletAddress — fetch user's transaction history
router.get('/:walletAddress', async (req, res) => {
    try {
        const wallet = req.params.walletAddress.toLowerCase();
        const limit  = parseInt(req.query.limit) || 50;

        const transactions = await Transaction.find({ walletAddress: wallet })
            .sort({ createdAt: -1 })
            .limit(limit);

        // Aggregate stats
        const totalDebits  = transactions.filter(t => t.direction === 'DEBIT').reduce((s, t) => s + t.amount, 0);
        const totalCredits = transactions.filter(t => t.direction === 'CREDIT').reduce((s, t) => s + t.amount, 0);

        res.status(200).json({
            transactions,
            stats: {
                totalTransactions: transactions.length,
                totalDebits: Math.round(totalDebits * 10) / 10,
                totalCredits: Math.round(totalCredits * 10) / 10,
                netFlow: Math.round((totalCredits - totalDebits) * 10) / 10
            }
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/transactions — manually record any transaction (for Airdrop, Jackpot, etc.)
router.post('/', async (req, res) => {
    try {
        const { walletAddress, type, direction, amount, poolId, poolMonthlyPay, description, txHash } = req.body;
        if (!walletAddress || !type || !direction || !amount) {
            return res.status(400).json({ error: 'walletAddress, type, direction, amount are required' });
        }
        const tx = await Transaction.create({
            walletAddress: walletAddress.toLowerCase(),
            type, direction, amount,
            poolId: poolId || null,
            poolMonthlyPay: poolMonthlyPay || null,
            description: description || type,
            txHash: txHash || null,
            status: 'SUCCESS'
        });
        res.status(201).json({ transaction: tx });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

module.exports = router;
