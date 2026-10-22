import React, { useState, useEffect, useRef } from 'react';
import { Tag, Sparkles, X, Keyboard, Check, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActivityCatalogItem, Itinerary } from '../../types';
import { ShiftKeywordAutoInsertModal } from './ShiftKeywordAutoInsertModal';

interface ShiftKeywordListenerProps {
  trip: Itinerary;
  activeDayId?: string;
}

export const ShiftKeywordListener: React.FC<ShiftKeywordListenerProps> = ({
  trip,
  activeDayId,
}) => {
  const { activityCatalog, addActivityToDay, deleteActivityFromDay, setActiveView } = useApp();

  const [buffer, setBuffer] = useState<string>('');
  const [isHudVisible, setIsHudVisible] = useState(false);
  const [matchedItem, setMatchedItem] = useState<ActivityCatalogItem | null>(null);
  const [matchedKeyword, setMatchedKeyword] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [instantAutoAdd, setInstantAutoAdd] = useState<boolean>(true);
  const [lastInsertedInfo, setLastInsertedInfo] = useState<{
    dayId: string;
    activityId: string;
    activityTitle: string;
    item: ActivityCatalogItem;
  } | null>(null);

  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Activities with keywords
  const activitiesWithKeywords = React.useMemo(() => {
    return activityCatalog.filter((a) => Boolean(a.keyword?.trim()));
  }, [activityCatalog]);

  // Real-time matched suggestions as user types with Shift
  const currentMatches = React.useMemo(() => {
    if (!buffer.trim()) return [];
    const buf = buffer.trim().toLowerCase();
    return activitiesWithKeywords.filter((a) => {
      const kw = (a.keyword || '').toLowerCase();
      return kw.startsWith(buf) || kw === buf;
    });
  }, [activitiesWithKeywords, buffer]);

  // Global Shift + typing listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is inside an input, textarea or contentEditable
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isInput) return;

      // Handle Escape to clear typing buffer
      if (e.key === 'Escape') {
        if (buffer) {
          setBuffer('');
          setIsHudVisible(false);
        }
        return;
      }

      // Handle Backspace when buffer has content
      if (e.key === 'Backspace' && buffer.length > 0) {
        e.preventDefault();
        const nextBuf = buffer.slice(0, -1);
        setBuffer(nextBuf);
        if (!nextBuf) {
          setIsHudVisible(false);
        }
        return;
      }

      // Detect typing while holding Shift:
      // Note: e.shiftKey must be true, and e.key must be a printable single character
      if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key.length === 1 && /[a-zA-Z0-9_-]/.test(e.key)) {
          const char = e.key.toLowerCase();
          const nextBuf = (buffer + char).trim();
          setBuffer(nextBuf);
          setIsHudVisible(true);

          // Reset clear timer (auto-clears buffer after 3.5 seconds of inactivity)
          if (clearTimerRef.current) {
            clearTimeout(clearTimerRef.current);
          }
          clearTimerRef.current = setTimeout(() => {
            setBuffer('');
            setIsHudVisible(false);
          }, 3500);

          // Check if nextBuf EXACTLY matches any activity's keyword!
          const exactMatch = activitiesWithKeywords.find(
            (a) => (a.keyword || '').toLowerCase() === nextBuf
          );

          if (exactMatch) {
            if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
            setBuffer('');
            setIsHudVisible(false);

            if (instantAutoAdd) {
              const targetDay = trip.days.find((d) => d.id === activeDayId) || trip.days[0];
              if (targetDay) {
                // Determine sensible time slot:
                let startH = 10;
                if (targetDay.activities && targetDay.activities.length > 0) {
                  const lastAct = targetDay.activities[targetDay.activities.length - 1];
                  const lastEndH = parseInt(lastAct.endTime.split(':')[0], 10);
                  if (!isNaN(lastEndH) && lastEndH < 21) {
                    startH = Math.max(8, lastEndH);
                  }
                }
                const dur = Math.max(1, Math.round(exactMatch.durationHours));
                const endH = Math.min(23, startH + dur);
                const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
                const startTime = `${pad(startH)}:00`;
                const endTime = `${pad(endH)}:00`;

                const newActId = `act-${Date.now()}`;
                const newAct = {
                  id: newActId,
                  title: exactMatch.name,
                  description: exactMatch.description,
                  startTime,
                  endTime,
                  timeSlot: `${startTime} - ${endTime}`,
                  location: exactMatch.location || trip.destination,
                  category: exactMatch.category,
                  supplierId: exactMatch.supplierId,
                  costEstimate: exactMatch.costEstimate || 250,
                  currency: trip.currency,
                  included: exactMatch.included ?? true,
                  bookingStatus: 'to be booked' as const,
                };

                addActivityToDay(trip.id, targetDay.id, newAct);
                setLastInsertedInfo({
                  dayId: targetDay.id,
                  activityId: newActId,
                  activityTitle: exactMatch.name,
                  item: exactMatch,
                });
                setSuccessToast(`⚡ Automatically added "${exactMatch.name}" to Day ${targetDay.dayNumber} via Shift+"${exactMatch.keyword}"!`);
                setTimeout(() => setSuccessToast(null), 6000);
                return;
              }
            }

            // Fallback or if instantAutoAdd is off:
            setMatchedItem(exactMatch);
            setMatchedKeyword(exactMatch.keyword || nextBuf);
            setIsModalOpen(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, [buffer, activitiesWithKeywords]);

  const handleManualTrigger = (item: ActivityCatalogItem) => {
    setIsCheatSheetOpen(false);
    setMatchedItem(item);
    setMatchedKeyword(item.keyword || '');
    setIsModalOpen(true);
  };

  const handleInserted = (name: string) => {
    setSuccessToast(`✨ Added "${name}" to itinerary via Shift + "${matchedKeyword}"!`);
    setTimeout(() => setSuccessToast(null), 4500);
  };

  return (
    <>
      {/* FLOATING SUCCESS TOAST */}
      {successToast && (
        <div className="fixed top-20 right-8 z-50 p-4 bg-emerald-950 text-white rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-3 animate-fade-in max-w-md">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black">Activity Auto-Added</div>
            <div className="text-[11px] text-emerald-200">{successToast}</div>
          </div>
          {lastInsertedInfo && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  deleteActivityFromDay(trip.id, lastInsertedInfo.dayId, lastInsertedInfo.activityId);
                  setSuccessToast(`Undone: Removed "${lastInsertedInfo.activityTitle}"`);
                  setLastInsertedInfo(null);
                  setTimeout(() => setSuccessToast(null), 3000);
                }}
                className="px-2 py-1 bg-emerald-800 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg border border-emerald-600 transition-colors"
                title="Undo adding this activity"
              >
                Undo
              </button>
            </div>
          )}
          <button
            onClick={() => setSuccessToast(null)}
            className="ml-1 text-emerald-300 hover:text-white text-base"
          >
            &times;
          </button>
        </div>
      )}

      {/* FLOATING SHIFT TYPING HUD (Appears in real-time as user holds Shift and types) */}
      {isHudVisible && buffer && (
        <div className="fixed bottom-6 right-8 z-50 bg-slate-950/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border-2 border-amber-400/80 max-w-sm w-full animate-slide-up">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                Shift + Typing Keyword
              </span>
            </div>
            <button
              onClick={() => {
                setBuffer('');
                setIsHudVisible(false);
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-2.5">
            <div className="text-xs text-slate-400">Current Typed Buffer:</div>
            <div className="text-xl font-mono font-black text-amber-300 tracking-wider">
              Shift + &quot;{buffer}&quot;
            </div>
          </div>

          {/* Instant Auto-Add Mode Switcher */}
          <div className="flex items-center justify-between pt-1 pb-2 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400">Typing behavior:</span>
            <button
              type="button"
              onClick={() => setInstantAutoAdd(!instantAutoAdd)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase transition-all ${
                instantAutoAdd
                  ? 'bg-amber-400 text-slate-950 shadow-2xs'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {instantAutoAdd ? '⚡ Instant Auto-Add: ON' : 'Prompt Dialog: ON'}
            </button>
          </div>

          {/* Suggestions */}
          {currentMatches.length > 0 ? (
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                Matching Activity Keywords:
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {currentMatches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleManualTrigger(m)}
                    className="w-full text-left p-2 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold leading-tight line-clamp-1">
                        {m.name}
                      </div>
                      <div className="text-[10px] text-slate-400 group-hover:text-slate-800 font-mono">
                        Keyword: <strong>{m.keyword}</strong> ({m.durationHours}h)
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 italic pt-1">
              Keep typing to match linked activity keywords (e.g. masada, deadsea, wine)...
            </div>
          )}
        </div>
      )}

      {/* SHIFT KEYWORD AUTO-INSERT MODAL */}
      <ShiftKeywordAutoInsertModal
        isOpen={isModalOpen}
        matchedActivity={matchedItem}
        matchedKeyword={matchedKeyword}
        trip={trip}
        activeDayId={activeDayId}
        onClose={() => setIsModalOpen(false)}
        onInserted={handleInserted}
      />

      {/* CHEAT SHEET DRAWER / MODAL */}
      {isCheatSheetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Shift + Keyword Shortcuts Library
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Hold Shift and type any keyword below to auto-insert that activity!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCheatSheetOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 leading-relaxed flex items-start gap-2">
              <Keyboard className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>How to use:</strong> While in this itinerary builder, simply hold down <kbd className="px-1.5 py-0.5 bg-white border border-amber-300 rounded font-mono font-bold text-slate-900">Shift</kbd> and type the keyword (e.g. <em>masada</em>). The activity will immediately be added with its full narrative description, duration, and prompt for booking status!
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-black uppercase text-slate-700 tracking-wider">
                Active Linked Keywords ({activitiesWithKeywords.length})
              </div>

              {activitiesWithKeywords.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No activities have keywords linked yet. Open the Activity Library to link keywords!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activitiesWithKeywords.map((act) => (
                    <div
                      key={act.id}
                      onClick={() => handleManualTrigger(act)}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all cursor-pointer group flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 font-mono font-black text-xs border border-amber-300">
                            Shift + &quot;{act.keyword}&quot;
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold">
                            {act.durationHours}h
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-900 leading-tight">
                          {act.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {act.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">Click to insert</span>
                        <span className="text-amber-700 font-bold flex items-center gap-0.5">
                          <span>Auto-Insert</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsCheatSheetOpen(false);
                  setActiveView('activities');
                }}
                className="text-xs text-amber-700 hover:text-amber-900 font-bold underline"
              >
                Go to Activity Library to link more keywords &rarr;
              </button>

              <button
                type="button"
                onClick={() => setIsCheatSheetOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
