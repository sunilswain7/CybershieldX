import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { HiShieldCheck, HiLightningBolt, HiEye, HiChartBar } from 'react-icons/hi';

const features = [
  { icon: <HiLightningBolt className="text-red-400 text-3xl" />, title: 'Attack Simulation', desc: 'Safely simulate 10 real-world cyber attacks and see how they work' },
  { icon: <HiShieldCheck className="text-green-400 text-3xl" />, title: 'Real-Time Detection', desc: 'Pattern matching engine detects SQL injection, XSS, CSRF, and more' },
  { icon: <HiEye className="text-yellow-400 text-3xl" />, title: '5-Level Response', desc: 'Automated response escalation from logging to IP blocking' },
  { icon: <HiChartBar className="text-cyan-400 text-3xl" />, title: 'Live Dashboard', desc: 'Visual analytics showing blocked attacks, threat scores, and timelines' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex justify-center mb-6">
              <HiShieldCheck className="text-cyan-400 text-6xl" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              CyberShield X
            </h1>
            <p className="text-xl text-slate-300 mb-2">Interactive Cyber Defense Command Center</p>
            <p className="text-slate-400 max-w-2xl mx-auto mb-8">
              Simulate real-world cyber attacks, watch them get detected and blocked in real time,
              and visualize the complete defense process through a live monitoring dashboard.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {isAuthenticated ? (
                <>
                  <Link to="/simulator" className="px-8 py-3 bg-cyan-500 text-white font-semibold rounded-xl hover:bg-cyan-600 transition no-underline">
                    Launch Simulator
                  </Link>
                  <Link to="/dashboard" className="px-8 py-3 border border-cyan-500/50 text-cyan-400 font-semibold rounded-xl hover:bg-cyan-500/10 transition no-underline">
                    View Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="px-8 py-3 bg-cyan-500 text-white font-semibold rounded-xl hover:bg-cyan-600 transition no-underline">
                    Get Started
                  </Link>
                  <Link to="/login" className="px-8 py-3 border border-cyan-500/50 text-cyan-400 font-semibold rounded-xl hover:bg-cyan-500/10 transition no-underline">
                    Login
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#1e293b] p-6 rounded-xl border border-[#334155] hover:border-cyan-500/30 transition"
              >
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm m-0">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 border-t border-[#334155]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8 text-white">Attacks Covered</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['SQL Injection', 'Reflected XSS', 'Stored XSS', 'DOM XSS', 'CSRF', 'Brute Force', 'Dictionary Attack', 'Session Hijacking', 'Phishing', 'File Upload Attack'].map((a) => (
              <span key={a} className="px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-full text-sm text-slate-300">
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
