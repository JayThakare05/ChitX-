const mongoose = require('mongoose');

const memberContributionSchema = new mongoose.Schema({
    walletAddress: { type: String, required: true },
    fixedDeposit: { type: Number, default: 0 },
    monthlyPayments: { type: Number, default: 0 }, // count of monthly payments made
    totalContributed: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const poolSchema = new mongoose.Schema({
    monthlyPay: { type: Number, required: true },
    totalAmount: { type: Number, required: false },
    members: { type: Number, required: false },
    status: { type: String, default: 'OPEN' },
    creatorWallet: { type: String, required: false },
    joinedMembers: [{ type: String }],
    contributions: [memberContributionSchema],
    poolTreasury: { type: Number, default: 0 }, // total CTX held by this pool
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pool', poolSchema);
