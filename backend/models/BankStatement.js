const mongoose = require('mongoose');

const BankStatementSchema = new mongoose.Schema({
    // Linked wallet — set when user completes registration
    walletAddress: {
        type: String,
        lowercase: true,
        default: null,
        index: true
    },
    // A temporary session key (random UUID) so the frontend can reference this
    // upload before the wallet is known (during registration flow)
    sessionKey: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    // Original file metadata
    originalFilename: {
        type: String,
        default: null
    },
    // Raw CSV content (capped at 500KB)
    csvContent: {
        type: String,
        default: null
    },
    // Parsed output from the AI service
    parsedIncome: {
        type: Number,
        default: null
    },
    parsedExpenses: {
        type: Number,
        default: null
    },
    parsedTrustScore: {
        type: Number,
        default: null
    },
    // Any extra fields the AI service returns
    rawParsedData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // Auto-delete after 30 days
        expires: 60 * 60 * 24 * 30
    }
});

module.exports = mongoose.model('BankStatement', BankStatementSchema);
