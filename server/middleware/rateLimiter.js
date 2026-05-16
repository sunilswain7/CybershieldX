const rateLimit = require('express-rate-limit');
const pool = require('../db/pool');
const { createAlert, logAttack, updateThreatScore } = require('./detectionEngine');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    blocked: true,
    attack: {
      type: 'BRUTE_FORCE',
      severity: 'high',
      message: 'Too many login attempts. Account temporarily locked.',
    },
    defense: {
      action: 'Rate limiting activated — IP temporarily blocked for 15 minutes',
      level: 3,
    },
  },
  handler: async (req, res, options) => {
    const logId = await logAttack('BRUTE_FORCE', `Repeated login attempts for: ${req.body.username || 'unknown'}`, req, 'high', 'Rate limit exceeded on login');
    await updateThreatScore(req.ip, 'BRUTE_FORCE');
    await createAlert(3, `Brute force attack detected from ${req.ip}`, 'IP rate limited for 15 minutes', logId, req.ip);
    res.status(429).json(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: {
    blocked: true,
    attack: { type: 'RATE_LIMIT', severity: 'medium', message: 'Too many requests' },
    defense: { action: 'Rate limiting activated', level: 2 },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const simulationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: {
    blocked: true,
    message: 'Simulation rate limit reached. Please wait before running more simulations.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, apiLimiter, simulationLimiter };
