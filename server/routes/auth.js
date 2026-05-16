const express = require('express');
const router = express.Router();
const { register, login, getProfile, logout, checkStrength } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.get('/profile', authMiddleware, getProfile);
router.post('/logout', authMiddleware, logout);
router.post('/check-password', checkStrength);

module.exports = router;
