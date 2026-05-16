const pool = require('../db/pool');

async function getStats(req, res) {
  try {
    const [attacks, alerts, threats, recentAttacks, attackTypes] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, status, severity FROM attack_logs GROUP BY status, severity'),
      pool.query('SELECT COUNT(*) as total, level FROM security_alerts GROUP BY level ORDER BY level'),
      pool.query('SELECT AVG(score) as avg_score, MAX(score) as max_score, COUNT(*) as tracked_ips FROM threat_scores'),
      pool.query('SELECT attack_type, COUNT(*) as count FROM attack_logs GROUP BY attack_type ORDER BY count DESC'),
      pool.query('SELECT COUNT(*) as total FROM attack_logs'),
    ]);

    const totalAttacks = parseInt(attackTypes.rows[0]?.total || 0);
    const avgScore = Math.round(parseFloat(threats.rows[0]?.avg_score || 0));
    let threatLevel = 'Low';
    if (avgScore >= 70) threatLevel = 'Critical';
    else if (avgScore >= 50) threatLevel = 'High';
    else if (avgScore >= 30) threatLevel = 'Medium';

    res.json({
      overview: {
        total_attacks: totalAttacks,
        threat_level: threatLevel,
        avg_threat_score: avgScore,
        max_threat_score: parseInt(threats.rows[0]?.max_score || 0),
        tracked_ips: parseInt(threats.rows[0]?.tracked_ips || 0),
      },
      attacks_by_type: recentAttacks.rows,
      attacks_by_severity: attacks.rows,
      alerts_by_level: alerts.rows,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}

async function getAttackLogs(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const type = req.query.type;

    let query = 'SELECT * FROM attack_logs';
    const params = [];

    if (type) {
      query += ' WHERE attack_type = $1';
      params.push(type);
    }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [logs, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(
        type ? 'SELECT COUNT(*) FROM attack_logs WHERE attack_type = $1' : 'SELECT COUNT(*) FROM attack_logs',
        type ? [type] : []
      ),
    ]);

    res.json({
      logs: logs.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
      },
    });
  } catch (err) {
    console.error('Attack logs error:', err);
    res.status(500).json({ error: 'Failed to fetch attack logs' });
  }
}

async function getAlerts(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM security_alerts ORDER BY created_at DESC LIMIT 50'
    );
    res.json({ alerts: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
}

async function getThreatScores(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM threat_scores ORDER BY score DESC LIMIT 20'
    );
    res.json({ threats: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch threat scores' });
  }
}

async function getTimeline(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        DATE_TRUNC('hour', created_at) as time_bucket,
        attack_type,
        COUNT(*) as count
      FROM attack_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY time_bucket, attack_type
      ORDER BY time_bucket ASC
    `);
    res.json({ timeline: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
}

async function resetData(req, res) {
  try {
    await pool.query('DELETE FROM security_alerts');
    await pool.query('DELETE FROM attack_logs');
    await pool.query('DELETE FROM threat_scores');
    res.json({ message: 'Dashboard data reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset data' });
  }
}

module.exports = { getStats, getAttackLogs, getAlerts, getThreatScores, getTimeline, resetData };
