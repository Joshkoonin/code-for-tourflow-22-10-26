import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Tag,
  Clock,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Info,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { ActivityCatalogItem, Itinerary, ItineraryActivity } from '../../types';
import { useApp } from '../../context/AppContext';

interface ShiftKeywordAutoInsertModalProps {
  isOpen: boolean;
  matchedActivity: ActivityCatalogItem | null;
  matchedKeyword: string;
  trip: Itinerary;
  activeDayId?: string;
  onClose: () => void;
  onInserted?: (activityName: string) => void;
}

export const ShiftKeywordAutoInsertModal: React.FC<ShiftKeywordAutoInsertModalProps> = ({
  isOpen,
  matchedActivity,
  matchedKeyword,
  trip,
  activeDayId,
  onClose,
  onInserted,
}) => {
  const { staff, suppliers, addActivityToDay } = useApp();

  const [bookingStatus, setBookingStatus] = useState<'to be booked' | 'booking requested' | 'confirmed'>('to be booked');
  const [targetDayId, setTargetDayId] = useState<string>(activeDayId || trip.days[0]?.id || '');
  const [startTime, setStartTime] = useState<string>('10:00');
  const [assignedStaffId, setAssignedStaffId] = useState<string>('');
  const [bookingDeadline, setBookingDeadline] = useState<string>('');
  const [bookingTimeframe, setBookingTimeframe] = useState<string>('Within 48 hours');
  const [followUpDate, setFollowUpDate] = useState<string>('');

  useEffect(() => {
    if (activeDayId) {
      setTargetDayId(activeDayId);
    } else if (trip.days[0]?.id) {
      setTargetDayId(trip.days[0].id);
    }
  }, [activeDayId, trip.days]);

  useEffect(() => {
    if (isOpen) {
      // Set reasonable defaults for dates
      const today = new Date().toISOString().split('T')[0];
      setBookingDeadline(today);
      setFollowUpDate(today);
    }
  }, [isOpen]);

  if (!isOpen || !matchedActivity) return null;

  // Calculate end time based on duration
  const [startH, startM] = startTime.split(':').map(Number);
  const totalStartMinutes = (startH || 10) * 60 + (startM || 0);
  const totalEndMinutes = Math.min(23 * 60 + 59, totalStartMinutes + Math.round(matchedActivity.durationHours * 60));
  const endH = Math.floor(totalEndMinutes / 60);
  const endM = totalEndMinutes % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const endTime = `${pad(endH)}:${pad(endM)}`;

  const targetDay = trip.days.find((d) => d.id === targetDayId) || trip.days[0];
  const supplier = suppliers.find((s) => s.id === matchedActivity.supplierId);

  const handleConfirmInsert = () => {
    const newActivity: ItineraryActivity = {
      id: `act-${Date.now()}`,
      title: matchedActivity.name,
      description: matchedActivity.description,
      startTime: startTime,
      endTime: endTime,
      timeSlot: `${startTime} - ${endTime}`,
      location: matchedActivity.location || trip.destination,
      category: matchedActivity.category,
      supplierId: matchedActivity.supplierId,
      costEstimate: matchedActivity.costEstimate || 250,
      currency: matchedActivity.currency || trip.currency,
      included: matchedActivity.included ?? true,
      bookingStatus: bookingStatus,
      assignedBookingStaffId: assignedStaffId || undefined,
      bookingDeadline: bookingDeadline || undefined,
      bookingTimeframe: bookingTimeframe || undefined,
      followUpDate: followUpDate || undefined,
    };

    addActivityToDay(trip.id, targetDay.id, newActivity);
    if (onInserted) {
      onInserted(matchedActivity.name);
    }
    onClose();
  };

  // Allow pressing Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConfirmInsert();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-amber-700" />
                  Shift + &quot;{matchedKeyword}&quot; Triggered
                </span>
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Auto-Insert
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                Add Activity to Itinerary
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Activity Details Card Preview */}
        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
          <div className="flex items-center justify-between">
            {matchedActivity.category ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white border border-amber-300 text-amber-950">
                {matchedActivity.category}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-500">
                Activity
              </span>
            )}
            <span className="text-xs font-mono font-black text-amber-950 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              Length: {matchedActivity.durationHours} Hours
            </span>
          </div>

          <h4 className="text-base font-extrabold text-slate-900">
            {matchedActivity.name}
          </h4>

          <p className="text-xs text-slate-700 leading-relaxed max-h-24 overflow-y-auto">
            {matchedActivity.description}
          </p>

          {supplier && (
            <div className="text-[11px] text-slate-600 font-medium pt-1 border-t border-amber-200/60 flex items-center justify-between">
              <span>Supplier: <strong>{supplier.name}</strong></span>
              {supplier.isLoneProvider && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-300">
                  Lone Provider
                </span>
              )}
            </div>
          )}
        </div>

        {/* REQUIRED BOOKING STATUS PICKER (COLOR CODED) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Activity Booking Status *</span>
              <span className="text-[10px] text-slate-500 font-normal">(Color-coded marker)</span>
            </label>
            <span className="text-[10px] text-amber-800 font-bold">Select status:</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setBookingStatus('to be booked')}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                bookingStatus === 'to be booked'
                  ? 'bg-yellow-100 border-yellow-500 ring-2 ring-yellow-400 text-yellow-950 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-yellow-50/50'
              }`}
            >
              <div className="font-black text-xs flex items-center gap-1">
                <span>🟡</span>
                <span>To Be Booked</span>
              </div>
              <div className="text-[10px] text-yellow-800 font-semibold mt-0.5">
                Yellow Marker
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBookingStatus('booking requested')}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                bookingStatus === 'booking requested'
                  ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-400 text-blue-950 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50/50'
              }`}
            >
              <div className="font-black text-xs flex items-center gap-1">
                <span>🔵</span>
                <span>Booking Requested</span>
              </div>
              <div className="text-[10px] text-blue-800 font-semibold mt-0.5">
                Blue Marker
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBookingStatus('confirmed')}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                bookingStatus === 'confirmed'
                  ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-400 text-emerald-950 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50/50'
              }`}
            >
              <div className="font-black text-xs flex items-center gap-1">
                <span>🟢</span>
                <span>Confirmed</span>
              </div>
              <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                Green Marker
              </div>
            </button>
          </div>
        </div>

        {/* Schedule Destination Day & Time */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Target Day</span>
            </label>
            <select
              value={targetDayId}
              onChange={(e) => setTargetDayId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
            >
              {trip.days.map((d) => (
                <option key={d.id} value={d.id}>
                  Day {d.dayNumber} ({d.date}) - {d.title || 'Schedule'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Start Time ({matchedActivity.durationHours}h)</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 outline-none"
              />
              <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono">
                &rarr; {endTime}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Staff Assignment & Deadlines based on status */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Assign Booking to Staff Member</span>
            </label>
            <select
              value={assignedStaffId}
              onChange={(e) => setAssignedStaffId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-medium text-slate-900 outline-none"
            >
              <option value="">-- No Specific Staff Member --</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>

          {bookingStatus === 'to be booked' && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
              <div>
                <label className="text-[10px] font-bold text-yellow-900 uppercase block mb-1">
                  Booking Timeframe
                </label>
                <select
                  value={bookingTimeframe}
                  onChange={(e) => setBookingTimeframe(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-yellow-300 rounded-xl font-bold text-yellow-950 outline-none"
                >
                  <option value="Within 24 hours">Within 24 hours</option>
                  <option value="Within 48 hours">Within 48 hours</option>
                  <option value="Within 7 days">Within 7 days</option>
                  <option value="Urgent">Urgent Priority</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-yellow-900 uppercase block mb-1">
                  Booking Deadline Date
                </label>
                <input
                  type="date"
                  value={bookingDeadline}
                  onChange={(e) => setBookingDeadline(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-yellow-300 rounded-xl font-medium outline-none"
                />
              </div>
            </div>
          )}

          {bookingStatus === 'booking requested' && (
            <div className="pt-2 border-t border-slate-200">
              <label className="text-[10px] font-bold text-blue-900 uppercase block mb-1">
                Supplier Follow-up Date (Appears in Employee Tasks)
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-300 rounded-xl font-medium outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <span>Press <strong>Enter ↵</strong> to add instantly</span>
          </span>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmInsert}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Add to Itinerary</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
