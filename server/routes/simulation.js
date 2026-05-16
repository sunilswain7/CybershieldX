const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { simulationLimiter } = require('../middleware/rateLimiter');
const sim = require('../controllers/simulationController');

router.use(authMiddleware);
router.use(simulationLimiter);

router.post('/sql-injection', sim.simulateSQLInjection);
router.post('/reflected-xss', sim.simulateReflectedXSS);
router.post('/stored-xss', sim.simulateStoredXSS);
router.post('/dom-xss', sim.simulateDOMXSS);
router.post('/csrf', sim.simulateCSRF);
router.post('/brute-force', sim.simulateBruteForce);
router.post('/dictionary-attack', sim.simulateDictionaryAttack);
router.post('/session-hijacking', sim.simulateSessionHijacking);
router.post('/phishing', sim.simulatePhishing);
router.post('/file-upload', sim.simulateFileUpload);

module.exports = router;
