import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { HiUser, HiShieldCheck, HiClock } from 'react-icons/hi';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <HiUser className="text-cyan-400" />
          Profile
        </h1>

        <div className="bg-[#1e293b] rounded-2xl p-8 border border-[#334155]">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-cyan-400">{user.username?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white m-0">{user.username}</h2>
              <p className="text-slate-400 text-sm m-0">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <InfoRow icon={<HiUser className="text-cyan-400" />} label="Role" value={user.role || 'user'} />
            <InfoRow icon={<HiShieldCheck className="text-green-400" />} label="MFA" value={user.mfa_enabled ? 'Enabled' : 'Disabled'} />
            <InfoRow icon={<HiClock className="text-yellow-400" />} label="Member since" value={new Date(user.created_at).toLocaleDateString()} />
          </div>

          <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <h3 className="text-sm font-medium text-cyan-400 m-0 mb-2">Security Features Active</h3>
            <ul className="space-y-1 m-0 p-0 list-none">
              {['Password hashed with bcrypt (cost 12)', 'JWT token authentication', 'Session tracking with IP binding', 'Account lockout after 5 failed attempts', 'Rate limiting on login endpoint'].map((f) => (
                <li key={f} className="text-xs text-slate-300 flex items-center gap-2">
                  <span className="text-green-400">&#x2713;</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#334155]">
      <div className="flex items-center gap-2 text-slate-400 text-sm">{icon} {label}</div>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  );
}
