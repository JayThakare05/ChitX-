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
