const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chitx';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Fallback Route for Trigger Test
app.post('/api/trigger', async (req, res) => {
    console.log('Backend: Trigger Test');
    res.status(200).json({ message: 'Bridge working' });
});

app.listen(PORT, () => {
    console.log(`ChitX Backend running on http://localhost:${PORT}`);
});
