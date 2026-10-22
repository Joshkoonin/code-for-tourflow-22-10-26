import React, { useState, useMemo } from 'react';
import {
  Building2,
  Compass,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Edit2,
  FileCheck,
  Star,
  Clock,
  Search,
  Tag,
  DollarSign,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Supplier, SupplierBooking, SupplierBookingStatus, Itinerary } from '../../types';
import { useApp } from '../../context/AppContext';

export type BookingGroupByOption = 'NONE' | 'SUPPLIER' | 'TOUR' | 'DATE' | 'STATUS';

interface BookingsGroupedViewProps {
  bookings: SupplierBooking[];
  suppliers: Supplier[];
  itineraries: Itinerary[];
  groupBy: BookingGroupByOption;
  onGroupByChange: (option: BookingGroupByOption) => void;
  formatMoney: (amount: number, currency: any) => string;
  onUpdateStatus: (booking: SupplierBooking, status: SupplierBookingStatus | 'CANCEL_AND_REMOVE') => void;
  onConfirmBooking: (booking: SupplierBooking) => void;
  onOpenCancelModal: (booking: SupplierBooking) => void;
  onOpenEditBooking: (booking: SupplierBooking) => void;
  onTriggerQuickWhatsApp: (booking: SupplierBooking) => void;
  onIssueVoucher: (booking: SupplierBooking) => void;
  onViewVoucher: (booking: SupplierBooking) => void;
  emptyMessage?: string;
  extraHeaderControls?: React.ReactNode;
}

interface GroupData {
  id: string;
  title: string;
  subtitle?: string;
  iconType: 'supplier' | 'tour' | 'date' | 'status' | 'none';
  badge?: string;
  badgeColor?: string;
  isLoneProvider?: boolean;
  totalCost: number;
  currency: string;
  items: SupplierBooking[];
}

