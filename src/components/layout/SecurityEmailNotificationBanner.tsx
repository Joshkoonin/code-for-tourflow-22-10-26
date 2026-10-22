import React, { useState } from 'react';
import { Mail, Check, Copy, X, Key, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SecurityEmailNotificationBanner: React.FC = () => {
  const { latestSecurityAlertEmail, dismissSecurityAlertEmail } = useApp();
  const [copied, setCopied] = useState(false);

  if (!latestSecurityAlertEmail) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(latestSecurityAlertEmail.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed top-4 right-4 z-70 max-w-md w-full bg-slate-900 text-white rounded-3xl p-4 shadow-2xl border border-amber-400/40 animate-slide-down">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-md shadow-amber-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                Security Email Dispatched
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {latestSecurityAlertEmail.timestamp}
              </span>
            </div>
            <h4 className="font-extrabold text-xs text-white mt-1 truncate">
              {latestSecurityAlertEmail.subject}
            </h4>
            <div className="text-[11px] text-slate-300 mt-0.5">
              To: <strong className="text-amber-300 font-mono">{latestSecurityAlertEmail.to}</strong> ({latestSecurityAlertEmail.staffName})
            </div>
          </div>
        </div>

        <button
          onClick={dismissSecurityAlertEmail}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          title="Dismiss email alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Security Code Callout */}
      <div className="mt-3 p-3 bg-slate-800/90 rounded-2xl border border-slate-700/80 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            One-Time Verification Code:
          </div>
          <div className="text-xl font-mono font-black text-amber-400 tracking-widest mt-0.5">
            {latestSecurityAlertEmail.code}
          </div>
        </div>

        <button
          onClick={handleCopyCode}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            copied
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Code'}</span>
        </button>
      </div>

      <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Valid for 15 minutes</span>
        </span>
        <button
          onClick={dismissSecurityAlertEmail}
          className="text-amber-400 hover:underline cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
