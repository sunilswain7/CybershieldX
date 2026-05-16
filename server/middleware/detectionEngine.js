const pool = require('../db/pool');

const SQLI_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|alter|create|exec|execute)\b.*\b(from|into|table|database|where)\b)/i,
  /('|\")(\s*)(or|and)(\s*)('|\"|\d)/i,
  /('|\")\s*(;|--)/i,
  /(1\s*=\s*1|1\s*=\s*'1')/i,
  /(\bor\b\s+\d+\s*=\s*\d+)/i,
  /(union\s+(all\s+)?select)/i,
  /('\s*or\s*'.*'.*=.*')/i,
  /(;\s*(drop|delete|update|insert))/i,
];

const XSS_PATTERNS = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /on(load|error|click|mouseover|focus|blur|submit|change|input)\s*=/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<img[^>]+onerror/i,
  /eval\s*\(/i,
  /document\.(cookie|write|location)/i,
  /window\.(location|open)/i,
  /<svg[^>]*on/i,
  /data\s*:\s*text\/html/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.%2f/i,
  /\.\.%5c/i,
  /\.\.\\/,
];

function detectSQLi(input) {
  for (const pattern of SQLI_PATTERNS) {
    if (pattern.test(input)) {
      return { detected: true, pattern: pattern.toString(), payload: input };
    }
  }
  return { detected: false };
}

function detectXSS(input) {
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      return { detected: true, pattern: pattern.toString(), payload: input };
    }
  }
  return { detected: false };
}

function detectPathTraversal(input) {
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(input)) {
      return { detected: true, pattern: pattern.toString(), payload: input };
    }
  }
  return { detected: false };
}

function scanAllInputs(obj) {
  const threats = [];
  if (!obj) return threats;

  const values = typeof obj === 'string' ? [obj] : Object.values(obj);

  for (const val of values) {
    if (typeof val !== 'string') continue;

    const sqli = detectSQLi(val);
    if (sqli.detected) threats.push({ type: 'SQL_INJECTION', ...sqli });

    const xss = detectXSS(val);
    if (xss.detected) threats.push({ type: 'XSS', ...xss });

    const path = detectPathTraversal(val);
    if (path.detected) threats.push({ type: 'PATH_TRAVERSAL', ...path });
  }
  return threats;
}

async function logAttack(attackType, payload, req, severity = 'medium', details = '') {
  try {
    const result = await pool.query(
      `INSERT INTO attack_logs (attack_type, payload, source_ip, user_agent, status, severity, details, user_id)
       VALUES ($1, $2, $3, $4, 'blocked', $5, $6, $7) RETURNING id`,
      [attackType, payload, req.ip, req.get('user-agent'), severity, details, req.userId || null]
    );
    return result.rows[0].id;
  } catch (err) {
    console.error('Failed to log attack:', err.message);
    return null;
  }
}

async function updateThreatScore(ip, attackType) {
  try {
    await pool.query(
      `INSERT INTO threat_scores (ip_address, score, total_attacks, last_attack_type, last_updated)
       VALUES ($1, 15, 1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (ip_address)
       DO UPDATE SET
         score = LEAST(threat_scores.score + 15, 100),
         total_attacks = threat_scores.total_attacks + 1,
         last_attack_type = $2,
         last_updated = CURRENT_TIMESTAMP`,
      [ip, attackType]
    );
  } catch (err) {
    console.error('Failed to update threat score:', err.message);
  }
}

async function createAlert(level, message, actionTaken, logId, ip) {
  try {
    await pool.query(
      `INSERT INTO security_alerts (level, message, action_taken, related_log_id, source_ip)
       VALUES ($1, $2, $3, $4, $5)`,
      [level, message, actionTaken, logId, ip]
    );
  } catch (err) {
    console.error('Failed to create alert:', err.message);
  }
}

const detectionMiddleware = async (req, res, next) => {
  const inputs = { ...req.body, ...req.query, ...req.params };
  const threats = scanAllInputs(inputs);

  if (threats.length === 0) return next();

  const threat = threats[0];
  const severity = threats.length > 1 ? 'critical' : 'high';

  const logId = await logAttack(threat.type, threat.payload, req, severity, JSON.stringify(threats));
  await updateThreatScore(req.ip, threat.type);

  const alertLevel = severity === 'critical' ? 4 : 3;
  await createAlert(
    alertLevel,
    `${threat.type} attack detected from ${req.ip}`,
    'Request blocked',
    logId,
    req.ip
  );

  return res.status(403).json({
    blocked: true,
    attack: {
      type: threat.type,
      severity,
      message: `${threat.type} attack detected and blocked`,
      payload: threat.payload,
      pattern: threat.pattern,
      timestamp: new Date().toISOString(),
    },
    defense: {
      action: 'Request blocked by detection engine',
      level: alertLevel,
      logged: true,
      threatScoreUpdated: true,
    },
  });
};

module.exports = {
  detectionMiddleware,
  detectSQLi,
  detectXSS,
  detectPathTraversal,
  scanAllInputs,
  logAttack,
  updateThreatScore,
  createAlert,
};
