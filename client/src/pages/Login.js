import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { HiShieldCheck, HiLockClosed, HiExclamationCircle } from 'react-icons/hi';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [attackInfo, setAttackInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setAttackInfo(null);
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || 'Login failed');
      if (data?.attack_detected || data?.account_locked) {
        setAttackInfo(data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <HiShieldCheck className="text-cyan-400 text-5xl mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-slate-400 text-sm">Login to CyberShield X Command Center</p>
        </div>

        <div className="bg-[#1e293b] rounded-2xl p-8 border border-[#334155]">
          <div className="flex items-center gap-2 mb-6 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
            <HiShieldCheck className="text-cyan-400 flex-shrink-0" />
            <span className="text-xs text-cyan-300">Verified domain: cybershield-x.localhost — You are on the real site</span>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <HiExclamationCircle />
                {error}
              </div>
              {attackInfo?.attempts_remaining !== undefined && (
                <p className="text-xs text-red-300 mt-1 m-0">Attempts remaining: {attackInfo.attempts_remaining}</p>
              )}
            </motion.div>
          )}

          {attackInfo?.defense && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="text-xs text-yellow-300">
                <HiLockClosed className="inline mr-1" />
                Defense: {attackInfo.defense}
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition disabled:opacity-50 border-0 cursor-pointer text-base"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6 m-0">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 no-underline">Register</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
