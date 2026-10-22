import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Users,
  Compass,
  ArrowRight,
  ShieldAlert,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConflictNotice } from '../../types';

export const ConflictView: React.FC = () => {
  const { conflicts, resolveConflict, suppliers, itineraries, setActiveView, setSelectedTripId } = useApp();
  const [selectedConflict, setSelectedConflict] = useState<ConflictNotice | null>(
    conflicts[0] || null
  );
  const [resolutionSuccess, setResolutionSuccess] = useState<string | null>(null);

  const handleResolve = (conflict: ConflictNotice) => {
    // Find alternative supplier or clear clash
    const altGuide = suppliers.find((s) => s.category === 'Guide' && !s.isLoneProvider);
    resolveConflict(conflict, altGuide?.id);
    setResolutionSuccess(`Successfully resolved conflict for ${conflict.supplierName || 'itinerary'}!`);
    setTimeout(() => setResolutionSuccess(null), 4000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800">
              Module 8: Conflict Engine
            </span>
            <span className="text-xs text-slate-500 font-medium">Real-Time Schedule Auditing</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            Schedule Clash & Lone Provider Protection
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Automated conflict engine detects overlapping client schedules and safeguards exclusive
            <strong className="text-amber-800 font-semibold"> &ldquo;Lone Providers&rdquo;</strong> (specialist historians, private yachts, single luxury vans) from being double-booked across different tours.
          </p>
        </div>
      </div>

      {resolutionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center space-x-3 text-sm font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{resolutionSuccess}</span>
        </div>
      )}

      {/* Lone Provider Explanation Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-5 flex items-start space-x-4">
        <div className="p-2.5 bg-amber-500/20 text-amber-800 rounded-xl shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-xs sm:text-sm text-slate-700 space-y-1">
          <div className="font-bold text-amber-950 flex items-center gap-2">
            What is a &ldquo;Lone Provider&rdquo; in Tourism Operations?
          </div>
          <p>
            A <strong>Lone Provider</strong> is an individual specialist guide (e.g., world-renowned archaeologist Dr. Avi Ron), a unique vessel (e.g., custom 68ft Riva yacht), or a single custom vehicle (e.g., bespoke Mercedes Maybach Sprinter) that cannot physically service two clients at the same time. The engine prevents double-booking disputes and ensures VIP reliability.
          </p>
        </div>
      </div>

      {conflicts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">All Schedules & Lone Providers are Clear</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            No double bookings, supplier overlaps, or activity timing clashes were detected across your active itineraries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conflicts List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Active Detected Clashes ({conflicts.length})
            </div>
            {conflicts.map((c) => {
              const isSelected = selectedConflict?.id === c.id;
              const isCritical = c.severity === 'CRITICAL';
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedConflict(c)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-red-500 bg-red-50/60 ring-2 ring-red-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isCritical ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.severity}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {c.date}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{c.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">{c.description}</p>
                </div>
              );
            })}
          </div>

          {/* Conflict Detail and Resolution Card */}
          <div className="lg:col-span-2">
            {selectedConflict ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-3 rounded-xl ${
                        selectedConflict.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-red-700">
                        {selectedConflict.type.replace(/_/g, ' ')}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                        {selectedConflict.title}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed">
                  {selectedConflict.description}
                </div>

                {/* Itineraries Involved */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      First Assignment (Primary Trip)
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {selectedConflict.tripCode1}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Date: {selectedConflict.date}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTripId(selectedConflict.tripId1);
                        setActiveView('builder');
                      }}
                      className="mt-3 text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                    >
                      <span>Open Itinerary Editor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {selectedConflict.tripId2 && (
                    <div className="p-4 rounded-xl border border-red-200 bg-red-50/40">
                      <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-2">
                        Clashing Assignment (Concurrent Trip)
                      </div>
                      <div className="text-base font-bold text-slate-900">
                        {selectedConflict.tripCode2}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Date: {selectedConflict.date}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTripId(selectedConflict.tripId2!);
                          setActiveView('builder');
                        }}
                        className="mt-3 text-xs font-semibold text-red-700 hover:text-red-800 flex items-center gap-1"
                      >
                        <span>Open Itinerary Editor</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Resolution Action Box */}
                <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm mb-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Recommended Resolution</span>
                  </div>
                  <p className="text-xs text-slate-700 mb-4">{selectedConflict.resolutionHint}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleResolve(selectedConflict)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>One-Click Reassign &amp; Resolve Clash</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTripId(selectedConflict.tripId1);
                        setActiveView('builder');
                      }}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg transition-all"
                    >
                      Manually Modify Schedule Times
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
