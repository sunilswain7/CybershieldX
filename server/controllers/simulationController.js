const pool = require('../db/pool');
const { logAttack, updateThreatScore, createAlert, detectSQLi, detectXSS } = require('../middleware/detectionEngine');

async function simulateSQLInjection(req, res) {
  const payload = req.body.payload || "' OR '1'='1' --";
  const detection = detectSQLi(payload);

  const logId = await logAttack('SQL_INJECTION', payload, req, 'high', 'SQL Injection simulation');
  await updateThreatScore(req.ip, 'SQL_INJECTION');
  await createAlert(3, `SQL Injection simulation from ${req.ip}`, 'Attack detected and blocked', logId, req.ip);

  res.json({
    simulation: 'SQL_INJECTION',
    attack: {
      payload,
      description: 'SQL Injection attempts to manipulate database queries by injecting malicious SQL code through user inputs.',
      risk: 'Critical',
      example: "Input: ' OR '1'='1' -- in login field bypasses authentication by making the WHERE clause always true.",
    },
    detection: {
      detected: detection.detected,
      method: 'Pattern matching against known SQL injection signatures',
      pattern: detection.pattern || 'N/A',
    },
    prevention: {
      method: 'Parameterized Queries / Prepared Statements',
      description: 'Instead of concatenating user input into SQL strings, use parameterized queries where inputs are treated as data, not code.',
      vulnerable_code: "SELECT * FROM users WHERE username = '" + "' + input + '",
      secure_code: "SELECT * FROM users WHERE username = $1 -- with parameterized input",
    },
    response: {
      action: 'Request blocked, event logged, threat score updated',
      log_id: logId,
    },
  });
}

async function simulateReflectedXSS(req, res) {
  const payload = req.body.payload || '<script>alert("XSS")</script>';
  const detection = detectXSS(payload);

  const logId = await logAttack('REFLECTED_XSS', payload, req, 'high', 'Reflected XSS simulation');
  await updateThreatScore(req.ip, 'REFLECTED_XSS');
  await createAlert(3, `Reflected XSS simulation from ${req.ip}`, 'Attack detected and blocked', logId, req.ip);

  const sanitized = payload
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  res.json({
    simulation: 'REFLECTED_XSS',
    attack: {
      payload,
      description: 'Reflected XSS injects malicious scripts via URL parameters or form inputs that get reflected back in the page response.',
      risk: 'High',
      example: 'Attacker sends a link with ?search=<script>steal(cookies)</script> — when victim clicks it, the script runs in their browser.',
    },
    detection: {
      detected: detection.detected,
      method: 'Pattern matching for script tags, event handlers, and JavaScript URIs',
      pattern: detection.pattern || 'N/A',
    },
    prevention: {
      method: 'Input Sanitization & Output Encoding',
      description: 'All user input is sanitized before being reflected in HTML. Special characters are encoded to prevent script execution.',
      original: payload,
      sanitized,
    },
    response: {
      action: 'Malicious input sanitized, event logged',
      log_id: logId,
    },
  });
}

async function simulateStoredXSS(req, res) {
  const payload = req.body.payload || '<img src=x onerror="document.cookie">';
  const detection = detectXSS(payload);

  const logId = await logAttack('STORED_XSS', payload, req, 'critical', 'Stored XSS simulation');
  await updateThreatScore(req.ip, 'STORED_XSS');
  await createAlert(4, `Stored XSS simulation from ${req.ip}`, 'Malicious content blocked from storage', logId, req.ip);

  const sanitized = payload
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(on\w+)\s*=/gi, '[blocked_event]=');

  res.json({
    simulation: 'STORED_XSS',
    attack: {
      payload,
      description: 'Stored XSS saves malicious scripts in the database (e.g., comments). Every user who views the content gets attacked.',
      risk: 'Critical',
      example: 'Attacker posts a comment containing <img src=x onerror="steal(cookies)"> — every viewer\'s browser executes it.',
    },
    detection: {
      detected: detection.detected,
      method: 'Input validation before database storage + output encoding on display',
    },
    prevention: {
      method: 'Sanitize on Input + Escape on Output',
      description: 'Content is sanitized before storage and escaped before rendering. Event handlers and script tags are stripped.',
      original: payload,
      sanitized,
      stored_safely: true,
    },
    response: {
      action: 'Malicious content blocked from database, event logged',
      log_id: logId,
    },
  });
}

