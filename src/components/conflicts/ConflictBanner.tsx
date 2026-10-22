import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ConflictBanner: React.FC = () => {
  const { conflicts, setActiveView } = useApp();

  if (conflicts.length === 0) return null;

  const criticalConflicts = conflicts.filter((c) => c.severity === 'CRITICAL');
  const hasLoneProviderClash = conflicts.some(
    (c) => c.type === 'LONE_PROVIDER_DOUBLE_BOOKING'
  );

  return (
    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white px-6 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
      <div className="flex items-center space-x-3">
        <div className="p-1.5 bg-white/20 rounded-lg shrink-0">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-extrabold uppercase tracking-wide mr-2 text-amber-200">
            {hasLoneProviderClash ? 'Lone Provider Clash Detected' : 'Schedule Conflict Detected'}:
          </span>
          <span>
            {conflicts[0]?.title} — {conflicts[0]?.description.slice(0, 110)}...
          </span>
          {conflicts.length > 1 && (
            <span className="ml-2 font-bold bg-black/20 px-2 py-0.5 rounded-full text-xs">
              +{conflicts.length - 1} more
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => setActiveView('conflicts')}
        className="flex items-center space-x-1.5 bg-white text-red-700 hover:bg-amber-50 px-3.5 py-1.5 rounded-md font-bold text-xs shadow-xs transition-colors shrink-0"
      >
        <span>Inspect & Resolve Conflicts</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
