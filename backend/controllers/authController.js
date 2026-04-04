const User = require('../models/User');
const axios = require('axios');
const web3Service = require('../services/web3Service');

exports.onboarding = async (req, res) => {
    try {
        console.log("Headers:", req.headers);
        console.log("Body:", req.body);
        
        const bodyObj = req.body || {};
        const { name, phone, income, expenses, employment, hasBankStatement, walletAddress } = bodyObj;

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address is required (or body is undefined)' });
        }

        // ─── Step 1: Call AI Service to calculate Trust Score ───
        let trustScore = 70; // Default fallback
        let aiAnalysis = '';
        try {
            const aiResponse = await axios.post('http://localhost:8000/ai/calculate-score', {
                income: parseFloat(income) || 0,
                expenses: parseFloat(expenses) || 0,
                employment: employment || 'Salaried',
                hasBankStatement: Boolean(hasBankStatement)
            });
            trustScore = aiResponse.data.trustScore;
            aiAnalysis = aiResponse.data.analysis || '';
            console.log(`🧠 AI Score received: ${trustScore}`);
        } catch (aiErr) {
            console.error('⚠️  AI Service Error:', aiErr.message);
            // Fallback scoring logic
            const inc = parseFloat(income) || 0;
            const exp = parseFloat(expenses) || 1;
            trustScore = Math.min(100, Math.max(20, Math.floor((inc / exp) * 10) + (hasBankStatement ? 15 : 0)));
            aiAnalysis = 'Fallback scoring used — AI service unavailable';
        }

        // ─── Step 2: Airdrop CTX tokens on-chain ───
        const airdropAmount = trustScore * 10;
        let airdropResult;
        try {
            airdropResult = await web3Service.airdropTokens(walletAddress, trustScore);
            console.log(`📋 Onboarding: ${name} | Score: ${trustScore} | Tokens: ${airdropAmount} | Tx: ${airdropResult.txHash}`);
        } catch (web3Err) {
            console.error('⚠️  Web3 Airdrop Error:', web3Err.message);
            airdropResult = {
                success: false,
                simulated: true,
                tokensTransferred: airdropAmount,
                txHash: null,
                message: 'Airdrop failed — tokens allocated off-chain'
            };
        }

        // ─── Step 3: Save or Update User in MongoDB ───
        const txHash = airdropResult.txHash || null;
        const tokensIssued = airdropResult.tokensTransferred || airdropAmount;

        // Save or Update User
        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (user) {
            user.name = name;
            user.phone = phone;
            user.income = parseFloat(income) || 0;
            user.expenses = parseFloat(expenses) || 0;
            user.employment = employment || 'Salaried';
            user.hasBankStatement = Boolean(hasBankStatement);
            user.trustScore = trustScore;
            user.tokensIssued = tokensIssued;
            user.airdropTxHash = txHash;
            await user.save();
        } else {
            user = new User({
                name,
                phone,
                income: parseFloat(income) || 0,
                expenses: parseFloat(expenses) || 0,
                employment: employment || 'Salaried',
                hasBankStatement: Boolean(hasBankStatement),
                walletAddress: walletAddress.toLowerCase(),
                trustScore,
                tokensIssued,
                airdropTxHash: txHash
            });
            await user.save();
        }

        // ─── Step 4: Send response with all required fields ───
        res.status(200).json({
            message: 'Onboarding successful',
            // Top-level fields the frontend needs immediately
            trustScore,
            tokensIssued,
            airdropAmount: tokensIssued,
            txHash,
            // Detailed transfer info
            tokenTransfer: {
                success: airdropResult.success,
                simulated: airdropResult.simulated || false,
                txHash,
                blockNumber: airdropResult.blockNumber || null,
                message: airdropResult.message
            },
            aiAnalysis,
            user
        });

    } catch (err) {
        console.error('Onboarding Controller Error:', err);
        res.status(500).json({ error: 'Server error during onboarding' });
    }
};
