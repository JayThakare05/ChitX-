const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');

// Multer setup for memory storage (we will forward the buffer to Python)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// @route   POST api/auth/upload-statement
// @desc    Upload Bank Statement (CSV) to get AI-parsed Income/Expenses
// @access  Public
router.post('/upload-statement', upload.single('statement'), authController.uploadStatement);

// @route   POST api/auth/create-wallet
// @desc    Create a new wallet with parsed data, encrypt via Name+Phone
// @access  Public
router.post('/create-wallet', authController.createWallet);

// @route   POST api/auth/retrieve-key
// @desc    Retrieve unencrypted private key using Name+Phone
// @access  Public
router.post('/retrieve-key', authController.retrieveKey);

// Maintain backwards compatibility with the original route as an alternative
router.post('/onboarding', authController.onboarding);

// @route   POST api/auth/login
// @desc    Login with MetaMask wallet address — checks if registered
// @access  Public
router.post('/login', authController.loginWithWallet);

module.exports = router;
