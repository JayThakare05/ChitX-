const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const web3Service = require('./services/web3Service');
const Pool = require('./models/Pool');
const User = require('./models/User');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 5000;

// ─── HTTP Server + Socket.io ───
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const poolRoutes = require('./routes/pools');
app.use('/api/pools', poolRoutes);

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chitx';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Initialize Web3 Service (blockchain connection)
web3Service.init()
    .then(() => console.log('🔗 Web3Service initialization complete'))
    .catch(err => console.error('⚠️  Web3Service init error (non-fatal):', err.message));

// Health check endpoint
app.get('/api/health', async (req, res) => {
    const treasuryInfo = await web3Service.getTreasuryInfo();
    res.status(200).json({
        status: 'running',
        service: 'ChitX Backend',
        blockchain: treasuryInfo,
        timestamp: new Date().toISOString()
    });
});

// Fallback Route for Trigger Test
app.post('/api/trigger', async (req, res) => {
    console.log('Backend: Trigger Test');
    res.status(200).json({ message: 'Bridge working' });
});

// ─────────────────────────────────────────────────────────
// ─── Socket.io: Live Bidding Arena ───
// ─────────────────────────────────────────────────────────

// In-memory auction state per pool
const poolAuctions = {};
// Track how many sockets are in each pool room
const poolRoomCounts = {};
// Active countdown timers per pool
const poolTimers = {};

const AUCTION_DURATION = 60; // seconds

// ─── AI Predictive Resolver ───
async function calculateAIPriorityRanking(poolId, members, poolContribution) {
    try {
        console.log(`Triggering AI Matrix for Pool ${poolId}...`);
        
        const predictions = await Promise.all(members.map(async (memberId) => {
            const user = await User.findById(memberId);
            if (!user) return null;
            
            const payload = {
                income: user.income || 0,
                expenses: user.expenses || 0,
                employment: user.employment === 'Business' ? 'Business Owner' : user.employment,
                credit_score: user.cibilScore || 700,
                avg_balance: user.avgBalance !== undefined ? user.avgBalance : (user.income * 0.3),
                salary_consistency: user.salaryConsistency !== undefined ? user.salaryConsistency : 0.8,
                spending_stability: user.spendingStability !== undefined ? user.spendingStability : 0.7,
                payment_timeliness: user.paymentTimeliness !== undefined ? user.paymentTimeliness : 0.9,
                defaults: user.defaults || 0,
                participation_count: user.participationCount || 1,
                contribution_consistency: user.contributionConsistency !== undefined ? user.contributionConsistency : 0.9,
                participation_frequency: user.participationFrequency || 5,
                contribution_amount: poolContribution || 1000,
                pool_size: members.length
            };
            
            console.log(`\n🔹 Sending Data to AI for User ${user.name} (${user.walletAddress}):`);
            console.log(`   Income: ${payload.income}, Expenses: ${payload.expenses}, CIBIL: ${payload.credit_score}, TF: ${user.trustScore}`);

            try {
                const response = await axios.post('http://localhost:5050/predict', payload);
                const aiData = response.data;
                
                console.log(`✅ Received AI Data for User ${user.name} (${user.walletAddress}):`);
                console.log(`   Trust Score: ${aiData.trust_score}, Priority Score: ${aiData.priority_pct}%`);
                
                return {
                    userId: user._id.toString(),
                    userName: user.name,
                    walletAddress: user.walletAddress,
                    priority_score: aiData.priority_score || 0,
                    priority_pct: aiData.priority_pct || 0,
                    priorityScore: aiData.priority_pct || 0,
                    tier_label: aiData.tier_label || "Unknown",
                    tokens: aiData.tokens || 0
                };
            } catch (mlErr) {
                console.error(`❌ AI Model Error for user ${user.name}:`, mlErr.message);
                return {
                    userId: user._id.toString(),
                    userName: user.name,
                    walletAddress: user.walletAddress,
                    priority_score: 0,
                    priority_pct: 0,
                    priorityScore: 0,
                    tier_label: "Error",
                    tokens: 0
                };
            }
        }));
        
        const validPredictions = predictions.filter(p => p !== null);
        console.log(`\n🏁 Unsorted Predictions:`, validPredictions.map(p => `${p.userName}: ${p.priority_pct}%`));
        
        // Task 2: Strict descending sort
        validPredictions.sort((a, b) => b.priority_pct - a.priority_pct);
        
        // Task 3: Address Normalization for Frontend Web3 matching
        validPredictions.forEach(member => {
            if (member.walletAddress) {
                member.walletAddress = member.walletAddress.toLowerCase();
            }
        });
        
        console.log(`🏆 Sorted Predictions:`, validPredictions.map(p => `${p.userName} (${p.walletAddress}): ${p.priority_pct}%`));
        
        return validPredictions;
    } catch (e) {
        console.error('Error in calculateAIPriorityRanking:', e);
        return [];
    }
}

