import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { HiShieldCheck, HiMenu, HiX } from 'react-icons/hi';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = isAuthenticated
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/simulator', label: 'Attack Simulator' },
        { to: '/logs', label: 'Logs' },
        { to: '/profile', label: 'Profile' },
      ]
    : [
        { to: '/login', label: 'Login' },
        { to: '/register', label: 'Register' },
      ];

  return (
    <nav className="bg-[#1e293b] border-b border-[#334155] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <HiShieldCheck className="text-cyan-400 text-2xl" />
            <span className="text-xl font-bold text-white">CyberShield X</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium no-underline transition-colors ${
                  location.pathname === link.to
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <button
                onClick={logout}
                className="ml-4 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer bg-transparent border-0"
              >
                Logout
              </button>
            )}
          </div>

          <button
            className="md:hidden text-slate-300 bg-transparent border-0 cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-[#1e293b] border-t border-[#334155]"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-sm no-underline ${
                    location.pathname === link.to
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && (
                <>
                  <div className="text-xs text-slate-500 px-4 pt-2">
                    Logged in as {user?.username}
                  </div>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="block w-full text-left px-4 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/20 bg-transparent border-0 cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
