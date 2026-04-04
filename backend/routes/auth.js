const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @route   POST api/auth/onboarding
// @desc    Register or update user with KYC and calculate Trust Score
// @access  Public
router.post('/onboarding', authController.onboarding);

module.exports = router;
