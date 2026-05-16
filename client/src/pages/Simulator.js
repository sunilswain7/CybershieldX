import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { HiLightningBolt, HiShieldCheck, HiExclamation, HiTerminal, HiUpload, HiLockClosed, HiSearch, HiUser } from 'react-icons/hi';

const TABS = [
  { id: 'sql-injection', label: 'SQL Injection', icon: <HiTerminal /> },
  { id: 'xss', label: 'XSS Attack', icon: <HiSearch /> },
  { id: 'brute-force', label: 'Brute Force', icon: <HiLockClosed /> },
  { id: 'file-upload', label: 'File Upload', icon: <HiUpload /> },
];

export default function Simulator() {
  const [activeTab, setActiveTab] = useState('sql-injection');
  const [securityLogs, setSecurityLogs] = useState([]);

  const addLog = (type, message, level = 'info') => {
    const entry = { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), type, message, level };
    setSecurityLogs((prev) => [entry, ...prev].slice(0, 50));
  };

  const clearLogs = () => setSecurityLogs([]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <HiLightningBolt className="text-red-400" />
          Attack Simulation Lab
        </h1>
        <p className="text-slate-400 mt-1">
          Act as the attacker — type real payloads into real forms. Watch the defense system react live.
        </p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); clearLogs(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition border-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-white'
                : 'bg-[#1e293b] text-slate-400 hover:text-white hover:bg-[#334155]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'sql-injection' && <SQLInjectionLab addLog={addLog} />}
          {activeTab === 'xss' && <XSSLab addLog={addLog} />}
          {activeTab === 'brute-force' && <BruteForceLab addLog={addLog} />}
          {activeTab === 'file-upload' && <FileUploadLab addLog={addLog} />}
        </div>

        <div className="lg:col-span-1">
          <SecurityMonitor logs={securityLogs} onClear={clearLogs} />
        </div>
      </div>
    </div>
  );
}

/* ========== SECURITY MONITOR PANEL ========== */

