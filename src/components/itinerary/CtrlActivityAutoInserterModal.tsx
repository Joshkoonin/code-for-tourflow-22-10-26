import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Command,
  Clock,
  Search,
  Check,
  Calendar,
  User,
  X,
  AlertCircle,
  Building,
  CheckCircle2,
  Tag,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActivityCatalogItem, Itinerary, ItineraryActivity } from '../../types';

interface CtrlActivityAutoInserterModalProps {
  trip: Itinerary;
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  defaultDayId?: string;
}

export const CtrlActivityAutoInserterModal: React.FC<CtrlActivityAutoInserterModalProps> = ({
  trip,
  isOpen,
  onClose,
  initialQuery = '',
  defaultDayId,
}) => {
  const { activityCatalog, addActivityToDay, staff, suppliers } = useApp();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedActivity, setSelectedActivity] = useState<ActivityCatalogItem | null>(null);

  // Auto-prompt details requested by user:
  // 1. Status: "to be booked", "booking requested", "confirmed"
  const [bookingStatus, setBookingStatus] = useState<'to be booked' | 'booking requested' | 'confirmed'>('to be booked');
  const [targetDayId, setTargetDayId] = useState<string>(
    defaultDayId || trip.days[0]?.id || ''
  );
  const [startTime, setStartTime] = useState<string>('09:00');
  const [assignedStaffId, setAssignedStaffId] = useState<string>('');
  const [bookingDeadline, setBookingDeadline] = useState<string>('');
  const [bookingTimeframe, setBookingTimeframe] = useState<string>('Within 48 hours');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialQuery);
      if (defaultDayId) {
        setTargetDayId(defaultDayId);
      } else if (!targetDayId && trip.days.length > 0) {
        setTargetDayId(trip.days[0].id);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialQuery, defaultDayId, trip.days]);

  // Filter matching catalog activities by typed query
  const matchingActivities = useMemo(() => {
    if (!searchQuery.trim()) {
      return activityCatalog.slice(0, 10);
    }
    const q = searchQuery.toLowerCase().trim();
    return activityCatalog.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.category && a.category.toLowerCase().includes(q)) ||
        (a.location && a.location.toLowerCase().includes(q)) ||
        a.description.toLowerCase().includes(q)
    );
  }, [activityCatalog, searchQuery]);

  // If initialQuery directly matches an activity, select it
  useEffect(() => {
    if (initialQuery.trim() && activityCatalog.length > 0) {
      const exact = activityCatalog.find(
        (a) => a.name.toLowerCase() === initialQuery.toLowerCase().trim()
      );
      if (exact) {
        setSelectedActivity(exact);
      }
    }
  }, [initialQuery, activityCatalog]);

  // Calculate end time based on durationHours
  const calculatedEndTime = useMemo(() => {
    if (!selectedActivity) return '11:00';
    const duration = selectedActivity.durationHours || 2;
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = (h || 9) * 60 + (m || 0) + Math.round(duration * 60);
    const endH = Math.min(23, Math.floor(totalMinutes / 60));
    const endM = totalMinutes % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(endH)}:${pad(endM)}`;
  }, [startTime, selectedActivity]);

  const handleSelectActivity = (item: ActivityCatalogItem) => {
    setSelectedActivity(item);
  };

  const handleInsertActivity = () => {
    if (!selectedActivity) return;
    if (!targetDayId) {
      alert('Please select a target day for this activity.');
      return;
    }

    const targetDay = trip.days.find((d) => d.id === targetDayId);
    const dayNumber = targetDay ? targetDay.dayNumber : 1;

    const newActivity: ItineraryActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: selectedActivity.name,
      description: selectedActivity.description, // Full description from catalog
      startTime: startTime,
      endTime: calculatedEndTime, // Correct length of time
      timeSlot: `${startTime} - ${calculatedEndTime}`,
      category: selectedActivity.category,
      location: selectedActivity.location || trip.destination,
      costEstimate: selectedActivity.costEstimate || 150,
      currency: selectedActivity.currency || trip.currency || 'USD',
      supplierId: selectedActivity.supplierId,
      included: selectedActivity.included ?? true,
      bookingStatus: bookingStatus,
      assignedBookingStaffId: assignedStaffId || undefined,
      bookingDeadline: bookingDeadline || undefined,
      bookingTimeframe: bookingTimeframe || undefined,
      followUpDate: followUpDate || undefined,
    };

    addActivityToDay(trip.id, targetDayId, newActivity);

    setToastMessage(
      `✓ Successfully inserted "${selectedActivity.name}" (${selectedActivity.durationHours} hrs) into Day ${dayNumber} with status: ${bookingStatus.toUpperCase()}!`
    );

    setTimeout(() => {
      setToastMessage(null);
      setSelectedActivity(null);
      setSearchQuery('');
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-fadeIn">
        {/* Header with Ctrl Indicator */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Ctrl + Activity Name Auto-Inserter
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                  AUTO INSERT
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white">
                Quick Insert Catalog Activity into Itinerary
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input with live filter */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type activity name (e.g. Masada, Dead Sea, Western Wall, Helicopter)..."
              className="w-full pl-11 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl shadow-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 outline-none font-bold text-slate-900"
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 px-1">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                Ctrl
              </kbd>
              <span>+ type any activity name anywhere on the builder to open</span>
            </span>
            <span>{matchingActivities.length} available catalog items</span>
          </div>
        </div>

        {/* Content area: Catalog selection or Configuration */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {toastMessage && (
            <div className="p-3.5 bg-emerald-500 text-white rounded-xl text-xs font-bold text-center shadow-md animate-fadeIn flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
          )}

          {!selectedActivity ? (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Select Activity from Catalog:
              </div>
              {matchingActivities.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                  No catalog activity matching &ldquo;{searchQuery}&rdquo;. Try another name or add it in the Activities tab.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {matchingActivities.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectActivity(item)}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/40 cursor-pointer transition-all shadow-2xs group flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 group-hover:text-amber-900">
                            {item.name}
                          </span>
                          {item.category && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {item.category}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {item.durationHours} Hours
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                        {item.location && (
                          <div className="text-[11px] text-slate-400 font-medium">
                            Location: {item.location}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectActivity(item);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 group-hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                      >
                        <span>Select</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Activity Preview */}
              <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-2xl space-y-2 relative">
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="absolute top-3 right-3 text-xs font-bold text-amber-800 hover:text-amber-950 underline"
                >
                  Change Activity
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-amber-950">
                    {selectedActivity.name}
                  </span>
                  {selectedActivity.category && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                      {selectedActivity.category}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 flex items-center gap-1 shadow-2xs">
                    <Clock className="w-3.5 h-3.5" />
                    Exact Length: {selectedActivity.durationHours} Hours
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                  {selectedActivity.description}
                </p>
              </div>

              {/* AUTOMATIC STATUS INQUIRY (Mandatory Prompt Requirement) */}
              <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-300 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span>Select Activity Booking Status (Required)</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-500">Color-coded across itinerary</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBookingStatus('to be booked')}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      bookingStatus === 'to be booked'
                        ? 'bg-yellow-100 border-yellow-500 ring-2 ring-yellow-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-yellow-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-yellow-950">🟡 To Be Booked</span>
                      {bookingStatus === 'to be booked' && <Check className="w-4 h-4 text-yellow-700" />}
                    </div>
                    <div className="text-[10px] text-yellow-800 font-semibold mt-1">
                      Shows as Yellow on Itinerary
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingStatus('booking requested')}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      bookingStatus === 'booking requested'
                        ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-950">🔵 Booking Requested</span>
                      {bookingStatus === 'booking requested' && <Check className="w-4 h-4 text-blue-700" />}
                    </div>
                    <div className="text-[10px] text-blue-800 font-semibold mt-1">
                      Shows as Blue on Itinerary
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingStatus('confirmed')}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      bookingStatus === 'confirmed'
                        ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-950">🟢 Confirmed</span>
                      {bookingStatus === 'confirmed' && <Check className="w-4 h-4 text-emerald-700" />}
                    </div>
                    <div className="text-[10px] text-emerald-800 font-semibold mt-1">
                      Shows as Green on Itinerary
                    </div>
                  </button>
                </div>
              </div>

              {/* Destination Day & Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Target Day on Itinerary
                  </label>
                  <select
                    value={targetDayId}
                    onChange={(e) => setTargetDayId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold"
                  >
                    {trip.days.map((d) => (
                      <option key={d.id} value={d.id}>
                        Day {d.dayNumber}: {d.title} ({d.date})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Calculated End Time
                  </label>
                  <div className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 flex items-center justify-between">
                    <span>{calculatedEndTime}</span>
                    <span className="text-[10px] text-amber-700 font-sans">
                      ({selectedActivity.durationHours}h duration)
                    </span>
                  </div>
                </div>
              </div>

              {/* Staff Assignment & Deadline for Booking */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Assign to Staff Member (Auto-creates Task)</span>
                  </div>
                  {bookingStatus === 'to be booked' && (
                    <span className="text-[10px] text-yellow-800 font-bold bg-yellow-100 px-2 py-0.5 rounded-full">
                      Creates "To Book" Task
                    </span>
                  )}
                  {bookingStatus === 'booking requested' && (
                    <span className="text-[10px] text-blue-800 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                      Creates "Follow-up" Task
                    </span>
                  )}
                  {bookingStatus === 'confirmed' && (
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                      Confirmed - No task needed
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Assigned Employee
                    </label>
                    <select
                      value={assignedStaffId}
                      onChange={(e) => setAssignedStaffId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                    >
                      <option value="">-- No Staff Assignment --</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role} - {s.department.split(' ')[0]})
                        </option>
                      ))}
                    </select>
                  </div>

                  {bookingStatus === 'to be booked' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase text-yellow-900 block mb-1">
                        Timeframe / Deadline for Booking
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          value={bookingDeadline}
                          onChange={(e) => setBookingDeadline(e.target.value)}
                          className="w-1/2 px-2.5 py-1.5 text-xs bg-white border border-yellow-300 rounded-xl"
                          placeholder="Deadline Date"
                        />
                        <select
                          value={bookingTimeframe}
                          onChange={(e) => setBookingTimeframe(e.target.value)}
                          className="w-1/2 px-2 py-1.5 text-xs bg-white border border-yellow-300 rounded-xl font-medium text-yellow-950"
                        >
                          <option value="Within 24 hours">Within 24 hours</option>
                          <option value="Within 48 hours">Within 48 hours</option>
                          <option value="Within 7 days">Within 7 days</option>
                          <option value="Urgent (Today)">Urgent (Today)</option>
                          <option value="Flexible">Flexible</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {bookingStatus === 'booking requested' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase text-blue-900 block mb-1">
                        Supplier Follow-Up Date *
                      </label>
                      <input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-xl font-bold text-blue-950"
                      />
                      <span className="text-[9px] text-blue-700 italic block mt-0.5">
                        Appears as a follow-up task on employee&apos;s task list
                      </span>
                    </div>
                  )}

                  {bookingStatus === 'confirmed' && (
                    <div className="flex items-center text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                      <span>✓ Activity is already confirmed. Any prior booking tasks are cleared.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Sticky Footer */}
              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-3 -mx-6 -mb-6 mt-4 flex items-center justify-end space-x-2 z-10 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  Back to List
                </button>
                <button
                  type="button"
                  onClick={handleInsertActivity}
                  className="px-5 py-2 bg-slate-900 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Insert Activity into Itinerary</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
