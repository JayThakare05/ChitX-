const express = require('express');
const router = express.Router();
const Pool = require('../models/Pool');

// GET all pools
router.get('/', async (req, res) => {
    try {
        const pools = await Pool.find();
        res.status(200).json(pools);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create pool
router.post('/', async (req, res) => {
    try {
        const { totalPot, dummyMembers } = req.body;
        const membersCount = dummyMembers || 10;
        const monthlyPay = membersCount > 0 ? (totalPot / membersCount) : 0;
        const fixedDeposit = monthlyPay * 2;

        const newPool = new Pool({
            totalPot,
            durationMonths: membersCount,
            membersCount,
            monthlyPay,
            fixedDeposit,
            status: 'open'
        });

        await newPool.save();
        res.status(201).json(newPool);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE pool
router.delete('/:id', async (req, res) => {
    try {
        await Pool.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST join pool 
router.post('/join', async (req, res) => {
    try {
        const { poolId, walletAddress } = req.body;
        const pool = await Pool.findById(poolId);
        
        if (!pool) return res.status(404).json({ error: "Pool not found" });
        
        // Prevent duplicate joining
        if (!pool.joinedMembers.includes(walletAddress)) {
            pool.joinedMembers.push(walletAddress);
            await pool.save();
        }
        res.status(200).json({ success: true, message: "Joined successfully", pool });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
