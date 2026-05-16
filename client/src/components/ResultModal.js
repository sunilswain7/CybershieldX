import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiShieldCheck, HiExclamation, HiLightningBolt } from 'react-icons/hi';

export default function ResultModal({ result, onClose }) {
  if (!result) return null;

  const data = result;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1e293b] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-[#334155]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-[#1e293b] border-b border-[#334155] p-4 flex items-center justify-between rounded-t-2xl">
            <h2 className="text-lg font-bold text-white m-0 flex items-center gap-2">
              <HiShieldCheck className="text-cyan-400" />
              {data.simulation?.replace(/_/g, ' ') || 'Attack Result'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white bg-transparent border-0 cursor-pointer">
              <HiX size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {data.attack && (
              <Section title="Attack Details" icon={<HiExclamation className="text-red-400" />} color="red">
                {data.attack.payload && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                    <span className="text-xs text-red-400 font-medium">Payload</span>
                    <pre className="text-red-300 text-sm m-0 mt-1 whitespace-pre-wrap break-all">{data.attack.payload}</pre>
                  </div>
                )}
                <p className="text-slate-300 text-sm m-0">{data.attack.description}</p>
                {data.attack.risk && (
                  <div className="mt-2 text-sm">
                    <span className="text-slate-500">Risk Level: </span>
                    <span className="text-red-400 font-medium">{data.attack.risk}</span>
                  </div>
                )}
                {data.attack.example && (
                  <div className="mt-2 text-sm text-slate-400">
                    <span className="text-slate-500">Example: </span>{data.attack.example}
                  </div>
                )}
              </Section>
            )}

            {data.detection && (
              <Section title="Detection" icon={<HiLightningBolt className="text-yellow-400" />} color="yellow">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${data.detection.detected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  <span className="text-sm text-slate-300">
                    {data.detection.detected ? 'Attack Detected Successfully' : 'Not Detected'}
                  </span>
                </div>
                <p className="text-slate-400 text-sm m-0">{data.detection.method}</p>
              </Section>
            )}

            {data.prevention && (
              <Section title="Prevention" icon={<HiShieldCheck className="text-green-400" />} color="green">
                <div className="text-sm mb-2">
                  <span className="text-green-400 font-medium">{data.prevention.method}</span>
                </div>
                <p className="text-slate-400 text-sm m-0">{data.prevention.description}</p>
                {data.prevention.techniques && (
                  <ul className="mt-3 space-y-1">
                    {data.prevention.techniques.map((t, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">&#x2713;</span> {t}
                      </li>
                    ))}
                  </ul>
                )}
                {data.prevention.original && data.prevention.sanitized && (
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <div className="bg-red-500/10 rounded p-2">
                      <span className="text-xs text-red-400">Original (dangerous)</span>
                      <pre className="text-red-300 text-xs m-0 mt-1 break-all whitespace-pre-wrap">{data.prevention.original}</pre>
                    </div>
                    <div className="bg-green-500/10 rounded p-2">
                      <span className="text-xs text-green-400">Sanitized (safe)</span>
                      <pre className="text-green-300 text-xs m-0 mt-1 break-all whitespace-pre-wrap">{data.prevention.sanitized}</pre>
                    </div>
                  </div>
                )}
              </Section>
            )}

            {data.response && (
              <Section title="Response" icon={<HiShieldCheck className="text-cyan-400" />} color="cyan">
                <p className="text-slate-300 text-sm m-0">{data.response.action}</p>
                {data.response.log_id && (
                  <div className="mt-2 text-xs text-slate-500">Log ID: #{data.response.log_id}</div>
                )}
              </Section>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Section({ title, icon, children, color }) {
  const borderColor = {
    red: 'border-red-500/30',
    yellow: 'border-yellow-500/30',
    green: 'border-green-500/30',
    cyan: 'border-cyan-500/30',
  };
  return (
    <div className={`border ${borderColor[color]} rounded-xl p-4`}>
      <h3 className="text-sm font-semibold text-white m-0 mb-3 flex items-center gap-2">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}