async function simulateDOMXSS(req, res) {
  const payload = req.body.payload || 'javascript:alert(document.cookie)';
  const detection = detectXSS(payload);

  const logId = await logAttack('DOM_XSS', payload, req, 'high', 'DOM XSS simulation');
  await updateThreatScore(req.ip, 'DOM_XSS');
  await createAlert(3, `DOM XSS simulation from ${req.ip}`, 'DOM manipulation blocked', logId, req.ip);

  res.json({
    simulation: 'DOM_XSS',
    attack: {
      payload,
      description: 'DOM-based XSS exploits client-side JavaScript that reads data from the URL (hash, query params) and writes it to the DOM unsafely.',
      risk: 'High',
      example: 'Page reads location.hash and sets innerHTML — attacker crafts URL with malicious hash fragment.',
    },
    detection: {
      detected: detection.detected,
      method: 'Detection of javascript: URIs, eval(), and unsafe DOM sinks',
    },
    prevention: {
      method: 'Safe DOM APIs',
      description: 'Use textContent instead of innerHTML. Use React\'s JSX which auto-escapes by default. Avoid eval() and document.write().',
      unsafe: 'element.innerHTML = userInput',
      safe: 'element.textContent = userInput',
    },
    response: {
      action: 'Unsafe DOM operation blocked, event logged',
      log_id: logId,
    },
  });
}

async function simulateCSRF(req, res) {
  const logId = await logAttack('CSRF', 'Cross-site request forgery attempt', req, 'high', 'CSRF simulation');
  await updateThreatScore(req.ip, 'CSRF');
  await createAlert(3, `CSRF simulation from ${req.ip}`, 'CSRF token validation blocked request', logId, req.ip);

  res.json({
    simulation: 'CSRF',
    attack: {
      description: 'CSRF tricks a logged-in user\'s browser into sending unwanted requests to a site where they\'re authenticated.',
      risk: 'High',
      example: 'Attacker hosts a page with <form action="bank.com/transfer" method="POST"><input name="amount" value="10000">. Victim visits the page while logged into their bank.',
    },
    detection: {
      detected: true,
      method: 'CSRF Token validation — every state-changing request requires a unique token that the attacker cannot predict',
    },
    prevention: {
      method: 'CSRF Tokens + SameSite Cookies',
      description: 'Server generates a unique token per session. Forms include this token. Requests without valid tokens are rejected.',
      techniques: [
        'CSRF token in forms and AJAX headers',
        'SameSite=Strict cookie attribute',
        'Origin/Referer header validation',
        'Double-submit cookie pattern',
      ],
    },
    response: {
      action: 'Request rejected — invalid CSRF token',
      log_id: logId,
    },
  });
}

async function simulateBruteForce(req, res) {
  const target = req.body.username || 'admin';

  const logId = await logAttack('BRUTE_FORCE', `Brute force simulation targeting: ${target}`, req, 'high', 'Brute force simulation');
  await updateThreatScore(req.ip, 'BRUTE_FORCE');
  await createAlert(3, `Brute force simulation from ${req.ip} targeting ${target}`, 'Rate limiting and account lockout activated', logId, req.ip);

  res.json({
    simulation: 'BRUTE_FORCE',
    attack: {
      target,
      description: 'Brute force systematically tries every possible password combination until the correct one is found.',
      risk: 'High',
      example: `Attacker uses automated tools to try thousands of passwords against the account "${target}".`,
    },
    detection: {
      detected: true,
      method: 'Monitoring failed login frequency per IP and per account',
      triggers: ['> 5 failed attempts locks account for 15 min', '> 10 attempts per 15 min triggers IP rate limit'],
    },
    prevention: {
      method: 'Rate Limiting + Account Lockout + CAPTCHA',
      techniques: [
        'Account lockout after 5 failed attempts (15 min cooldown)',
        'IP-based rate limiting (10 login attempts per 15 minutes)',
        'CAPTCHA after 3 failed attempts',
        'Progressive delay between attempts',
      ],
    },
    response: {
      action: 'Account locked, IP rate limited, admin alerted',
      log_id: logId,
    },
  });
}

async function simulateDictionaryAttack(req, res) {
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome', 'abc123'];

  const logId = await logAttack('DICTIONARY_ATTACK', 'Dictionary attack simulation', req, 'high', 'Dictionary attack simulation');
  await updateThreatScore(req.ip, 'DICTIONARY_ATTACK');
  await createAlert(3, `Dictionary attack simulation from ${req.ip}`, 'Common password detection active', logId, req.ip);

  res.json({
    simulation: 'DICTIONARY_ATTACK',
    attack: {
      description: 'Dictionary attacks use a pre-compiled list of common passwords to try to break into accounts.',
      risk: 'High',
      example_passwords: commonPasswords,
      example: 'Instead of brute-forcing all combinations, the attacker tries the most commonly used passwords first — this is much faster.',
    },
    detection: {
      detected: true,
      method: 'Password checked against known common password database during registration and login',
    },
    prevention: {
      method: 'Password Strength Validation',
      techniques: [
        'Reject passwords found in common password lists',
        'Require minimum 8 characters',
        'Require mix of uppercase, lowercase, numbers, and symbols',
        'Password strength meter during registration',
        'bcrypt hashing with salt (cost factor 12)',
      ],
    },
    response: {
      action: 'Weak password rejected, user prompted for stronger password',
      log_id: logId,
    },
  });
}

