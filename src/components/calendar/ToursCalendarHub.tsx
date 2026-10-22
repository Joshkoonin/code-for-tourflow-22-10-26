import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  MapPin,
  Compass,
  Building,
  Briefcase,
  ExternalLink,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  X,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Itinerary, TripStatus } from '../../types';

interface ToursCalendarHubProps {
  onOpenNewTourModal: (initialDate?: string) => void;
}

export const ToursCalendarHub: React.FC<ToursCalendarHubProps> = ({ onOpenNewTourModal }) => {
  const {
    itineraries,
    clients,
    staff,
    setSelectedTripId,
    setActiveView,
    openClientPortal,
    formatMoney,
  } = useApp();

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [activeViewMode, setActiveViewMode] = useState<'month' | 'timeline' | 'agenda'>('month');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTour, setSelectedTour] = useState<Itinerary | null>(null);

  // Month navigation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered tours
  const filteredTours = useMemo(() => {
    return itineraries.filter((tour) => {
      const matchesStatus = statusFilter === 'ALL' || tour.status === statusFilter;
      const matchesStaff = staffFilter === 'ALL' || tour.leadStaffId === staffFilter;
      const q = searchQuery.toLowerCase().trim();
      const client = clients.find((c) => c.id === tour.clientId);
      const matchesQuery =
        !q ||
        tour.title.toLowerCase().includes(q) ||
        (tour.tourName && tour.tourName.toLowerCase().includes(q)) ||
        tour.destination.toLowerCase().includes(q) ||
        tour.code.toLowerCase().includes(q) ||
        (client && client.name.toLowerCase().includes(q));

      return matchesStatus && matchesStaff && matchesQuery;
    });
  }, [itineraries, statusFilter, staffFilter, searchQuery, clients]);

  // Calendar matrix calculation for month view
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    const totalDays = lastDayOfMonth.getDate();

    // Days from previous month to fill grid
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const days = [];

    // Previous month padding
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dateObj = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = dateObj.toISOString().split('T')[0];
      days.push({
        date: dateObj,
        dateStr,
        dayNumber: dateObj.getDate(),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const dateObj = new Date(year, month, i);
      const dateStr = dateObj.toISOString().split('T')[0];
      days.push({
        date: dateObj,
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill out 35 or 42 grid cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const dateObj = new Date(year, month + 1, i);
      const dateStr = dateObj.toISOString().split('T')[0];
      days.push({
        date: dateObj,
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Helper to test if a tour is active on a specific day
  const getToursForDate = (dateStr: string) => {
    return filteredTours.filter((tour) => {
      return dateStr >= tour.startDate && dateStr <= tour.endDate;
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Selected tour client and concierge
  const selectedClient = selectedTour ? clients.find((c) => c.id === selectedTour.clientId) : null;
  const selectedConcierge = selectedTour ? staff.find((s) => s.id === selectedTour.leadStaffId) : null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
              Operations Dispatch &bull; Fleet &amp; Tour Calendar
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Schedule &bull; Work Overview &bull; Resource Tracking
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-amber-600" />
            <span>Tours Calendar</span>
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Comprehensive schedule of all working tours, guides, chauffeurs, and private departures. Click any date or tour to manage.
          </p>
        </div>

        {/* Header Action: Add Tour to Calendar */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => onOpenNewTourModal()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Tour to Calendar</span>
          </button>
        </div>
      </div>

      {/* Calendar Controls & Navigation Bar */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Month Navigation */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg font-black text-slate-900 min-w-[180px]">
            {monthNames[month]} {year}
          </h2>

          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* View Switcher: Month, Operations Timeline, Agenda */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeViewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month Calendar
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeViewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Timeline / Gantt
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeViewMode === 'agenda'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agenda List
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Tour Statuses</option>
            <option value="Proposed">Proposed</option>
            <option value="Confirmed">Confirmed</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Concierges</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW 1: MONTH CALENDAR GRID */}
      {activeViewMode === 'month' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Day Headers (Sun - Sat) */}
          <div className="grid grid-cols-7 bg-slate-50/80 border-b border-slate-200 text-center py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-[minmax(120px,_1fr)] divide-x divide-y divide-slate-100">
            {calendarDays.map((cell, idx) => {
              const dateTours = getToursForDate(cell.dateStr);
              const isToday = cell.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  onClick={() => onOpenNewTourModal(cell.dateStr)}
                  className={`p-2 transition-colors flex flex-col justify-between group cursor-pointer ${
                    cell.isCurrentMonth
                      ? 'bg-white hover:bg-amber-50/20'
                      : 'bg-slate-50/50 text-slate-400 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Quick Add icon on hover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNewTourModal(cell.dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-amber-700 rounded transition-opacity"
                      title={`Add tour starting ${cell.dateStr}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Tours Active on this Date */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-none">
                    {dateTours.map((t) => {
                      const isStart = cell.dateStr === t.startDate;
                      const isEnd = cell.dateStr === t.endDate;

                      return (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTour(t);
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold truncate transition-all shadow-2xs flex items-center justify-between gap-1 cursor-pointer ${
                            t.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 hover:bg-emerald-200'
                              : t.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-950 border border-blue-300 hover:bg-blue-200'
                              : t.status === 'Completed'
                              ? 'bg-purple-100 text-purple-950 border border-purple-300 hover:bg-purple-200'
                              : 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200'
                          }`}
                          title={`${t.tourName || t.title} (${t.startDate} - ${t.endDate})`}
                        >
                          <span className="truncate">
                            {isStart && '▶ '}
                            {t.tourName || t.title}
                          </span>
                          <span className="font-mono text-[9px] opacity-75 shrink-0">
                            {t.partySize}p
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: OPERATIONS TIMELINE / GANTT VIEW */}
      {activeViewMode === 'timeline' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Active Tours Schedule for {monthNames[month]} {year}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-day tour timelines across this month showing overlap, guides, and chauffeurs.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTours.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No tours match your current filters.</div>
            ) : (
              filteredTours.map((t) => {
                const client = clients.find((c) => c.id === t.clientId);

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTour(t)}
                    className="p-4 bg-slate-50 hover:bg-amber-50/50 border border-slate-200 rounded-2xl transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-slate-200 text-slate-800">
                          {t.code}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-950">
                          {t.tourName || t.title}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            t.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                        <span>{t.startDate} &rarr; {t.endDate} ({t.days.length} Days)</span>
                        <span className="font-mono text-slate-900 font-bold">{formatMoney(t.totalClientPrice, t.currency)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Client: <strong className="text-slate-700">{client?.name || 'VIP Client'}</strong></span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span>{t.destination}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-slate-400" />
                        <span>Guide: <strong className="text-slate-700">{t.guideName || 'Unassigned'}</strong></span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>Chauffeur: <strong className="text-slate-700">{t.driverName || 'Fleet'}</strong></span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: AGENDA LIST VIEW */}
      {activeViewMode === 'agenda' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">
              Upcoming Tour Operations Agenda ({filteredTours.length} Tours)
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredTours.map((t) => {
              const client = clients.find((c) => c.id === t.clientId);

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTour(t)}
                  className="p-5 hover:bg-amber-50/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {t.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          t.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {t.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {t.startDate} to {t.endDate}
                      </span>
                    </div>
                    <h4 className="font-black text-base text-slate-900">
                      {t.tourName || t.title}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {t.destination} &bull; Guest: <strong className="text-slate-700">{client?.name || 'VIP Client'}</strong> ({t.partySize} guests)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTripId(t.id);
                        setActiveView('tour-management');
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tour Area</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openClientPortal(t.id);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Live View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK TOUR INSPECTOR MODAL */}
      {selectedTour && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900">
                    {selectedTour.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      selectedTour.status === 'Confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {selectedTour.status}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedTour.tourName || selectedTour.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTour(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Client</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {selectedClient?.name || 'Assigned VIP Guest'}
                </span>
                <span className="text-[11px] text-slate-500">{selectedClient?.phone || selectedClient?.email}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tour Dates &amp; Duration</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {selectedTour.startDate} &rarr; {selectedTour.endDate}
                </span>
                <span className="text-[11px] text-slate-500">{selectedTour.days.length} Days &bull; {selectedTour.partySize} Guests</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Dedicated Tour Guide</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {selectedTour.guideName || 'Unassigned'}
                </span>
                <span className="text-[11px] text-slate-500">Assigned Master Guide</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Chauffeur / Fleet</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {selectedTour.driverName || 'Ehud Luxury Fleet'}
                </span>
                <span className="text-[11px] text-slate-500">Dedicated Tour Dispatch</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Package Price</span>
                <span className="text-base font-black text-slate-900 font-mono">
                  {formatMoney(selectedTour.totalClientPrice, selectedTour.currency)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTripId(selectedTour.id);
                  setActiveView('tour-gross-profit');
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-amber-300 text-amber-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Inspect Gross Profit &rarr;</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTour(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openClientPortal(selectedTour.id)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Live Client View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTripId(selectedTour.id);
                    setActiveView('tour-management');
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tour Management Area &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
