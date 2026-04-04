const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config({ override: true });

const web3Service = require('./services/web3Service');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Removed type: '*/*' to fix multipart upload bug
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const poolRoutes = require('./routes/poolRoutes');
app.use('/api/pools', poolRoutes);

const transactionRoutes = require('./routes/transactionRoutes');
app.use('/api/transactions', transactionRoutes);


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

app.listen(PORT, () => {
    console.log(`🚀 ChitX Backend running on http://localhost:${PORT}`);
});
