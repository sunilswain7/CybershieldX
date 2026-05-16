const pool = require('../db/pool');

async function getThreatScore(ip) {
  try {
    const result = await pool.query(
      'SELECT score, total_attacks FROM threat_scores WHERE ip_address = $1',
      [ip]
    );
    return result.rows[0] || { score: 0, total_attacks: 0 };
  } catch {
    return { score: 0, total_attacks: 0 };
  }
}

async function determineResponseLevel(ip) {
  const { score, total_attacks } = await getThreatScore(ip);

  if (score >= 80 || total_attacks >= 20) return 5;
  if (score >= 60 || total_attacks >= 15) return 4;
  if (score >= 40 || total_attacks >= 10) return 3;
  if (score >= 20 || total_attacks >= 5) return 2;
  return 1;
}

const RESPONSE_ACTIONS = {
  1: { action: 'Log suspicious activity', description: 'Activity has been recorded for review', requiresCaptcha: false, blocked: false },
  2: { action: 'Warning issued', description: 'User warned about suspicious behavior', requiresCaptcha: false, blocked: false },
  3: { action: 'CAPTCHA required', description: 'Elevated security — CAPTCHA verification needed', requiresCaptcha: true, blocked: false },
  4: { action: 'Temporarily blocked', description: 'IP temporarily blocked due to threat level', requiresCaptcha: true, blocked: true },
  5: { action: 'Administrator notified', description: 'Critical threat — admin notified and IP blocked', requiresCaptcha: true, blocked: true },
};

const responseMiddleware = async (req, res, next) => {
  const level = await determineResponseLevel(req.ip);
  req.threatLevel = level;
  req.responseAction = RESPONSE_ACTIONS[level];

  if (level >= 4) {
    return res.status(403).json({
      blocked: true,
      response: {
        level,
        ...RESPONSE_ACTIONS[level],
        message: `Your IP has been flagged at threat level ${level}. Access restricted.`,
      },
    });
  }

  next();
};

module.exports = { responseMiddleware, determineResponseLevel, getThreatScore, RESPONSE_ACTIONS };
