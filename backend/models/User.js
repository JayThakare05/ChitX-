const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    income: {
        type: Number,
        required: true
    },
    expenses: {
        type: Number,
        required: true
    },
    employment: {
        type: String,
        enum: ['Student', 'Salaried', 'Business'],
        default: 'Salaried'
    },
    hasBankStatement: {
        type: Boolean,
        default: false
    },
    trustScore: {
        type: Number,
        default: 0
    },
    tokensIssued: {
        type: Number,
        default: 0
    },
    cibilScore: {
        type: Number,
        default: null
    },
    // --- AI ML Telemetry Fields ---
    avgBalance: {
        type: Number,
        default: 15000
    },
    salaryConsistency: {
        type: Number,
        default: 0.8
    },
    spendingStability: {
        type: Number,
        default: 0.7
    },
    paymentTimeliness: {
        type: Number,
        default: 0.9
    },
    defaults: {
        type: Number,
        default: 0
    },
    participationCount: {
        type: Number,
        default: 1
    },
    contributionConsistency: {
        type: Number,
        default: 0.9
    },
    participationFrequency: {
        type: Number,
        default: 5
    },
    // ------------------------------
    desiredContribution: {
        type: Number,
        default: 1000 // default mock amount
    },
    matchStatus: {
        type: String,
        enum: ['waiting', 'matched'],
        default: 'waiting'
    },
    encryptedPrivateKey: {
        type: String,
        default: null
    },
    encryptionIv: {
        type: String,
        default: null
    },
    airdropTxHash: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