function SecurityMonitor({ logs, onClear }) {
  const logRef = useRef(null);
  const levelColors = {
    danger: 'text-red-400 bg-red-500/10 border-red-500/30',
    warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    success: 'text-green-400 bg-green-500/10 border-green-500/30',
    info: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  };

  return (
    <div className="bg-[#0f172a] rounded-xl border border-[#334155] sticky top-20">
      <div className="flex items-center justify-between p-4 border-b border-[#334155]">
        <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2 m-0">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          SECURITY MONITOR
        </h3>
        <button onClick={onClear} className="text-xs text-slate-500 hover:text-slate-300 bg-transparent border-0 cursor-pointer">Clear</button>
      </div>
      <div ref={logRef} className="p-3 space-y-2 max-h-[500px] overflow-y-auto font-mono">
        {logs.length === 0 ? (
          <div className="text-slate-600 text-xs text-center py-8">Waiting for activity...</div>
        ) : (
          <AnimatePresence>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-xs p-2 rounded border ${levelColors[log.level]}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{log.type}</span>
                  <span className="text-slate-500">{log.time}</span>
                </div>
                <div className="opacity-90">{log.message}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/* ========== SQL INJECTION LAB ========== */

function SQLInjectionLab({ addLog }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [queryPreview, setQueryPreview] = useState('');

  useEffect(() => {
    const q = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    setQueryPreview(q);
  }, [username, password]);

  const handleAttack = async (e) => {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    setResult(null);

    addLog('ATTACKER', `Submitting login: username="${username}"`, 'warning');
    addLog('QUERY BUILD', `SQL: ${queryPreview}`, 'info');

    try {
      const res = await api.post('/simulate/sql-injection', { payload: username });
      setResult(res.data);

      if (res.data.detection?.detected) {
        addLog('DETECTION', `SQL Injection pattern detected in input`, 'danger');
        addLog('PATTERN', `Matched: ${res.data.detection.pattern}`, 'danger');
        addLog('PREVENTION', `Using parameterized query — input treated as data`, 'success');
        addLog('RESPONSE', `Request blocked. Event logged. Threat score updated.`, 'success');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.blocked) {
        setResult(data);
        addLog('BLOCKED', `Attack blocked by detection engine`, 'danger');
        addLog('DEFENSE', data.defense?.action || 'Request blocked', 'success');
      }
    } finally {
      setLoading(false);
    }
  };

  const prefill = (user, pass) => { setUsername(user); setPassword(pass); };

  return (
    <div className="space-y-4">
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
        <div className="bg-red-500/10 border-b border-red-500/30 px-5 py-3 flex items-center gap-2">
          <HiExclamation className="text-red-400" />
          <span className="text-sm font-semibold text-red-400">ATTACKER VIEW — Vulnerable Login Form</span>
        </div>
        <div className="p-6">
          <p className="text-slate-400 text-sm mb-4">
            Imagine this is a login form on a vulnerable website. Type a SQL injection payload in the username field to try to bypass authentication.
          </p>

          <div className="flex gap-2 mb-4 flex-wrap">
            <span className="text-xs text-slate-500 py-1">Try:</span>
            <PayloadChip label="' OR '1'='1' --" onClick={() => prefill("' OR '1'='1' --", 'anything')} />
            <PayloadChip label="admin'--" onClick={() => prefill("admin'--", '')} />
            <PayloadChip label="' UNION SELECT * FROM users --" onClick={() => prefill("' UNION SELECT * FROM users --", '')} />
            <PayloadChip label="'; DROP TABLE users; --" onClick={() => prefill("'; DROP TABLE users; --", '')} />
          </div>

          <form onSubmit={handleAttack} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or SQL payload..."
                className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                type="text"
                className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono text-sm"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition border-0 cursor-pointer">
              {loading ? 'Submitting...' : 'Login (Send Attack)'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-[#0f172a] rounded-lg border border-[#334155]">
            <span className="text-xs text-slate-500">Live Query Preview (what the server would build):</span>
            <pre className="text-xs text-yellow-300 mt-1 m-0 whitespace-pre-wrap break-all font-mono">{queryPreview}</pre>
          </div>
        </div>
      </div>

      {result && <DefenseResult result={result} />}
    </div>
  );
}

/* ========== XSS LAB ========== */

function XSSLab({ addLog }) {
  const [comment, setComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('comment');

  const handleAttack = async (e) => {
    e.preventDefault();
    const payload = mode === 'comment' ? comment : searchQuery;
    if (!payload) return;
    setLoading(true);
    setResult(null);

    const type = mode === 'comment' ? 'Stored XSS' : 'Reflected XSS';
    const endpoint = mode === 'comment' ? '/simulate/stored-xss' : '/simulate/reflected-xss';

    addLog('ATTACKER', `Injecting ${type} via ${mode}: "${payload.substring(0, 60)}"`, 'warning');

    try {
      const res = await api.post(endpoint, { payload });
      setResult(res.data);

      if (res.data.detection?.detected) {
        addLog('DETECTION', `${type} pattern detected`, 'danger');
        addLog('SANITIZER', `Dangerous HTML tags and event handlers stripped`, 'success');
        addLog('PREVENTION', `Input sanitized before ${mode === 'comment' ? 'storage' : 'reflection'}`, 'success');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.blocked) {
        setResult(data);
        addLog('BLOCKED', 'XSS payload blocked by detection engine', 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
        <div className="bg-red-500/10 border-b border-red-500/30 px-5 py-3 flex items-center gap-2">
          <HiExclamation className="text-red-400" />
          <span className="text-sm font-semibold text-red-400">ATTACKER VIEW — Inject Malicious Script</span>
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setMode('comment')} className={`px-4 py-2 rounded-lg text-sm border-0 cursor-pointer transition ${mode === 'comment' ? 'bg-red-500/20 text-red-400' : 'bg-[#0f172a] text-slate-400'}`}>
              Comment Box (Stored XSS)
            </button>
            <button onClick={() => setMode('search')} className={`px-4 py-2 rounded-lg text-sm border-0 cursor-pointer transition ${mode === 'search' ? 'bg-red-500/20 text-red-400' : 'bg-[#0f172a] text-slate-400'}`}>
              Search Bar (Reflected XSS)
            </button>
          </div>

          <p className="text-slate-400 text-sm mb-4">
            {mode === 'comment'
              ? 'Post a comment containing a malicious script. On a vulnerable site, this script would execute for every user who views the comment.'
              : 'Type a script into the search bar. On a vulnerable site, the search term gets reflected back in the page and the script executes.'}
          </p>

          <div className="flex gap-2 mb-4 flex-wrap">
            <span className="text-xs text-slate-500 py-1">Try:</span>
            <PayloadChip label='<script>alert("XSS")</script>' onClick={() => mode === 'comment' ? setComment('<script>alert("XSS")</script>') : setSearchQuery('<script>alert("XSS")</script>')} />
            <PayloadChip label='<img src=x onerror="steal()">' onClick={() => mode === 'comment' ? setComment('<img src=x onerror="document.cookie">') : setSearchQuery('<img src=x onerror="document.cookie">')} />
            <PayloadChip label='<svg onload="alert(1)">' onClick={() => mode === 'comment' ? setComment('<svg onload="alert(1)">') : setSearchQuery('<svg onload="alert(1)">')} />
          </div>

          <form onSubmit={handleAttack}>
            {mode === 'comment' ? (
              <div className="mb-3">
                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1"><HiUser className="text-slate-500" /> Post a Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment (or inject a script)..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono text-sm resize-none"
                />
              </div>
            ) : (
              <div className="mb-3">
                <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1"><HiSearch className="text-slate-500" /> Search</label>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for something (or inject a script)..."
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono text-sm"
                />
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition border-0 cursor-pointer">
              {loading ? 'Submitting...' : mode === 'comment' ? 'Post Comment (Send Attack)' : 'Search (Send Attack)'}
            </button>
          </form>

          {result?.prevention && (result.prevention.original || result.prevention.sanitized) && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <span className="text-xs text-red-400 font-semibold">What attacker sent</span>
                <pre className="text-xs text-red-300 mt-1 m-0 whitespace-pre-wrap break-all font-mono">{result.prevention.original}</pre>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <span className="text-xs text-green-400 font-semibold">What gets stored/displayed</span>
                <pre className="text-xs text-green-300 mt-1 m-0 whitespace-pre-wrap break-all font-mono">{result.prevention.sanitized}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {result && <DefenseResult result={result} />}
    </div>
  );
}

/* ========== BRUTE FORCE LAB ========== */

function BruteForceLab({ addLog }) {
  const [target, setTarget] = useState('admin');
  const [running, setRunning] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [result, setResult] = useState(null);
  const attackRef = useRef(false);

  const PASSWORDS = ['password', '123456', 'admin', 'qwerty', 'letmein', 'welcome', 'abc123', 'monkey', '1234567890', 'password1', 'iloveyou', 'dragon', 'master', 'trustno1', 'baseball'];

  const launchAttack = async () => {
    setRunning(true);
    setAttempts([]);
    setResult(null);
    attackRef.current = true;

    addLog('ATTACKER', `Launching brute force attack on "${target}"`, 'warning');
    addLog('TOOL', `Loading password list: ${PASSWORDS.length} common passwords`, 'warning');

    for (let i = 0; i < PASSWORDS.length; i++) {
      if (!attackRef.current) break;

      const pw = PASSWORDS[i];
      const attempt = { id: i, password: pw, status: 'trying', time: new Date().toLocaleTimeString() };
      setAttempts((prev) => [...prev, attempt]);

      addLog('ATTEMPT', `Try #${i + 1}: password="${pw}"`, 'warning');

      try {
        const res = await api.post('/simulate/brute-force', { username: target, password: pw });
        setAttempts((prev) => prev.map((a) => a.id === i ? { ...a, status: 'blocked' } : a));

        if (i === 4) {
          addLog('DEFENSE', `Account lockout triggered after ${i + 1} attempts!`, 'danger');
          addLog('RATE LIMIT', `IP rate-limited — 15 minute cooldown`, 'success');
          setResult(res.data);
          break;
        }

        addLog('DEFENSE', `Attempt #${i + 1} rejected — invalid credentials`, 'info');
      } catch (err) {
        setAttempts((prev) => prev.map((a) => a.id === i ? { ...a, status: 'rate-limited' } : a));
        addLog('RATE LIMIT', `Request throttled by rate limiter!`, 'danger');
        addLog('DEFENSE', `Brute force attack stopped by rate limiting`, 'success');
        setResult(err.response?.data || {});
        break;
      }

      await new Promise((r) => setTimeout(r, 600));
    }

    setRunning(false);
    attackRef.current = false;
  };

  const stopAttack = () => {
    attackRef.current = false;
    setRunning(false);
    addLog('ATTACKER', 'Attack manually stopped', 'info');
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
        <div className="bg-red-500/10 border-b border-red-500/30 px-5 py-3 flex items-center gap-2">
          <HiExclamation className="text-red-400" />
          <span className="text-sm font-semibold text-red-400">ATTACKER VIEW — Brute Force Login</span>
        </div>
        <div className="p-6">
          <p className="text-slate-400 text-sm mb-4">
            Launch an automated brute force attack against a user account. The system will try common passwords one by one. Watch how the defense system responds.
          </p>

          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-1">Target Username</label>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={running}
              className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={launchAttack}
              disabled={running}
              className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition border-0 cursor-pointer disabled:opacity-50"
            >
              {running ? 'Attack Running...' : 'Launch Brute Force Attack'}
            </button>
            {running && (
              <button onClick={stopAttack} className="px-6 py-3 bg-slate-700 text-white rounded-lg border-0 cursor-pointer hover:bg-slate-600 transition">
                Stop
              </button>
            )}
          </div>

          {attempts.length > 0 && (
            <div className="mt-4 bg-[#0f172a] rounded-lg border border-[#334155] overflow-hidden">
              <div className="px-3 py-2 border-b border-[#334155] flex justify-between">
                <span className="text-xs text-slate-400 font-mono">Attack Progress</span>
                <span className="text-xs text-slate-500">{attempts.length}/{PASSWORDS.length} attempted</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                {attempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-1.5 rounded text-xs font-mono">
                    <span className="text-slate-400">
                      #{a.id + 1} <span className="text-white">"{a.password}"</span>
                    </span>
                    <span className={
                      a.status === 'trying' ? 'text-yellow-400' :
                      a.status === 'blocked' ? 'text-red-400' :
                      'text-orange-400'
                    }>
                      {a.status === 'trying' ? 'TRYING...' : a.status === 'blocked' ? 'REJECTED' : 'RATE LIMITED'}
                    </span>
                  </div>
                ))}
              </div>
              {!running && attempts.length > 0 && (
                <div className="px-3 py-2 border-t border-[#334155] bg-green-500/10">
                  <span className="text-xs text-green-400 font-semibold">ATTACK STOPPED — Defense system activated</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {result && <DefenseResult result={result} />}
    </div>
  );
}

/* ========== FILE UPLOAD LAB ========== */

function FileUploadLab({ addLog }) {
  const [filename, setFilename] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiResult, setApiResult] = useState(null);

  const SAMPLE_FILES = [
    { name: 'backdoor.php', type: 'PHP Script', danger: true },
    { name: 'keylogger.exe', type: 'Executable', danger: true },
    { name: 'shell.sh', type: 'Shell Script', danger: true },
    { name: 'report.pdf', type: 'PDF Document', danger: false },
    { name: 'photo.jpg', type: 'JPEG Image', danger: false },
    { name: 'notes.txt', type: 'Text File', danger: false },
  ];

  const uploadFile = async (fname) => {
    const name = fname || filename;
    if (!name) return;
    setLoading(true);

    addLog('ATTACKER', `Uploading file: "${name}"`, 'warning');
    addLog('UPLOAD', `File size: ${Math.floor(Math.random() * 500 + 50)}KB | Type: ${name.split('.').pop().toUpperCase()}`, 'info');

    try {
      const res = await api.post('/simulate/file-upload', { filename: name });
      const isMalicious = res.data.attack?.is_malicious;
      setApiResult(res.data);

      setResults((prev) => [{ id: Date.now(), name, accepted: !isMalicious }, ...prev]);

      if (isMalicious) {
        addLog('SCANNER', `Dangerous extension detected: .${name.split('.').pop()}`, 'danger');
        addLog('DEFENSE', `File REJECTED — not in allowed extensions whitelist`, 'danger');
        addLog('RESPONSE', 'Attack logged. Threat score updated.', 'success');
      } else {
        addLog('SCANNER', `File extension validated: .${name.split('.').pop()}`, 'success');
        addLog('DEFENSE', `File ACCEPTED — passed all security checks`, 'success');
      }
    } catch (err) {
      addLog('ERROR', 'Upload simulation failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
        <div className="bg-red-500/10 border-b border-red-500/30 px-5 py-3 flex items-center gap-2">
          <HiExclamation className="text-red-400" />
          <span className="text-sm font-semibold text-red-400">ATTACKER VIEW — Malicious File Upload</span>
        </div>
        <div className="p-6">
          <p className="text-slate-400 text-sm mb-4">
            Try to upload malicious files to the server. The system validates file types and blocks dangerous extensions.
          </p>

          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-2">Pick a file to upload:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SAMPLE_FILES.map((f) => (
                <button
                  key={f.name}
                  onClick={() => uploadFile(f.name)}
                  disabled={loading}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition ${
                    f.danger
                      ? 'bg-red-500/5 border-red-500/30 hover:bg-red-500/15'
                      : 'bg-green-500/5 border-green-500/30 hover:bg-green-500/15'
                  }`}
                >
                  <div className="text-sm font-mono text-white">{f.name}</div>
                  <div className={`text-xs mt-0.5 ${f.danger ? 'text-red-400' : 'text-green-400'}`}>{f.type}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500 mb-2">Or type a custom filename:</div>
          <div className="flex gap-2">
            <input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. trojan.bat, image.png..."
              className="flex-1 px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-red-500 font-mono text-sm"
            />
            <button
              onClick={() => uploadFile()}
              disabled={loading || !filename}
              className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition border-0 cursor-pointer disabled:opacity-50"
            >
              Upload
            </button>
          </div>

          {results.length > 0 && (
            <div className="mt-4 space-y-2">
              <span className="text-xs text-slate-400">Upload Results:</span>
              {results.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between px-4 py-2 rounded-lg border ${
                    r.accepted ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <span className="text-sm font-mono text-white">{r.name}</span>
                  <span className={`text-xs font-semibold ${r.accepted ? 'text-green-400' : 'text-red-400'}`}>
                    {r.accepted ? 'ACCEPTED' : 'REJECTED'}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {apiResult && <DefenseResult result={apiResult} />}
    </div>
  );
}

/* ========== SHARED COMPONENTS ========== */

function DefenseResult({ result }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-[#1e293b] rounded-xl border border-green-500/30 overflow-hidden">
        <div className="bg-green-500/10 border-b border-green-500/30 px-5 py-3 flex items-center gap-2">
          <HiShieldCheck className="text-green-400" />
          <span className="text-sm font-semibold text-green-400">DEFENSE REPORT</span>
        </div>
        <div className="p-5 space-y-4">
          {result.attack && (
            <div>
              <h4 className="text-xs font-semibold text-red-400 uppercase mb-2">Attack Details</h4>
              <p className="text-sm text-slate-300 m-0">{result.attack.description}</p>
              {result.attack.risk && <span className="inline-block mt-2 text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">Risk: {result.attack.risk}</span>}
            </div>
          )}
          {result.detection && (
            <div>
              <h4 className="text-xs font-semibold text-yellow-400 uppercase mb-2">Detection</h4>
              <p className="text-sm text-slate-300 m-0">{result.detection.method}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${result.detection.detected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                <span className="text-xs text-slate-400">{result.detection.detected ? 'Successfully Detected' : 'Not Detected'}</span>
              </div>
            </div>
          )}
          {result.prevention && (
            <div>
              <h4 className="text-xs font-semibold text-green-400 uppercase mb-2">Prevention — {result.prevention.method}</h4>
              <p className="text-sm text-slate-300 m-0">{result.prevention.description}</p>
              {result.prevention.techniques && (
                <ul className="mt-2 space-y-1 m-0 pl-0 list-none">
                  {result.prevention.techniques.map((t, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">&#x2713;</span> {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {result.response && (
            <div className="pt-3 border-t border-[#334155]">
              <span className="text-xs text-cyan-400">{result.response.action}</span>
              {result.response.log_id && <span className="text-xs text-slate-500 ml-2">Log #{result.response.log_id}</span>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PayloadChip({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300 font-mono hover:bg-red-500/20 transition cursor-pointer"
    >
      {label}
    </button>
  );
}
