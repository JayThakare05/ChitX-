const mongoose = require('mongoose');

const memberContributionSchema = new mongoose.Schema({
    walletAddress: { type: String, required: true },
    monthlyContribution: { type: Number, default: 0 }, // Individual contribution
    targetAmount: { type: Number, default: 0 }, // Target jackpot amount for this member
    fixedDeposit: { type: Number, default: 0 },
    monthlyPayments: { type: Number, default: 0 }, // count of payments made
    totalContributed: { type: Number, default: 0 },
    trustScoreAtJoin: { type: Number, default: 0 },
    priorityScore: { type: Number, default: 0 }, // Filled via AI simulation
    hasBeenPaid: { type: Boolean, default: false }, // Cycle flag
    payoutMonth: { type: Number, default: 0 }, // Which simulation month they won
    joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const poolSchema = new mongoose.Schema({
    monthlyPay: { type: Number, required: true }, // Base config metric
    totalAmount: { type: Number, required: false },
    members: { type: Number, required: false },
    status: { type: String, default: 'OPEN' }, // OPEN, BIFURCATING, ACTIVE, CLOSED
    creatorWallet: { type: String, required: false },
    
    // Dynamic / Simulation fields
    isDynamic: { type: Boolean, default: false },
    currentBalance: { type: Number, default: 0 },
    totalMonthlyCollection: { type: Number, default: 0 },
    simulationMonth: { type: Number, default: 0 }, // Counter
    cycleLimit: { type: Number, default: 1 }, // E.g. runs twice if split was 16 / 8

    joinedMembers: [{ type: String }],
    contributions: [memberContributionSchema],
    poolTreasury: { type: Number, default: 0 }, // total CTX held by this pool
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pool', poolSchema);
