const express = require('express');
const router = express.Router();
const poolController = require('../controllers/poolController');

router.post('/', poolController.createPool);
router.get('/', poolController.getAllPools);
router.delete('/:id', poolController.deletePool);
router.post('/:id/join', poolController.joinPool);
router.post('/:id/leave', poolController.leavePool);
router.get('/balance/:walletAddress', poolController.getUserBalance);

module.exports = router;
