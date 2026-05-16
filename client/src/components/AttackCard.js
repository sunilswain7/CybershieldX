import React from 'react';
import { motion } from 'framer-motion';

const severityColors = {
  Critical: 'border-red-500 bg-red-500/10',
  High: 'border-orange-500 bg-orange-500/10',
  Medium: 'border-yellow-500 bg-yellow-500/10',
  Low: 'border-green-500 bg-green-500/10',
};

const severityBadge = {
  Critical: 'bg-red-500/20 text-red-400',
  High: 'bg-orange-500/20 text-orange-400',
  Medium: 'bg-yellow-500/20 text-yellow-400',
  Low: 'bg-green-500/20 text-green-400',
};

export default function AttackCard({ title, description, risk, icon, onSimulate, loading }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`p-6 rounded-xl border-l-4 ${severityColors[risk] || severityColors.Medium} bg-[#1e293b] cursor-pointer`}
      onClick={!loading ? onSimulate : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold text-white m-0">{title}</h3>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${severityBadge[risk]}`}>
          {risk}
        </span>
      </div>
      <p className="text-slate-400 text-sm m-0 mb-4">{description}</p>
      <button
        disabled={loading}
        className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all border-0 cursor-pointer ${
          loading
            ? 'bg-slate-700 text-slate-400 cursor-wait'
            : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
        }`}
      >
        {loading ? 'Simulating...' : 'Simulate Attack'}
      </button>
    </motion.div>
  );
}
