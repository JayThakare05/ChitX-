const mongoose = require('mongoose');

const EmergencyRecordSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        lowercase: true,
        index: true
    },
    poolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pool',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    documentUrl: {
        type: String, // Relative path to the file
        required: true
    },
    aiResult: {
        approved: { type: Boolean, default: false },
        reason: String,
        category: String,
        confidence: Number
    },
    status: {
        type: String,
        enum: ['APPROVED', 'REJECTED', 'PENDING'],
        default: 'PENDING'
    },
    priorityScoreAtRequest: {
        type: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('EmergencyRecord', EmergencyRecordSchema);
