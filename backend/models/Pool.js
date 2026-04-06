const mongoose = require('mongoose');

const poolSchema = new mongoose.Schema({
    totalPot: { type: Number, required: true },
    durationMonths: { type: Number, required: true },
    membersCount: { type: Number, required: true },
    joinedMembers: { type: [String], default: [] },
    members: { type: Array, default: [] },
    monthlyPay: { type: Number, required: true },
    fixedDeposit: { type: Number, required: true },
    status: { type: String, default: 'open' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pool', poolSchema);
