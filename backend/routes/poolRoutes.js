const express = require('express');
const router = express.Router();
const poolController = require('../controllers/poolController');

const queueController = require('../controllers/queueController');

router.post('/', poolController.createPool);
router.get('/', poolController.getAllPools);
router.delete('/:id', poolController.deletePool);
router.post('/:id/join', poolController.joinPool);
router.post('/:id/leave', poolController.leavePool);
router.get('/balance/:walletAddress', poolController.getUserBalance);

// Dynamic Pool Routes
router.post('/bifurcate', queueController.bifurcateQueue);
router.post('/:id/simulate-month', poolController.simulateMonth);
router.post('/:id/fill-synthetic', poolController.fillSynthetic);

module.exports = router;
