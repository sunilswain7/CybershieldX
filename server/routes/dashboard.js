const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const dash = require('../controllers/dashboardController');

router.use(authMiddleware);

router.get('/stats', dash.getStats);
router.get('/logs', dash.getAttackLogs);
router.get('/alerts', dash.getAlerts);
router.get('/threats', dash.getThreatScores);
router.get('/timeline', dash.getTimeline);
router.post('/reset', dash.resetData);

module.exports = router;
