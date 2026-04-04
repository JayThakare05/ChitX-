const User = require('../models/User');
const axios = require('axios');

exports.onboarding = async (req, res) => {
    try {
        const { name, phone, income, expenses, employment, hasBankStatement, walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address is required' });
        }

        // Call AI Service to calculate Trust Score
        let trustScore = 70; // Default fallback
        try {
            const aiResponse = await axios.post('http://localhost:8000/ai/calculate-score', {
                income,
                expenses,
                employment,
                hasBankStatement
            });
            trustScore = aiResponse.data.trustScore;
        } catch (aiErr) {
            console.error('AI Service Error:', aiErr.message);
            // We'll proceed with fallback or logic here
            trustScore = Math.min(100, Math.max(20, Math.floor((income / (expenses || 1)) * 10) + (hasBankStatement ? 15 : 0)));
        }

        const tokensIssued = trustScore * 10;

        // Save or Update User
        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (user) {
            user.name = name;
            user.phone = phone;
            user.income = income;
            user.expenses = expenses;
            user.employment = employment;
            user.hasBankStatement = hasBankStatement;
            user.trustScore = trustScore;
            user.tokensIssued = tokensIssued;
            await user.save();
        } else {
            user = new User({
                name,
                phone,
                income,
                expenses,
                employment,
                hasBankStatement,
                walletAddress,
                trustScore,
                tokensIssued
            });
            await user.save();
        }

        res.status(200).json({
            message: 'Onboarding successful',
            trustScore,
            tokensIssued,
            user
        });

    } catch (err) {
        console.error('Onboarding Controller Error:', err);
        res.status(500).json({ error: 'Server error during onboarding' });
    }
};
