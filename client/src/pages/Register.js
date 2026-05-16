import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { HiShieldCheck, HiExclamationCircle } from 'react-icons/hi';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [attackInfo, setAttackInfo] = useState(null);
  const [strength, setStrength] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const checkPassword = async (password) => {
    if (password.length < 3) { setStrength(null); return; }
    try {
      const res = await api.post('/auth/check-password', { password });
      setStrength(res.data);
    } catch {}
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'password') checkPassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setAttackInfo(null);
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || 'Registration failed');
      if (data?.attack_detected) setAttackInfo(data);
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = { weak: 'bg-red-500', medium: 'bg-yellow-500', strong: 'bg-green-500' };
  const strengthWidth = { weak: 'w-1/3', medium: 'w-2/3', strong: 'w-full' };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <HiShieldCheck className="text-cyan-400 text-5xl mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm">Join CyberShield X Command Center</p>
        </div>

        <div className="bg-[#1e293b] rounded-2xl p-8 border border-[#334155]">
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 text-sm"><HiExclamationCircle /> {error}</div>
            </motion.div>
          )}

          {attackInfo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="text-xs text-yellow-300">
                Attack Detected: {attackInfo.attack_detected} — {attackInfo.defense}
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <input name="username" type="text" value={form.username} onChange={handleChange} required
                className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="Choose a username" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required
                className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required
                className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="Create a strong password" />
              {strength && (
                <div className="mt-2">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strengthColor[strength.strength]} ${strengthWidth[strength.strength]}`}></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className={`text-xs ${strength.strength === 'weak' ? 'text-red-400' : strength.strength === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                      {strength.strength.charAt(0).toUpperCase() + strength.strength.slice(1)}
                    </span>
                    <span className="text-xs text-slate-500">{strength.score}/5</span>
                  </div>
                  {strength.isCommon && (
                    <p className="text-xs text-red-400 mt-1 m-0">This is a commonly used password — vulnerable to dictionary attacks!</p>
                  )}
                  <div className="mt-2 space-y-1">
                    {Object.entries(strength.checks || {}).map(([key, passed]) => (
                      <div key={key} className="text-xs flex items-center gap-1">
                        <span className={passed ? 'text-green-400' : 'text-slate-500'}>{passed ? '✓' : '✗'}</span>
                        <span className={passed ? 'text-slate-300' : 'text-slate-500'}>
                          {key === 'length' ? '8+ characters' : key === 'uppercase' ? 'Uppercase letter' : key === 'lowercase' ? 'Lowercase letter' : key === 'number' ? 'Number' : 'Special character'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition disabled:opacity-50 border-0 cursor-pointer text-base">
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6 m-0">
            Already have an account? <Link to="/login" className="text-cyan-400 hover:text-cyan-300 no-underline">Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