export const BookingsGroupedView: React.FC<BookingsGroupedViewProps> = ({
  bookings,
  suppliers,
  itineraries,
  groupBy,
  onGroupByChange,
  formatMoney,
  onUpdateStatus,
  onConfirmBooking,
  onOpenCancelModal,
  onOpenEditBooking,
  onTriggerQuickWhatsApp,
  onIssueVoucher,
  onViewVoucher,
  emptyMessage = 'No bookings found',
  extraHeaderControls,
}) => {
  const { hasFullFinancialView } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Filter by local search query
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase().trim();
    return bookings.filter((b) => {
      const supplier = suppliers.find((s) => s.id === b.supplierId);
      const trip = itineraries.find((t) => t.id === b.tripId);
      return (
        b.serviceDescription.toLowerCase().includes(q) ||
        (b.confirmationNumber && b.confirmationNumber.toLowerCase().includes(q)) ||
        (b.voucherNumber && b.voucherNumber.toLowerCase().includes(q)) ||
        (b.notes && b.notes.toLowerCase().includes(q)) ||
        b.date.includes(q) ||
        b.status.toLowerCase().includes(q) ||
        (supplier && supplier.name.toLowerCase().includes(q)) ||
        (supplier && supplier.category.toLowerCase().includes(q)) ||
        (trip && (
          trip.code.toLowerCase().includes(q) ||
          trip.title.toLowerCase().includes(q) ||
          trip.destination.toLowerCase().includes(q)
        ))
      );
    });
  }, [bookings, searchQuery, suppliers, itineraries]);

  // Group the bookings based on selected grouping option
  const groups: GroupData[] = useMemo(() => {
    if (groupBy === 'NONE') {
      const totalCost = filteredBookings.reduce((sum, b) => sum + (b.cost || 0), 0);
      return [
        {
          id: 'all',
          title: 'All Bookings',
          subtitle: `${filteredBookings.length} total entries`,
          iconType: 'none',
          totalCost,
          currency: filteredBookings[0]?.currency || 'USD',
          items: filteredBookings,
        },
      ];
    }

    if (groupBy === 'SUPPLIER') {
      const map = new Map<string, SupplierBooking[]>();
      filteredBookings.forEach((b) => {
        const key = b.supplierId || 'unassigned';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(b);
      });

      // Sort suppliers alphabetically (A to Z)
      const sortedKeys = Array.from(map.keys()).sort((a, b) => {
        const sA = suppliers.find((s) => s.id === a)?.name || 'Unassigned';
        const sB = suppliers.find((s) => s.id === b)?.name || 'Unassigned';
        return sA.localeCompare(sB);
      });

      return sortedKeys.map((supId) => {
        const items = map.get(supId) || [];
        const supplier = suppliers.find((s) => s.id === supId);
        const name = supplier?.name || 'Unassigned Supplier';
        const category = supplier?.category || 'Service';
        const isLone = supplier?.isLoneProvider;
        const totalCost = items.reduce((sum, b) => sum + (b.cost || 0), 0);

        return {
          id: supId,
          title: name,
          subtitle: `${category} • ${supplier?.city || 'Israel'}${
            supplier?.contactPerson ? ` • Contact: ${supplier.contactPerson}` : ''
          }`,
          iconType: 'supplier',
          isLoneProvider: isLone,
          badge: isLone ? '★ LONE PROVIDER (EXCLUSIVE)' : 'Standard Supplier',
          badgeColor: isLone
            ? 'bg-amber-100 text-amber-900 border border-amber-300'
            : 'bg-slate-100 text-slate-700 border border-slate-200',
          totalCost,
          currency: items[0]?.currency || 'USD',
          items: items.sort((a, b) => a.date.localeCompare(b.date)),
        };
      });
    }

    if (groupBy === 'TOUR') {
      const map = new Map<string, SupplierBooking[]>();
      filteredBookings.forEach((b) => {
        const key = b.tripId || 'direct';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(b);
      });

      // Sort tours alphabetically by Tour Code / Title
      const sortedKeys = Array.from(map.keys()).sort((a, b) => {
        const tA = itineraries.find((t) => t.id === a);
        const tB = itineraries.find((t) => t.id === b);
        const codeA = tA ? `${tA.code} ${tA.title}` : 'Direct Booking';
        const codeB = tB ? `${tB.code} ${tB.title}` : 'Direct Booking';
        return codeA.localeCompare(codeB);
      });

      return sortedKeys.map((tripId) => {
        const items = map.get(tripId) || [];
        const trip = itineraries.find((t) => t.id === tripId);
        const totalCost = items.reduce((sum, b) => sum + (b.cost || 0), 0);

        return {
          id: tripId,
          title: trip ? `${trip.code} — ${trip.title}` : 'Direct / Non-Project Bookings',
          subtitle: trip
            ? `Destination: ${trip.destination} (${trip.partySize} Guests) • Dates: ${trip.startDate} to ${trip.endDate}`
            : 'Ad-hoc operations',
          iconType: 'tour',
          badge: trip ? `${trip.status} Project` : 'Direct',
          badgeColor: 'bg-amber-50 text-amber-900 border border-amber-200',
          totalCost,
          currency: items[0]?.currency || 'USD',
          items: items.sort((a, b) => a.date.localeCompare(b.date)),
        };
      });
    }

    if (groupBy === 'DATE') {
      const map = new Map<string, SupplierBooking[]>();
      filteredBookings.forEach((b) => {
        const key = b.date || 'Undated';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(b);
      });

      // Sort chronologically (earliest to latest)
      const sortedKeys = Array.from(map.keys()).sort();

      return sortedKeys.map((dateStr) => {
        const items = map.get(dateStr) || [];
        const totalCost = items.reduce((sum, b) => sum + (b.cost || 0), 0);

        // Format date title
        let formattedTitle = dateStr;
        try {
          const d = new Date(dateStr + 'T00:00:00');
          formattedTitle = d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        } catch {
          // ignore date parse issues
        }

        return {
          id: dateStr,
          title: formattedTitle,
          subtitle: `Date Ref: ${dateStr}`,
          iconType: 'date',
          badge: `${items.length} ${items.length === 1 ? 'service' : 'services'}`,
          badgeColor: 'bg-blue-50 text-blue-900 border border-blue-200',
          totalCost,
          currency: items[0]?.currency || 'USD',
          items: items.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
        };
      });
    }

    if (groupBy === 'STATUS') {
      const map = new Map<string, SupplierBooking[]>();
      filteredBookings.forEach((b) => {
        const key = b.status || 'Requested';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(b);
      });

      const statusOrder: SupplierBookingStatus[] = ['Requested', 'Confirmed', 'Voucher Issued', 'Paid', 'Cancelled'];
      const presentStatuses = statusOrder.filter((s) => map.has(s));

      return presentStatuses.map((st) => {
        const items = map.get(st) || [];
        const totalCost = items.reduce((sum, b) => sum + (b.cost || 0), 0);

        let badgeColor = 'bg-slate-100 text-slate-800';
        let desc = '';
        if (st === 'Requested') {
          badgeColor = 'bg-amber-100 text-amber-900 border border-amber-300';
          desc = 'Awaiting supplier acceptance or confirmation';
        } else if (st === 'Confirmed') {
          badgeColor = 'bg-blue-100 text-blue-900 border border-blue-300';
          desc = 'Confirmed with supplier partner';
        } else if (st === 'Voucher Issued') {
          badgeColor = 'bg-emerald-100 text-emerald-900 border border-emerald-300';
          desc = 'Official exchange voucher released';
        } else if (st === 'Paid') {
          badgeColor = 'bg-purple-100 text-purple-900 border border-purple-300';
          desc = 'Direct settlement processed';
        } else if (st === 'Cancelled') {
          badgeColor = 'bg-rose-100 text-rose-900 border border-rose-300';
          desc = 'Cancelled bookings';
        }

        return {
          id: st,
          title: `Status: ${st}`,
          subtitle: desc,
          iconType: 'status',
          badge: `${items.length} ${items.length === 1 ? 'Booking' : 'Bookings'}`,
          badgeColor,
          totalCost,
          currency: items[0]?.currency || 'USD',
          items: items.sort((a, b) => a.date.localeCompare(b.date)),
        };
      });
    }

    return [];
  }, [filteredBookings, groupBy, suppliers, itineraries]);

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const expandAll = () => setCollapsedGroups({});
  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    groups.forEach((g) => {
      all[g.id] = true;
    });
    setCollapsedGroups(all);
  };

  const getStatusBadge = (status: SupplierBookingStatus) => {
    switch (status) {
      case 'Requested':
        return 'bg-amber-100 text-amber-900 border border-amber-300';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-900 border border-blue-300';
      case 'Voucher Issued':
        return 'bg-emerald-100 text-emerald-900 border border-emerald-300';
      case 'Paid':
        return 'bg-purple-100 text-purple-900 border border-purple-300';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-900 border border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Grouping and Search Controls Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left Side: Group By Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider mr-1">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>Group Bookings By:</span>
          </div>

          <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-2xl gap-1 text-xs">
            {/* By Supplier Name (Alphabetical) */}
            <button
              onClick={() => onGroupByChange('SUPPLIER')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                groupBy === 'SUPPLIER'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="Group by Supplier Name in alphabetical order (A to Z)"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Supplier Name (A-Z)</span>
            </button>

            {/* By Tour */}
            <button
              onClick={() => onGroupByChange('TOUR')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                groupBy === 'TOUR'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="Group bookings by Tour / Project Code"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Tour / Project</span>
            </button>

            {/* By Date */}
            <button
              onClick={() => onGroupByChange('DATE')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                groupBy === 'DATE'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="Group bookings chronologically by Service Date"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Service Date</span>
            </button>

            {/* By Status */}
            <button
              onClick={() => onGroupByChange('STATUS')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                groupBy === 'STATUS'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="Group bookings by Status (Requested, Confirmed, etc.)"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Status</span>
            </button>

            {/* None / Flat List */}
            <button
              onClick={() => onGroupByChange('NONE')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                groupBy === 'NONE'
                  ? 'bg-slate-900 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="View all bookings in a single flat list"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>None (Flat List)</span>
            </button>
          </div>

          {/* Expand / Collapse Controls when Grouped */}
          {groupBy !== 'NONE' && groups.length > 1 && (
            <div className="flex items-center space-x-1 pl-1">
              <button
                onClick={expandAll}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                title="Expand all groups"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Expand All</span>
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={collapseAll}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                title="Collapse all groups"
              >
                <Minimize2 className="w-3 h-3" />
                <span>Collapse All</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Search and Extra Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
            />
          </div>

          {extraHeaderControls}
        </div>
      </div>

      {/* Render Groups */}
      {groups.length === 0 || (groups.length === 1 && groups[0].items.length === 0) ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-800 text-sm">{emptyMessage}</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `No bookings match your filter "${searchQuery}". Try clearing your search.`
              : 'No supplier bookings are currently present in this view.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-xl cursor-pointer"
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const isCollapsed = Boolean(collapsedGroups[group.id]);

            return (
              <div
                key={group.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Group Header Bar (Clickable to Collapse / Expand when grouped) */}
                {groupBy !== 'NONE' && (
                  <div
                    onClick={() => toggleGroupCollapse(group.id)}
                    className="p-4 bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors select-none"
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        className="p-1 text-slate-500 hover:text-slate-800 rounded-lg"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-600" />
                        )}
                      </button>

                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-900 flex items-center justify-center shrink-0">
                        {group.iconType === 'supplier' && <Building2 className="w-4 h-4 text-amber-700" />}
                        {group.iconType === 'tour' && <Compass className="w-4 h-4 text-amber-700" />}
                        {group.iconType === 'date' && <Calendar className="w-4 h-4 text-amber-700" />}
                        {group.iconType === 'status' && <Tag className="w-4 h-4 text-amber-700" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-extrabold text-slate-900">
                            {group.title}
                          </h3>

                          {group.badge && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                group.badgeColor || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {group.badge}
                            </span>
                          )}

                          {group.isLoneProvider && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1 shadow-2xs">
                              <Star className="w-3 h-3 fill-slate-950" />
                              <span>Clash Protected</span>
                            </span>
                          )}
                        </div>

                        {group.subtitle && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {group.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pl-9 sm:pl-0">
                      <div className="text-right">
                        {hasFullFinancialView && (
                          <div className="text-xs font-mono font-bold text-slate-900">
                            Total: {formatMoney(group.totalCost, group.currency)}
                          </div>
                        )}
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {group.items.length} {group.items.length === 1 ? 'Booking' : 'Bookings'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Group Bookings Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-3 px-6">Supplier &amp; Service</th>
                          <th className="py-3 px-6">Tour Code &amp; Date</th>
                          <th className="py-3 px-6">Guests &amp; Timing</th>
                          {hasFullFinancialView && <th className="py-3 px-6">Agreed Cost</th>}
                          <th className="py-3 px-6">Booking Status</th>
                          <th className="py-3 px-6 text-right">Actions &amp; Reminders</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.items.map((b) => {
                          const supplier = suppliers.find((s) => s.id === b.supplierId);
                          const trip = itineraries.find((t) => t.id === b.tripId);
                          const isLone = supplier?.isLoneProvider;

                          return (
                            <tr key={b.id} className="hover:bg-amber-50/20 transition-colors">
                              {/* Supplier & Service Description */}
                              <td className="py-4 px-6">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                  <span>{supplier?.name || 'Unassigned'}</span>
                                  {isLone && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-900 border border-amber-500/40">
                                      LONE PROVIDER
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-600 mt-0.5 line-clamp-1 font-medium">
                                  {b.serviceDescription}
                                </div>
                                {b.confirmationNumber && (
                                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                    Ref: {b.confirmationNumber}
                                  </div>
                                )}
                              </td>

                              {/* Tour Code & Date */}
                              <td className="py-4 px-6">
                                <div className="font-mono font-bold text-amber-800">
                                  {trip?.code || 'Ad-hoc Booking'}
                                </div>
                                <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1 font-medium">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>{b.date}</span>
                                </div>
                              </td>

                              {/* Guests & Timing */}
                              <td className="py-4 px-6 text-slate-600">
                                <div className="font-medium">{b.guestsCount} VIP Guests</div>
                                {b.startTime && (
                                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>
                                      {b.startTime} &mdash; {b.endTime || '18:00'}
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Agreed Cost */}
                              {hasFullFinancialView && (
                                <td className="py-4 px-6 font-bold text-slate-900 font-mono text-xs">
                                  {formatMoney(b.cost, b.currency)}
                                </td>
                              )}

                              {/* Interactive Booking Status Dropdown */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={b.status}
                                    onChange={(e) => onUpdateStatus(b, e.target.value as any)}
                                    className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border cursor-pointer outline-none transition-all ${getStatusBadge(
                                      b.status
                                    )}`}
                                    title="Click to change booking status"
                                  >
                                    <option value="Requested">Requested</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Voucher Issued">Voucher Issued</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Cancelled">Cancel &amp; Remove</option>
                                  </select>
                                </div>
                              </td>

                              {/* Actions & Reminders */}
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {/* Quick WhatsApp Reminder Trigger Button */}
                                  <button
                                    onClick={() => onTriggerQuickWhatsApp(b)}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors inline-flex items-center cursor-pointer"
                                    title="Send 24h WhatsApp Reminder to supplier"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Prominent Confirm Button when in 'Requested' status */}
                                  {b.status === 'Requested' && (
                                    <button
                                      onClick={() => onConfirmBooking(b)}
                                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-xs transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                                      title="Change status to Confirmed"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Confirm</span>
                                    </button>
                                  )}

                                  {b.status === 'Confirmed' && (
                                    <button
                                      onClick={() => onIssueVoucher(b)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>Issue Voucher</span>
                                    </button>
                                  )}

                                  {b.status === 'Voucher Issued' && (
                                    <button
                                      onClick={() => onViewVoucher(b)}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>View Voucher</span>
                                    </button>
                                  )}

                                  {/* Direct Cancel Button - Cancels and removes from system */}
                                  <button
                                    onClick={() => onOpenCancelModal(b)}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 font-bold rounded-lg text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    title="Cancel booking and remove from system (clears clashes)"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Cancel</span>
                                  </button>

                                  {/* Edit Booking Button */}
                                  <button
                                    onClick={() => onOpenEditBooking(b)}
                                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center cursor-pointer"
                                    title="Edit booking parameters"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