// ─── Start auction timer for a pool ───
function startAuctionTimer(poolId, members, totalPot, poolContribution) {
    if (poolTimers[poolId]) return;

    const auction = poolAuctions[poolId];
    if (!auction) return;

    auction.timerRunning = true;
    auction.timeRemaining = AUCTION_DURATION;
    auction.auctionEnded = false;

    console.log(`⏱️  AI Resolution timer started for pool: ${poolId} (${AUCTION_DURATION}s)`);

    const interval = setInterval(async () => {
        auction.timeRemaining--;

        io.to(poolId).emit('timer-update', {
            timeRemaining: auction.timeRemaining,
            totalDuration: AUCTION_DURATION,
        });

        if (auction.timeRemaining <= 0) {
            clearInterval(interval);
            delete poolTimers[poolId];
            auction.timerRunning = false;
            auction.auctionEnded = true;

            console.log(`🧠 Timer ended. Computing AI resolution for pool ${poolId}...`);
            
            const rankedMembers = await calculateAIPriorityRanking(poolId, members, poolContribution);
            const winner = rankedMembers.length > 0 ? rankedMembers[0] : null;

            console.log(`🏆 AI Resolution final for pool ${poolId}. Winner: ${winner?.userName || 'No one'}, Score: ${winner?.priority_pct || 0}%`);

            // Execute Autonomous AI Payout
            if (winner && winner.walletAddress) {
                 web3Service.executeAutonomousPayout(poolId, winner.walletAddress, totalPot).then((result) => {
                     if (result.success && result.txHash) {
                         io.to(poolId).emit('payout-complete', { txHash: result.txHash, winnerAddress: winner.walletAddress });
                     }
                 }).catch(err => console.error("Payout trigger error:", err));
            }

            io.to(poolId).emit('ai-round-resolved', {
                rankedMembers: rankedMembers,
                winner: winner || null,
                finalPayoutAmount: totalPot,
                winnerAddress: winner?.walletAddress || null
            });
        }
    }, 1000);

    poolTimers[poolId] = interval;
}

io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ─── Join a pool room ───
    socket.on('join-pool', async ({ poolId, userName }) => {
        socket.join(poolId);

        // Track room count
        poolRoomCounts[poolId] = (poolRoomCounts[poolId] || 0) + 1;

        // Initialize auction state if needed — ALWAYS reset if stale
        if (!poolAuctions[poolId]) {
            poolAuctions[poolId] = {
                timerRunning: false,
                auctionEnded: false,
                timeRemaining: AUCTION_DURATION,
                totalPot: 0,
                isFull: false,
            };
        }

        try {
            const pool = await Pool.findById(poolId);
            if (pool) {
                const maxCap = pool.maxMembers || pool.durationMonths || 10;
                poolAuctions[poolId].totalPot = pool.totalPot || 0;
                const isFull = pool.members.length >= maxCap;
                poolAuctions[poolId].isFull = isFull;

                console.log(`📊 Pool ${poolId}: members=${pool.members.length}/${maxCap}, isFull=${isFull}, timerRunning=${poolAuctions[poolId].timerRunning}, auctionEnded=${poolAuctions[poolId].auctionEnded}`);

                // Reset stale ended state if pool is full but no timer is running (server restart scenario)
                if (isFull && poolAuctions[poolId].auctionEnded && !poolTimers[poolId]) {
                    console.log(`🔄 Resetting stale auction state for pool ${poolId}`);
                    poolAuctions[poolId].auctionEnded = false;
                    poolAuctions[poolId].timerRunning = false;
                    poolAuctions[poolId].timeRemaining = AUCTION_DURATION;
                }

                if (isFull && !poolAuctions[poolId].timerRunning && !poolAuctions[poolId].auctionEnded) {
                    console.log(`🚀 STARTING TIMER for pool ${poolId}!`);
                    startAuctionTimer(poolId, pool.members, pool.totalPot, pool.monthlyContribution);
                }
            } else {
                console.error(`❌ Pool not found in DB: ${poolId}`);
            }
        } catch (err) {
            console.error('Error fetching pool for auction:', err.message);
        }

        console.log(`👤 ${userName || socket.id} joined pool room: ${poolId} (${poolRoomCounts[poolId]} online)`);

        // Send current auction state to the newly joined user
        socket.emit('auction-state', {
            ...poolAuctions[poolId],
        });

        // Broadcast updated room count
        io.to(poolId).emit('room-update', {
            onlineCount: poolRoomCounts[poolId],
        });
    });


    // ─── Manually trigger timer (for pools that are already full) ───
    socket.on('start-auction', async ({ poolId }) => {
        const auction = poolAuctions[poolId];
        if (!auction) return;
        if (auction.timerRunning || auction.auctionEnded) return;

        // Verify pool is actually full
        try {
            const pool = await Pool.findById(poolId);
            if (pool) {
                const maxCap = pool.maxMembers || pool.durationMonths || 10;
                if (pool.members.length >= maxCap) {
                    auction.totalPot = pool.totalPot || 0;
                    startAuctionTimer(poolId, pool.members, pool.totalPot, pool.monthlyContribution);
                } else {
                    socket.emit('bid-error', { message: `Pool needs ${maxCap - pool.members.length} more members before auction can start.` });
                }
            }
        } catch (err) {
            console.error('Error starting auction:', err.message);
        }
    });

    // ─── Disconnect ───
    socket.on('disconnecting', () => {
        for (const room of socket.rooms) {
            if (room !== socket.id && poolRoomCounts[room]) {
                poolRoomCounts[room] = Math.max(0, poolRoomCounts[room] - 1);
                io.to(room).emit('room-update', {
                    onlineCount: poolRoomCounts[room],
                });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
});

// ─── Start Server ───
server.listen(PORT, () => {
    console.log(`🚀 ChitX Backend running on http://localhost:${PORT}`);
    console.log(`⚡ Socket.io bidding engine active (${AUCTION_DURATION}s auction timer)`);
});
