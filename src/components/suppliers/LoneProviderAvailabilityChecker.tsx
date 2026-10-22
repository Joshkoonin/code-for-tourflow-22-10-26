import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  Users,
  Compass,
  Building,
  ShieldCheck,
  Plus,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Supplier, SupplierBooking } from '../../types';

interface LoneProviderAvailabilityCheckerProps {
  initialSupplierId?: string;
  initialDate?: string;
  onQuickBook?: (supplierId: string, date: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const LoneProviderAvailabilityChecker: React.FC<LoneProviderAvailabilityCheckerProps> = ({
  initialSupplierId,
  initialDate,
  onQuickBook,
  onClose,
  isModal = false,
}) => {
  const {
    suppliers,
    supplierBookings,
    itineraries,
    cancelSupplierBooking,
    updateSupplierBookingStatus,
  } = useApp();

  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const loneSuppliers = useMemo(() => {
    return suppliers.filter((s) => s.isLoneProvider);
  }, [suppliers]);

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    initialSupplierId || loneSuppliers[0]?.id || ''
  );
  const [searchDate, setSearchDate] = useState<string>(initialDate || '2026-10-13');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [commitmentsGroupBy, setCommitmentsGroupBy] = useState<'NONE' | 'TOUR' | 'DATE' | 'STATUS'>('NONE');
  const [bookingToCancel, setBookingToCancel] = useState<ProviderCommitment | null>(null);

  const selectedSupplier = loneSuppliers.find((s) => s.id === selectedSupplierId) || loneSuppliers[0];

  // Aggregate all bookings and activities where this lone provider is used across ALL itineraries
  interface ProviderCommitment {
    id: string;
    bookingId?: string;
    date: string;
    startTime: string;
    endTime: string;
    tripId: string;
    tripCode: string;
    tripTitle: string;
    description: string;
    status: string;
    source: 'Supplier Booking' | 'Itinerary Activity';
  }

  const allCommitments = useMemo(() => {
    if (!selectedSupplier) return [];
    const list: ProviderCommitment[] = [];

    // From supplier bookings
    supplierBookings.forEach((b) => {
      if (b.supplierId === selectedSupplier.id && b.status !== 'Cancelled') {
        const trip = itineraries.find((t) => t.id === b.tripId);
        list.push({
          id: `book-${b.id}`,
          bookingId: b.id,
          date: b.date,
          startTime: b.startTime || '09:00',
          endTime: b.endTime || '18:00',
          tripId: b.tripId,
          tripCode: trip?.code || 'Trip Booking',
          tripTitle: trip?.title || 'Private Tour',
          description: b.serviceDescription,
          status: b.status,
          source: 'Supplier Booking',
        });
      }
    });

    // From itinerary activities
    itineraries.forEach((trip) => {
      trip.days.forEach((day) => {
        day.activities.forEach((act) => {
          if (act.supplierId === selectedSupplier.id) {
            const normStatus = (act.bookingStatus || '').toLowerCase();
            if (normStatus === 'cancelled') return;

            // Ignore if matching supplier booking was cancelled
            const wasCancelled = supplierBookings.some(
              (b) => b.tripId === trip.id && b.date === day.date && b.supplierId === selectedSupplier.id && b.status === 'Cancelled'
            );
            if (wasCancelled) return;

            // Avoid duplicate if already in list for same trip & date
            const exists = list.some(
              (item) => item.tripId === trip.id && item.date === day.date
            );
            if (!exists) {
              list.push({
                id: `act-${act.id}`,
                date: day.date,
                startTime: act.startTime || '09:00',
                endTime: act.endTime || '18:00',
                tripId: trip.id,
                tripCode: trip.code,
                tripTitle: trip.title,
                description: act.title,
                status: act.bookingStatus ? `Activity: ${act.bookingStatus}` : 'Scheduled in Itinerary',
                source: 'Itinerary Activity',
              });
            }
          }
        });
      });
    });

    // Sort by date ascending
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedSupplier, supplierBookings, itineraries]);

  const displayedCommitments = useMemo(() => {
    if (!searchQuery.trim()) return allCommitments;
    const q = searchQuery.toLowerCase();
    return allCommitments.filter(
      (c) =>
        c.tripCode.toLowerCase().includes(q) ||
        c.tripTitle.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.date.includes(q)
    );
  }, [allCommitments, searchQuery]);

  const groupedCommitments = useMemo(() => {
    if (commitmentsGroupBy === 'NONE') {
      return [{ id: 'all', title: 'All Commitments', items: displayedCommitments }];
    }
    if (commitmentsGroupBy === 'TOUR') {
      const map = new Map<string, ProviderCommitment[]>();
      displayedCommitments.forEach((c) => {
        const k = c.tripCode || 'Other';
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(c);
      });
      return Array.from(map.entries()).map(([k, items]) => ({
        id: k,
        title: `Tour Project: ${k} — ${items[0]?.tripTitle || ''}`,
        items,
      }));
    }
    if (commitmentsGroupBy === 'DATE') {
      const map = new Map<string, ProviderCommitment[]>();
      displayedCommitments.forEach((c) => {
        const k = c.date;
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(c);
      });
      return Array.from(map.entries()).sort().map(([k, items]) => ({
        id: k,
        title: `Service Date: ${k}`,
        items,
      }));
    }
    if (commitmentsGroupBy === 'STATUS') {
      const map = new Map<string, ProviderCommitment[]>();
      displayedCommitments.forEach((c) => {
        const k = c.status;
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(c);
      });
      return Array.from(map.entries()).map(([k, items]) => ({
        id: k,
        title: `Status: ${k}`,
        items,
      }));
    }
    return [{ id: 'all', title: 'All Commitments', items: displayedCommitments }];
  }, [displayedCommitments, commitmentsGroupBy]);

  // Check clash for specific searched date
  const commitmentsOnSearchDate = useMemo(() => {
    return allCommitments.filter((c) => c.date === searchDate);
  }, [allCommitments, searchDate]);

  const isClashOnSearchDate = commitmentsOnSearchDate.length > 0;

  // Calendar dates preview (e.g. Oct 10 to Oct 20)
  const previewDates = [
    '2026-10-11',
    '2026-10-12',
    '2026-10-13',
    '2026-10-14',
    '2026-10-15',
    '2026-10-16',
    '2026-10-17',
    '2026-10-18',
    '2026-10-19',
    '2026-10-20',
  ];

  const content = (
    <div className={`bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 ${isModal ? 'max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl' : ''}`}>
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedbackToast}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="text-emerald-700 hover:text-emerald-950">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1">
              <Star className="w-3 h-3 fill-slate-950" />
              <span>Lone Provider Schedule Auditor</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">Pre-Booking Clash Prevention</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Check Lone Provider Availability &amp; Existing Bookings
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Search before making a commitment to ensure exclusive specialist guides and private vessels are 100% free with zero clashes.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-colors self-start sm:self-center"
            title="Close"
          >
            &times; Close
          </button>
        )}
      </div>

      {/* Provider Selector and Search Date Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
        <div>
          <label className="text-[11px] font-bold text-slate-600 uppercase">
            Select Lone Provider
          </label>
          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="w-full mt-1.5 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20"
          >
            {loneSuppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.loneProviderType})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 uppercase">
            Target Booking Date to Check
          </label>
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="w-full mt-1.5 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              // Quick date jump
              setSearchDate('2026-10-16');
            }}
            className="w-full px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Check Availability on Date</span>
          </button>
        </div>
      </div>

      {/* Availability Status Card */}
      {selectedSupplier && (
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isClashOnSearchDate
              ? 'bg-red-50/80 border-red-300 ring-2 ring-red-400/20'
              : 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div
                className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  isClashOnSearchDate ? 'bg-red-200 text-red-800' : 'bg-emerald-200 text-emerald-800'
                }`}
              >
                {isClashOnSearchDate ? (
                  <XCircle className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      isClashOnSearchDate
                        ? 'bg-red-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isClashOnSearchDate ? 'Unavailable / Clash Alert' : '100% Available / Safe to Book'}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Date: {searchDate}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  {isClashOnSearchDate
                    ? `Clash: ${selectedSupplier.name} has ${commitmentsOnSearchDate.length} active booking(s) on ${searchDate}`
                    : `No Clashes: ${selectedSupplier.name} is completely available on ${searchDate}`}
                </h3>

                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  {isClashOnSearchDate
                    ? `Booking on this date will create a critical double-booking violation because "${selectedSupplier.name}" is a lone provider (${selectedSupplier.loneProviderType}) and cannot serve multiple groups concurrently.`
                    : `This provider has zero conflicting commitments on ${searchDate}. You can safely assign them to a client itinerary or create a supplier booking order.`}
                </p>
              </div>
            </div>

            {!isClashOnSearchDate && onQuickBook && (
              <button
                onClick={() => onQuickBook(selectedSupplier.id, searchDate)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book This Free Date</span>
              </button>
            )}
          </div>

          {/* Details of clashing booking */}
          {isClashOnSearchDate && (
            <div className="mt-4 pt-4 border-t border-red-200/60 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-red-800">
                Existing Commitments on {searchDate}:
              </div>
              {commitmentsOnSearchDate.map((c) => (
                <div
                  key={c.id}
                  className="bg-white/90 p-3 rounded-xl border border-red-200 flex flex-wrap items-center justify-between text-xs gap-2"
                >
                  <div>
                    <span className="font-mono font-bold text-red-900 mr-2">{c.tripCode}</span>
                    <span className="font-bold text-slate-900 mr-2">{c.tripTitle}</span>
                    <span className="text-slate-600">&ndash; &ldquo;{c.description}&rdquo;</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-500 font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-red-600" />
                      {c.startTime} &ndash; {c.endTime}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                      {c.status}
                    </span>
                    {c.bookingId && (
                      <div className="flex items-center space-x-1 pl-1">
                        {c.status === 'Requested' && (
                          <button
                            onClick={() => {
                              updateSupplierBookingStatus(c.bookingId!, 'Confirmed');
                              showToast(`Booking for ${selectedSupplier?.name} on ${c.date} confirmed!`);
                            }}
                            className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-[10px] transition-colors"
                            title="Confirm booking"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          onClick={() => setBookingToCancel(c)}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md text-[10px] transition-colors cursor-pointer"
                          title="Cancel booking and remove from system"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Date Horizon Availability Bar (Oct 11 - Oct 20) */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <span>10-Day Availability Runway for {selectedSupplier?.name}</span>
          <span className="text-slate-400 font-normal">Click any date to inspect</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {previewDates.map((date) => {
            const hasBooking = allCommitments.some((c) => c.date === date);
            const isSelected = searchDate === date;

            return (
              <div
                key={date}
                onClick={() => setSearchDate(date)}
                className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-slate-900 shadow-sm'
                    : 'hover:border-slate-400'
                } ${
                  hasBooking
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-500">
                  {date.slice(5)}
                </div>
                <div className="text-xs font-bold mt-0.5">
                  {hasBooking ? '🔴 BUSY' : '🟢 FREE'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete Booking Ledger for this Lone Provider */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              All Existing Active Bookings for {selectedSupplier?.name} ({allCommitments.length})
            </h3>
            <span className="text-xs text-slate-500">
              Audit ledger across all itineraries &amp; bookings
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Group By Selector for Lone Provider Ledger */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
              <span className="text-slate-400 pl-1">Group:</span>
              <button
                onClick={() => setCommitmentsGroupBy('NONE')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  commitmentsGroupBy === 'NONE'
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                None
              </button>
              <button
                onClick={() => setCommitmentsGroupBy('TOUR')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  commitmentsGroupBy === 'TOUR'
                    ? 'bg-amber-500 text-slate-950 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Group by Tour Code"
              >
                Tour
              </button>
              <button
                onClick={() => setCommitmentsGroupBy('DATE')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  commitmentsGroupBy === 'DATE'
                    ? 'bg-amber-500 text-slate-950 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Group by Date"
              >
                Date
              </button>
              <button
                onClick={() => setCommitmentsGroupBy('STATUS')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  commitmentsGroupBy === 'STATUS'
                    ? 'bg-amber-500 text-slate-950 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Group by Status"
              >
                Status
              </button>
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search trip, date, details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              />
            </div>
          </div>
        </div>

        {displayedCommitments.length === 0 ? (
          <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500">
            {allCommitments.length === 0
              ? `No commitments currently scheduled for ${selectedSupplier?.name}.`
              : 'No bookings match your search query.'}
          </div>
        ) : (
          <div className="space-y-3">
            {groupedCommitments.map((group) => (
              <div key={group.id} className="space-y-1.5">
                {commitmentsGroupBy !== 'NONE' && (
                  <div className="px-3 py-1.5 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>{group.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {group.items.length} {group.items.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                )}
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {group.items.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 bg-white hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-900 text-white">
                            {c.date}
                          </span>
                          <span className="font-mono font-bold text-amber-800">{c.tripCode}</span>
                          <span className="font-bold text-slate-900">{c.tripTitle}</span>
                        </div>
                        <div className="text-slate-600">{c.description}</div>
                      </div>

                      <div className="flex items-center space-x-3 text-slate-500 font-mono text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {c.startTime} &ndash; {c.endTime}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Cancel &amp; Remove Booking</h3>
                <p className="text-xs text-slate-500">Permanently clears lone provider clash</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel and remove the booking for{' '}
              <strong>{bookingToCancel.tripCode}</strong> on <strong>{bookingToCancel.date}</strong>?
              This will completely remove it from the system so it <strong>does not show as a clash</strong> for {selectedSupplier?.name}.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={() => {
                  if (bookingToCancel.bookingId) {
                    cancelSupplierBooking(bookingToCancel.bookingId);
                  }
                  showToast(`Booking cancelled and removed. Lone provider clash on ${bookingToCancel.date} cleared!`);
                  setBookingToCancel(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Confirm Cancellation &amp; Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
};