async function simulateSessionHijacking(req, res) {
  const logId = await logAttack('SESSION_HIJACK', 'Session hijacking simulation', req, 'critical', 'Session hijacking simulation');
  await updateThreatScore(req.ip, 'SESSION_HIJACK');
  await createAlert(4, `Session hijacking simulation from ${req.ip}`, 'Session security measures demonstrated', logId, req.ip);

  res.json({
    simulation: 'SESSION_HIJACK',
    attack: {
      description: 'Session hijacking steals a user\'s session token (cookie) to impersonate them without knowing their password.',
      risk: 'Critical',
      methods: [
        'XSS to steal document.cookie',
        'Network sniffing on unencrypted connections',
        'Session fixation — forcing a known session ID',
        'Man-in-the-Middle (MITM) attacks',
      ],
    },
    detection: {
      detected: true,
      method: 'Session anomaly detection — monitoring for IP/user-agent changes mid-session',
    },
    prevention: {
      method: 'Secure Session Management',
      techniques: [
        'HttpOnly cookies — JavaScript cannot access session tokens',
        'Secure flag — cookies only sent over HTTPS',
        'SameSite=Strict — prevents cross-site cookie sending',
        'Short session expiry (24 hours)',
        'Session invalidation on logout',
        'JWT tokens with expiration',
        'Session binding to IP and user-agent',
      ],
    },
    response: {
      action: 'Suspicious session terminated, new authentication required',
      log_id: logId,
    },
  });
}

async function simulatePhishing(req, res) {
  const logId = await logAttack('PHISHING', 'Phishing simulation', req, 'high', 'Phishing simulation');
  await updateThreatScore(req.ip, 'PHISHING');
  await createAlert(3, `Phishing simulation from ${req.ip}`, 'Phishing detection active', logId, req.ip);

  res.json({
    simulation: 'PHISHING',
    attack: {
      description: 'Phishing creates fake login pages that look identical to real ones to steal credentials.',
      risk: 'High',
      example: 'Attacker creates cybersh1eld-x.com (with number 1 instead of i) with identical UI. Victim enters real credentials on fake site.',
      indicators: [
        'Misspelled domain names',
        'Missing HTTPS',
        'Urgent/threatening email language',
        'Requests for sensitive information',
      ],
    },
    detection: {
      detected: true,
      method: 'Domain validation, visual warnings, and user awareness',
    },
    prevention: {
      method: 'Multi-Layer Phishing Defense',
      techniques: [
        'Visual domain verification banner on login page',
        'MFA — even stolen passwords need second factor',
        'Browser-based phishing detection',
        'Security awareness training',
        'Email link scanning',
        'Certificate validation (HTTPS)',
      ],
    },
    response: {
      action: 'Warning banner displayed, suspicious domain flagged',
      log_id: logId,
    },
  });
}

async function simulateFileUpload(req, res) {
  const filename = req.body.filename || 'malware.php';
  const dangerousExtensions = ['.php', '.exe', '.sh', '.bat', '.cmd', '.js', '.vbs', '.ps1', '.py'];
  const ext = '.' + filename.split('.').pop().toLowerCase();
  const isMalicious = dangerousExtensions.includes(ext);

  const logId = await logAttack('FILE_UPLOAD', `Malicious file upload attempt: ${filename}`, req, isMalicious ? 'critical' : 'low', 'File upload simulation');
  if (isMalicious) {
    await updateThreatScore(req.ip, 'FILE_UPLOAD');
    await createAlert(4, `Malicious file upload attempt from ${req.ip}: ${filename}`, 'File rejected', logId, req.ip);
  }

  const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.doc', '.docx'];

  res.json({
    simulation: 'FILE_UPLOAD_ATTACK',
    attack: {
      filename,
      extension: ext,
      is_malicious: isMalicious,
      description: 'File upload attacks upload malicious scripts (PHP, EXE, etc.) that can execute on the server and give the attacker remote control.',
      risk: 'Critical',
      example: `Uploading "${filename}" — if the server executes it, the attacker can run any command on the system.`,
    },
    detection: {
      detected: isMalicious,
      method: 'File extension validation, MIME type checking, and content scanning',
      blocked_extensions: dangerousExtensions,
    },
    prevention: {
      method: 'File Upload Validation',
      techniques: [
        'Whitelist allowed file extensions: ' + allowedTypes.join(', '),
        'Validate MIME type matches extension',
        'Rename files with random names on upload',
        'Store uploads outside web root',
        'Set maximum file size limit',
        'Scan file content for embedded scripts',
      ],
      result: isMalicious ? 'FILE REJECTED' : 'FILE ALLOWED',
    },
    response: {
      action: isMalicious ? 'File rejected — dangerous extension detected' : 'File accepted — passed all security checks',
      log_id: logId,
    },
  });
}

module.exports = {
  simulateSQLInjection,
  simulateReflectedXSS,
  simulateStoredXSS,
  simulateDOMXSS,
  simulateCSRF,
  simulateBruteForce,
  simulateDictionaryAttack,
  simulateSessionHijacking,
  simulatePhishing,
  simulateFileUpload,
};
