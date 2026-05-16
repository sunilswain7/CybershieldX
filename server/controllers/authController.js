const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { logAttack, updateThreatScore, createAlert } = require('../middleware/detectionEngine');

function checkPasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  let strength = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  return { checks, score, strength };
}

const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'password1',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password123',
];

async function register(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
      await logAttack('DICTIONARY_ATTACK', `Common password used: ${password}`, req, 'medium', 'Weak password rejected at registration');
      return res.status(400).json({
        error: 'This password is too common and easily guessable',
        attack_detected: 'DICTIONARY_ATTACK',
        defense: 'Common password rejected — use a stronger password',
      });
    }

    const strength = checkPasswordStrength(password);
    if (strength.strength === 'weak') {
      return res.status(400).json({ error: 'Password is too weak', strength });
    }

    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role, created_at`,
      [username, email, passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

    await pool.query(
      `INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')`,
      [user.id, token, req.ip, req.get('user-agent')]
    );

    res.status(201).json({
      message: 'Registration successful',
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token,
      passwordStrength: strength,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_locked && user.lock_until && new Date(user.lock_until) > new Date()) {
      const logId = await logAttack('BRUTE_FORCE', `Login attempt on locked account: ${username}`, req, 'high', 'Account is locked');
      await createAlert(4, `Login attempt on locked account ${username} from ${req.ip}`, 'Request denied — account locked', logId, req.ip);
      return res.status(423).json({
        error: 'Account is locked due to multiple failed attempts',
        locked_until: user.lock_until,
        attack_detected: 'BRUTE_FORCE',
        defense: 'Account lockout activated',
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      const attempts = user.failed_attempts + 1;
      const lockAccount = attempts >= 5;

      await pool.query(
        `UPDATE users SET failed_attempts = $1, is_locked = $2, lock_until = $3 WHERE id = $4`,
        [attempts, lockAccount, lockAccount ? new Date(Date.now() + 15 * 60 * 1000) : null, user.id]
      );

      if (lockAccount) {
        const logId = await logAttack('BRUTE_FORCE', `5 failed login attempts for: ${username}`, req, 'high', 'Account locked after 5 failed attempts');
        await updateThreatScore(req.ip, 'BRUTE_FORCE');
        await createAlert(3, `Account ${username} locked after 5 failed attempts from ${req.ip}`, 'Account locked for 15 minutes', logId, req.ip);
      }

      return res.status(401).json({
        error: 'Invalid credentials',
        attempts_remaining: Math.max(0, 5 - attempts),
        ...(lockAccount && {
          account_locked: true,
          defense: 'Account locked for 15 minutes after 5 failed attempts',
        }),
      });
    }

    await pool.query(
      'UPDATE users SET failed_attempts = 0, is_locked = false, lock_until = NULL WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

    await pool.query(
      `INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')`,
      [user.id, token, req.ip, req.get('user-agent')]
    );

    res.json({
      message: 'Login successful',
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token,
      security: {
        session_created: true,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

async function getProfile(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, mfa_enabled, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

async function logout(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
}

function checkStrength(req, res) {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });

  const isCommon = COMMON_PASSWORDS.includes(password.toLowerCase());
  const strength = checkPasswordStrength(password);

  res.json({
    ...strength,
    isCommon,
    ...(isCommon && { warning: 'This is a commonly used password — vulnerable to dictionary attacks' }),
  });
}

module.exports = { register, login, getProfile, logout, checkStrength };
