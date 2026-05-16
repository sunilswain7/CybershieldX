import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { HiDocumentText, HiFilter } from 'react-icons/hi';

const ATTACK_TYPES = [
  'SQL_INJECTION', 'REFLECTED_XSS', 'STORED_XSS', 'DOM_XSS', 'CSRF',
  'BRUTE_FORCE', 'DICTIONARY_ATTACK', 'SESSION_HIJACK', 'PHISHING', 'FILE_UPLOAD',
];

const severityBadge = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-green-500/20 text-green-400',
};

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 20 };
        if (filter) params.type = filter;
        const res = await api.get('/dashboard/logs', { params });
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page, filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <HiDocumentText className="text-cyan-400" />
              Attack Logs
            </h1>
            <p className="text-slate-400 mt-1">Complete history of detected attacks</p>
          </div>
          <div className="flex items-center gap-2">
            <HiFilter className="text-slate-400" />
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500 text-sm"
            >
              <option value="">All Types</option>
              {ATTACK_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-400"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              No attack logs found. Run some simulations to generate data.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#334155]">
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">ID</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Type</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Payload</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Severity</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">IP</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30 transition">
                        <td className="py-3 px-4 text-sm text-slate-400">#{log.id}</td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-white">{log.attack_type?.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-400 font-mono max-w-[200px] truncate block">
                            {log.payload?.substring(0, 50) || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${severityBadge[log.severity] || severityBadge.medium}`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-xs text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-400 font-mono">{log.source_ip}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#334155]">
                  <span className="text-sm text-slate-400">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 bg-[#0f172a] border border-[#334155] rounded text-sm text-slate-300 disabled:opacity-50 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                      disabled={page >= pagination.pages}
                      className="px-3 py-1 bg-[#0f172a] border border-[#334155] rounded text-sm text-slate-300 disabled:opacity-50 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
