import React, { useState, useRef, useMemo } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  Move,
  GripVertical,
  GripHorizontal,
  Sparkles,
  AlertTriangle,
  Building,
  Check,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Search,
  Star,
  Tag,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  Bell,
  Mail,
  MessageSquare,
  BookOpen,
  Edit3,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  ActivityCatalogItem,
  HotelInfo,
  Itinerary,
  ItineraryActivity,
  ItineraryDay,
  SavedDescriptionSnippet,
  SupplierBooking,
} from '../../types';
import { SavedDescriptionGeneratorModal } from './SavedDescriptionGeneratorModal';
import { LoneProviderAvailabilityChecker } from '../suppliers/LoneProviderAvailabilityChecker';
import { ShiftKeywordListener } from './ShiftKeywordListener';

interface LargeDayTableWorkspaceProps {
  tripId: string;
  dayId: string;
  onClose: () => void;
  onOpenHotelModal: (hotel: HotelInfo) => void;
}

// 24 hourly slots: 00:00 through 23:00
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const formatHourLabel = (hour: number) => {
  const pad = hour < 10 ? `0${hour}` : `${hour}`;
  return `${pad}:00`;
};

const parseTimeToHourFraction = (timeStr?: string): number => {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m || 0) / 60;
};

export const LargeDayTableWorkspace: React.FC<LargeDayTableWorkspaceProps> = ({
  tripId,
  dayId: initialDayId,
  onClose,
  onOpenHotelModal,
}) => {
  const {
    itineraries,
    hotels,
    addHotel,
    suppliers,
    supplierBookings,
    staff,
    activityCatalog,
    addActivityCatalogItem,
    addSupplierBooking,
    updateSupplierBooking,
    addActivityToDay,
    updateActivityInDay,
    deleteActivityFromDay,
    moveActivity,
    conflicts,
    updateDayInItinerary,
    hasFullFinancialView,
  } = useApp();

  const trip = itineraries.find((t) => t.id === tripId);
  const [currentDayId, setCurrentDayId] = useState<string>(initialDayId);

  // Column width zoom: 'compact' (90px), 'spacious' (120px), 'ultra' (160px)
  const [columnWidthPx, setColumnWidthPx] = useState<number>(120);

  // Quick Add Activity Modal/State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddStartHour, setQuickAddStartHour] = useState<number>(10);
  const [quickAddDuration, setQuickAddDuration] = useState<number>(2);
  const [quickAddSourceMode, setQuickAddSourceMode] = useState<'library' | 'custom'>('library');
  const [quickAddSelectedLibraryId, setQuickAddSelectedLibraryId] = useState<string>('');
  const [quickAddSaveToLibrary, setQuickAddSaveToLibrary] = useState<boolean>(true);
  const [quickAddLibraryKeyword, setQuickAddLibraryKeyword] = useState<string>('');
  const [quickAddTitle, setQuickAddTitle] = useState<string>('');
  const [quickAddDescription, setQuickAddDescription] = useState<string>('');
  const [quickAddCategory, setQuickAddCategory] = useState<string>('');
  const [quickAddSupplierId, setQuickAddSupplierId] = useState<string>('');
  const [quickAddBookingStatus, setQuickAddBookingStatus] = useState<string>('to be booked');
  const [quickAddStaffId, setQuickAddStaffId] = useState<string>('');
  const [quickAddDeadline, setQuickAddDeadline] = useState<string>('');
  const [quickAddBookingTimeframe, setQuickAddBookingTimeframe] = useState<string>('Within 48 hours');
  const [quickAddFollowUpDate, setQuickAddFollowUpDate] = useState<string>('');
  const [quickAddAutoWhatsApp, setQuickAddAutoWhatsApp] = useState(true);
  const [quickAddAutoEmail, setQuickAddAutoEmail] = useState(true);

  // Manual Edit Activity State
  const [editingActivity, setEditingActivity] = useState<ItineraryActivity | null>(null);
  const [editAutoWhatsApp, setEditAutoWhatsApp] = useState(true);
  const [editAutoEmail, setEditAutoEmail] = useState(true);

  // Workspace Toast Notification
  const [workspaceToast, setWorkspaceToast] = useState<string | null>(null);

  const showWorkspaceToast = (msg: string) => {
    setWorkspaceToast(msg);
    setTimeout(() => setWorkspaceToast(null), 4500);
  };

  // Keyword Description Generator Modal
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [keywordTarget, setKeywordTarget] = useState<'quickAdd' | 'editing' | null>(null);

  // Lone Provider Auditor Trigger
  const [auditSupplierState, setAuditSupplierState] = useState<{
    supplierId: string;
    date: string;
  } | null>(null);

  // Drag and Drop (moving along table)
  const [draggedActivity, setDraggedActivity] = useState<ItineraryActivity | null>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Outward Resize state (live drag stretching)
  const [resizingInfo, setResizingInfo] = useState<{
    activity: ItineraryActivity;
    direction: 'right' | 'left';
    initialStartH: number;
    initialEndH: number;
    previewStartH: number;
    previewEndH: number;
  } | null>(null);

  if (!trip) return null;

  const currentDayIndex = trip.days.findIndex((d) => d.id === currentDayId);
  const currentDay = trip.days[currentDayIndex] || trip.days[0];
  const dayHotel = hotels.find((h) => h.id === currentDay?.hotelId);
  const hotelDisplayName = currentDay?.hotelName || dayHotel?.name;

  const [largeTableHotelInput, setLargeTableHotelInput] = useState('');
  const [isEditingWorkspaceHotel, setIsEditingWorkspaceHotel] = useState(false);

  const handleSaveWorkspaceHotel = () => {
    if (!currentDay || !trip) return;
    const name = largeTableHotelInput.trim();
    if (!name) return;

    const match = hotels.find((h) => h.name.toLowerCase() === name.toLowerCase());
    let hotelId = match?.id;

    if (!match) {
      const newHotelId = `hotel-${Date.now()}`;
      const newHotel: HotelInfo = {
        id: newHotelId,
        name: name,
        city: trip.destination.split(',')[0]?.trim() || 'Local Area',
        country: trip.destination.split(',')[1]?.trim() || 'Israel',
        address: `${name}, ${trip.destination}`,
        starRating: 5,
        imageUrl:
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        galleryUrls: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        ],
        description: `Accommodations at ${name}.`,
        roomType: 'Deluxe Room',
        boardBasis: 'Bed & Breakfast',
        amenities: ['Free WiFi', 'Breakfast Included', 'Concierge Service'],
        checkInTime: '15:00',
        checkOutTime: '11:00',
        contactPhone: '+972 2-555-0100',
        pricePerNight: 450,
        currency: trip.currency || 'USD',
      };
      addHotel(newHotel);
      hotelId = newHotelId;
    }

    updateDayInItinerary(trip.id, {
      ...currentDay,
      hotelId,
      hotelName: name,
    });
    setIsEditingWorkspaceHotel(false);
    setLargeTableHotelInput('');
  };

  const handleSelectWorkspaceHotel = (selectedHotelId: string) => {
    if (!currentDay || !trip) return;
    if (!selectedHotelId) {
      updateDayInItinerary(trip.id, {
        ...currentDay,
        hotelId: undefined,
        hotelName: undefined,
      });
      setIsEditingWorkspaceHotel(false);
      return;
    }

    const hotelObj = hotels.find((h) => h.id === selectedHotelId);
    updateDayInItinerary(trip.id, {
      ...currentDay,
      hotelId: selectedHotelId,
      hotelName: hotelObj ? hotelObj.name : undefined,
    });
    setIsEditingWorkspaceHotel(false);
  };

  const dayConflicts = conflicts.filter(
    (c) => (c.tripId1 === trip.id || c.tripId2 === trip.id) && c.date === currentDay?.date
  );

  // Navigation between days
  const handlePrevDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDayId(trip.days[currentDayIndex - 1].id);
    }
  };

  const handleNextDay = () => {
    if (currentDayIndex < trip.days.length - 1) {
      setCurrentDayId(trip.days[currentDayIndex + 1].id);
    }
  };

  // Drag start for shifting activity position
  const handleDragStart = (e: React.DragEvent, act: ItineraryActivity) => {
    setDraggedActivity(act);
    e.dataTransfer.setData('text/plain', act.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Drag over hour slot
  const handleDragOver = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (hoveredHour !== hour) {
      setHoveredHour(hour);
    }
  };

  // Drop onto hour slot
  const handleDrop = (targetHour: number) => {
    if (!draggedActivity || !currentDay) return;

    const currentStart = parseTimeToHourFraction(draggedActivity.startTime);
    const currentEnd = parseTimeToHourFraction(draggedActivity.endTime);
    const duration = Math.max(1, Math.round(currentEnd - currentStart));

    const newStartH = targetHour;
    const newEndH = Math.min(24, targetHour + duration);

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const newStartStr = `${pad(newStartH)}:00`;
    const newEndStr = `${pad(newEndH)}:00`;

    updateActivityInDay(trip.id, currentDay.id, {
      ...draggedActivity,
      startTime: newStartStr,
      endTime: newEndStr,
      timeSlot: `${newStartStr} - ${newEndStr}`,
    });

    setDraggedActivity(null);
    setHoveredHour(null);
  };

  // OUTWARD MOUSE RESIZING (Right handle extends end time outward, Left handle extends start time outward)
  const handleStartOutwardResize = (
    e: React.MouseEvent,
    act: ItineraryActivity,
    direction: 'right' | 'left'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const initialStart = parseTimeToHourFraction(act.startTime);
    const initialEnd = parseTimeToHourFraction(act.endTime);

    setResizingInfo({
      activity: act,
      direction,
      initialStartH: initialStart,
      initialEndH: initialEnd,
      previewStartH: initialStart,
      previewEndH: initialEnd,
    });

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      // Calculate delta hours based on column width
      const deltaHours = Math.round(deltaX / columnWidthPx);

      if (direction === 'right') {
        const newEnd = Math.min(24, Math.max(initialStart + 0.5, initialEnd + deltaHours));
        setResizingInfo((prev) => (prev ? { ...prev, previewEndH: newEnd } : null));
      } else {
        const newStart = Math.max(0, Math.min(initialEnd - 0.5, initialStart + deltaHours));
        setResizingInfo((prev) => (prev ? { ...prev, previewStartH: newStart } : null));
      }
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      const deltaX = upEvent.clientX - startX;
      const deltaHours = Math.round(deltaX / columnWidthPx);

      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

      if (direction === 'right') {
        const finalEnd = Math.min(24, Math.max(initialStart + 1, initialEnd + deltaHours));
        const finalEndStr = `${pad(finalEnd)}:00`;
        updateActivityInDay(trip.id, currentDay.id, {
          ...act,
          endTime: finalEndStr,
          timeSlot: `${act.startTime} - ${finalEndStr}`,
        });
      } else {
        const finalStart = Math.max(0, Math.min(initialEnd - 1, initialStart + deltaHours));
        const finalStartStr = `${pad(finalStart)}:00`;
        updateActivityInDay(trip.id, currentDay.id, {
          ...act,
          startTime: finalStartStr,
          timeSlot: `${finalStartStr} - ${act.endTime}`,
        });
      }

      setResizingInfo(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Quick delta adjustments (Outward extension)
  const handleExtendOutward = (act: ItineraryActivity, deltaHours: number) => {
    const startH = parseTimeToHourFraction(act.startTime);
    const endH = parseTimeToHourFraction(act.endTime);
    let newEnd = endH + deltaHours;

    if (newEnd <= startH + 0.5) return;
    if (newEnd > 24) newEnd = 24;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const wholeH = Math.floor(newEnd);
    const mins = Math.round((newEnd - wholeH) * 60);
    const newEndStr = `${pad(wholeH)}:${pad(mins)}`;

    updateActivityInDay(trip.id, currentDay.id, {
      ...act,
      endTime: newEndStr,
      timeSlot: `${act.startTime} - ${newEndStr}`,
    });
  };

  // Select from activity library dropdown
  const handleSelectLibraryItem = (catalogItemId: string) => {
    setQuickAddSelectedLibraryId(catalogItemId);
    if (!catalogItemId) {
      setQuickAddTitle('');
      setQuickAddDescription('');
      return;
    }
    const item = activityCatalog.find((a) => a.id === catalogItemId);
    if (item) {
      setQuickAddTitle(item.name);
      setQuickAddDescription(item.description);
      setQuickAddCategory(item.category || '');
      setQuickAddDuration(Math.max(1, Math.round(item.durationHours)));
      if (item.supplierId) {
        setQuickAddSupplierId(item.supplierId);
      }
    }
  };

  // Open quick add pre-filled with specific hour
  const handleOpenHourSlot = (hour: number) => {
    setQuickAddStartHour(hour);
    setQuickAddDuration(2);
    setQuickAddSourceMode('library');
    setQuickAddSelectedLibraryId('');
    setQuickAddTitle('');
    setQuickAddDescription('');
    setQuickAddCategory('');
    setQuickAddSupplierId('');
    setQuickAddSaveToLibrary(true);
    setQuickAddLibraryKeyword('');
    setQuickAddBookingStatus('to be booked');
    setIsQuickAddOpen(true);
  };

  const handleSaveQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTitle.trim()) return;

    const startH = quickAddStartHour;
    const endH = Math.min(24, startH + quickAddDuration);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    const act: ItineraryActivity = {
      id: `act-${Date.now()}`,
      title: quickAddTitle.trim(),
      description: quickAddDescription.trim() || `Curated session in ${trip.destination}.`,
      startTime: `${pad(startH)}:00`,
      endTime: `${pad(endH)}:00`,
      timeSlot: `${pad(startH)}:00 - ${pad(endH)}:00`,
      location: trip.destination,
      category: quickAddCategory.trim() || undefined,
      supplierId: quickAddSupplierId || undefined,
      included: true,
      costEstimate: 250 * quickAddDuration,
      currency: trip.currency,
      bookingStatus: (quickAddBookingStatus as any) || 'to be booked',
      assignedBookingStaffId: quickAddStaffId || undefined,
      bookingDeadline: quickAddDeadline || undefined,
      bookingTimeframe: quickAddBookingTimeframe || undefined,
      followUpDate: quickAddFollowUpDate || undefined,
    };

    addActivityToDay(trip.id, currentDay.id, act);

    // If custom activity and user opted to automatically save to activity library:
    if (quickAddSourceMode === 'custom' && quickAddSaveToLibrary) {
      const cleanKeyword = quickAddLibraryKeyword.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const newCatalogItem: ActivityCatalogItem = {
        id: `act-${Date.now()}`,
        name: act.title,
        description: act.description,
        durationHours: quickAddDuration,
        category: act.category,
        location: act.location,
        costEstimate: act.costEstimate,
        currency: act.currency,
        supplierId: act.supplierId,
        included: true,
        keyword: cleanKeyword || undefined,
      };
      addActivityCatalogItem(newCatalogItem);
      showWorkspaceToast(
        `Added "${act.title}" to itinerary and automatically saved to Activity Library!${cleanKeyword ? ` (Keyword: Shift + "${cleanKeyword}")` : ''}`
      );
    } else {
      showWorkspaceToast(`Added "${act.title}" to Day ${currentDay.dayNumber}!`);
    }

    // If supplier is booked, register official SupplierBooking with scheduled day-prior WhatsApp and Email reminders
    if (quickAddSupplierId) {
      const supplier = suppliers.find((s) => s.id === quickAddSupplierId);
      const booking: SupplierBooking = {
        id: `book-${Date.now()}`,
        supplierId: quickAddSupplierId,
        tripId: trip.id,
        serviceDescription: act.title,
        date: currentDay.date,
        startTime: act.startTime,
        endTime: act.endTime,
        guestsCount: trip.partySize || 2,
        status: 'Requested',
        cost: act.costEstimate || 250,
        currency: trip.currency,
        autoRemindersEnabled: quickAddAutoWhatsApp || quickAddAutoEmail,
        whatsappReminderStatus: quickAddAutoWhatsApp ? 'Scheduled' : 'Disabled',
        emailReminderStatus: quickAddAutoEmail ? 'Scheduled' : 'Disabled',
        notes: `Activity booked from Large Day Table Workspace. Pre-engagement reminder scheduled 1 day prior (${currentDay.date}).`,
      };
      addSupplierBooking(booking);
    }

    setIsQuickAddOpen(false);
  };

  // Insert snippet from Keyword Generator
  const handleApplySnippet = (snippet: SavedDescriptionSnippet) => {
    if (keywordTarget === 'quickAdd') {
      setQuickAddTitle(snippet.title);
      setQuickAddDescription(snippet.description);
      setQuickAddCategory(snippet.category || '');
      setQuickAddDuration(snippet.defaultDurationHours);
      if (snippet.recommendedSupplierId) {
        setQuickAddSupplierId(snippet.recommendedSupplierId);
      }
    } else if (keywordTarget === 'editing' && editingActivity) {
      setEditingActivity({
        ...editingActivity,
        title: snippet.title,
        description: snippet.description,
        category: snippet.category,
        location: snippet.location,
        supplierId: snippet.recommendedSupplierId || editingActivity.supplierId,
      });
    }
  };

  // Check Lone Provider clash
  const checkClash = (supplierId?: string) => {
    if (!supplierId || !currentDay) return null;
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier?.isLoneProvider) return null;

    const bookingClash = supplierBookings.find(
      (b) =>
        b.supplierId === supplierId &&
        b.date === currentDay.date &&
        b.tripId !== trip.id &&
        b.status !== 'Cancelled'
    );
    if (bookingClash) {
      const otherTrip = itineraries.find((t) => t.id === bookingClash.tripId);
      return {
        clash: true,
        supplier,
        message: `CLASH: ${supplier.name} is booked on ${currentDay.date} for ${otherTrip?.code || 'another group'} (${bookingClash.serviceDescription}).`,
      };
    }

    return {
      clash: false,
      supplier,
      message: `FREE: ${supplier.name} is completely available on ${currentDay.date}.`,
    };
  };

  const totalGridWidthPx = HOURS.length * columnWidthPx;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col overflow-hidden text-slate-900 animate-fadeIn">
      {/* Top Workspace Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
            title="Exit large table workspace"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-slate-950">
                Large Day Table Workspace
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentDay?.date} &bull; {trip.code}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-0.5 flex items-center gap-2">
              <span>Day {currentDay?.dayNumber}: {currentDay?.title}</span>
            </h1>
          </div>
        </div>

        {/* Workspace Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Day Navigation */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={handlePrevDay}
              disabled={currentDayIndex === 0}
              className="px-2.5 py-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev Day</span>
            </button>
            <span className="px-3 py-1 font-bold text-amber-400 border-x border-slate-700">
              Day {currentDay?.dayNumber} / {trip.days.length}
            </span>
            <button
              onClick={handleNextDay}
              disabled={currentDayIndex === trip.days.length - 1}
              className="px-2.5 py-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 flex items-center gap-1 font-semibold"
            >
              <span>Next Day</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Table Cell Zoom Width */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1 text-xs font-semibold">
            <span className="px-2 text-slate-400 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-slate-400" />
              <span>Cell Width:</span>
            </span>
            {[
              { label: 'Normal', width: 95 },
              { label: 'Spacious', width: 125 },
              { label: 'Wide', width: 160 },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => setColumnWidthPx(btn.width)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  columnWidthPx === btn.width
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Shift + Keyword Fast Insertion Info Badge */}
          <div
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-bold"
            title="Hold Shift and type any linked keyword (e.g. masada, deadsea, wine) to auto-insert the activity into this day"
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Hold <strong className="font-mono bg-slate-800 px-1 py-0.5 rounded border border-amber-400/40 text-amber-300">Shift</strong> + type keyword to auto-insert
            </span>
          </div>

          {/* Keyword Generator Trigger */}
          <button
            onClick={() => {
              setKeywordTarget('quickAdd');
              setIsKeywordModalOpen(true);
            }}
            className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
            title="Search and insert saved descriptions by keyword"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Keyword Generator</span>
          </button>

          {/* Add Activity button */}
          <button
            onClick={() => handleOpenHourSlot(10)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Activity</span>
          </button>
        </div>
      </div>

      {/* Day Overview Strip */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 shrink-0">
        <div className="flex items-center space-x-3 flex-wrap">
          <span>Destination: <strong className="text-white">{trip.destination}</strong></span>
          <span>&bull;</span>
          {!hotelDisplayName || isEditingWorkspaceHotel ? (
            <div className="flex items-center space-x-2 bg-amber-500/20 border border-amber-400/70 px-2.5 py-1 rounded-xl">
              <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-300 font-extrabold text-xs animate-pulse">⚠️ Hotel Needed:</span>
              <input
                type="text"
                value={largeTableHotelInput}
                onChange={(e) => setLargeTableHotelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveWorkspaceHotel();
                  }
                }}
                placeholder="Enter hotel name..."
                className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded border border-amber-400/60 focus:border-amber-400 outline-none w-48 placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleSaveWorkspaceHotel}
                disabled={!largeTableHotelInput.trim()}
                className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded transition-colors cursor-pointer"
              >
                Save
              </button>
              {hotels.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) handleSelectWorkspaceHotel(e.target.value);
                  }}
                  className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded border border-slate-700 cursor-pointer"
                >
                  <option value="">Or catalog ({hotels.length})</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>{h.name} ({h.city})</option>
                  ))}
                </select>
              )}
              {hotelDisplayName && isEditingWorkspaceHotel && (
                <button
                  type="button"
                  onClick={() => setIsEditingWorkspaceHotel(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-xl">
              <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-slate-400 text-xs font-semibold">Night Hotel:</span>
              <strong className="text-amber-300 text-xs font-black">{hotelDisplayName}</strong>
              <button
                type="button"
                onClick={() => {
                  setLargeTableHotelInput(hotelDisplayName);
                  setIsEditingWorkspaceHotel(true);
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold ml-1 cursor-pointer"
              >
                Change
              </button>
              {dayHotel && (
                <button
                  type="button"
                  onClick={() => onOpenHotelModal(dayHotel)}
                  className="text-slate-300 hover:text-white hover:underline text-[11px] font-semibold"
                  title="View Hotel Info & Amenities"
                >
                  View Info
                </button>
              )}
            </div>
          )}
          <span>&bull;</span>
          <span>Activities: <strong className="text-white">{currentDay.activities.length}</strong></span>
        </div>

        <div className="flex items-center space-x-3 text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <GripHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Grab the right edge of any box and <strong>drag outward</strong> to extend hours</span>
          </span>
        </div>
      </div>

      {/* Main Expansive Large Table Canvas */}
      <div className="flex-1 overflow-auto bg-slate-100 p-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 min-w-max space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Visual Time Track Table &bull; Day {currentDay.dayNumber} ({currentDay.date})
              </h2>
              <p className="text-xs text-slate-500">
                Click any slot to place an activity. Grab handles to extend boxes outward or drag horizontally to change start times.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
              <span>Timeline: 00:00 &ndash; 24:00</span>
            </div>
          </div>

          {/* LARGE EXPANDED TABLE */}
          <div
            style={{ width: `${totalGridWidthPx}px` }}
            className="border border-slate-200 rounded-2xl overflow-hidden bg-white select-none"
          >
            {/* Table Hours Header Row */}
            <div className="grid border-b border-slate-200 bg-slate-900 text-white font-mono text-xs font-bold divide-x divide-slate-800"
              style={{ gridTemplateColumns: `repeat(${HOURS.length}, ${columnWidthPx}px)` }}
            >
              {HOURS.map((hour) => (
                <div key={hour} className="py-2.5 px-2 text-center flex flex-col items-center justify-center">
                  <span className="text-xs font-extrabold">{formatHourLabel(hour)}</span>
                  <span className="text-[9px] text-slate-400 font-normal">Slot #{hour - 7}</span>
                </div>
              ))}
            </div>

            {/* Interactive Grid Cell Drop Targets Row */}
            <div
              className="relative min-h-[160px] bg-slate-50/50"
              style={{ width: `${totalGridWidthPx}px` }}
            >
              {/* Background hour columns */}
              <div
                className="grid h-full absolute inset-0 divide-x divide-slate-200"
                style={{ gridTemplateColumns: `repeat(${HOURS.length}, ${columnWidthPx}px)` }}
              >
                {HOURS.map((hour) => {
                  const isHovered = hoveredHour === hour;
                  return (
                    <div
                      key={hour}
                      onDragOver={(e) => handleDragOver(e, hour)}
                      onDrop={() => handleDrop(hour)}
                      onClick={() => handleOpenHourSlot(hour)}
                      className={`h-full min-h-[160px] transition-colors cursor-pointer flex flex-col justify-end p-2 group ${
                        isHovered
                          ? 'bg-amber-100 ring-2 ring-amber-400'
                          : 'hover:bg-amber-50/60'
                      }`}
                      title={`Click to place activity at ${formatHourLabel(hour)}`}
                    >
                      <div className="text-[10px] text-slate-300 group-hover:text-amber-700 font-mono font-bold flex items-center justify-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Positioned Activity Cards with Outward Drag Handles */}
              {currentDay.activities.map((act) => {
                const startH = parseTimeToHourFraction(act.startTime);
                const endH = parseTimeToHourFraction(act.endTime);

                // Check if currently dragging/resizing
                const isThisResizing = resizingInfo?.activity.id === act.id;
                const activeStart = isThisResizing ? resizingInfo.previewStartH : startH;
                const activeEnd = isThisResizing ? resizingInfo.previewEndH : endH;

                const clampedStart = Math.max(0, Math.min(23.5, activeStart));
                const clampedEnd = Math.max(clampedStart + 0.5, Math.min(24, activeEnd));

                const leftPx = clampedStart * columnWidthPx;
                const widthPx = Math.max((clampedEnd - clampedStart) * columnWidthPx, 90);
                const durationHours = clampedEnd - clampedStart;

                const supplier = suppliers.find((s) => s.id === act.supplierId);
                const isLone = supplier?.isLoneProvider;

                const clashInfo = checkClash(act.supplierId);

                const normLT = (act.bookingStatus || 'to be booked').toLowerCase();
                const isConfirmedLT = normLT === 'confirmed' || normLT === 'booked';
                const isRequestedLT = normLT === 'booking requested' || normLT === 'requested';
                const isToBeBookedLT = !isConfirmedLT && !isRequestedLT;

                const cardColorClassLT = isConfirmedLT
                  ? 'bg-emerald-50/95 border-emerald-400 ring-1 ring-emerald-400 text-emerald-950 shadow-sm'
                  : isRequestedLT
                  ? 'bg-blue-50/95 border-blue-400 ring-1 ring-blue-400 text-blue-950 shadow-sm'
                  : 'bg-yellow-50/95 border-yellow-400 ring-1 ring-yellow-400 text-yellow-950 shadow-sm';

                const assignedStaffLT = staff.find((s) => s.id === act.assignedBookingStaffId);

                return (
                  <div
                    key={act.id}
                    draggable={!resizingInfo}
                    onDragStart={(e) => handleDragStart(e, act)}
                    onClick={() => setEditingActivity(act)}
                    style={{
                      left: `${leftPx}px`,
                      width: `${widthPx}px`,
                      top: '12px',
                    }}
                    className={`absolute min-h-[136px] rounded-2xl p-3 shadow-md border flex flex-col justify-between transition-shadow z-20 group select-none cursor-pointer ${
                      isThisResizing
                        ? 'ring-4 ring-amber-400 shadow-xl bg-amber-50/95 border-amber-500'
                        : clashInfo?.clash
                        ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
                        : cardColorClassLT
                    }`}
                  >
                    {/* LEFT RESIZE HANDLE (EXTEND OUTWARD TO THE LEFT) */}
                    <div
                      onMouseDown={(e) => handleStartOutwardResize(e, act, 'left')}
                      className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-amber-400/50 rounded-l-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30"
                      title="Drag outward to the left to start earlier"
                    >
                      <div className="w-1 h-6 bg-slate-400 rounded-full" />
                    </div>

                    {/* RIGHT RESIZE HANDLE (EXTEND OUTWARD TO THE RIGHT) */}
                    <div
                      onMouseDown={(e) => handleStartOutwardResize(e, act, 'right')}
                      className="absolute right-0 top-0 bottom-0 w-3.5 cursor-ew-resize hover:bg-amber-500/60 rounded-r-2xl flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity z-30 bg-amber-400/20"
                      title="Drag outward to the right to extend duration across hours"
                    >
                      <div className="w-1.5 h-8 bg-amber-600 rounded-full shadow-xs" />
                    </div>

                    {/* Card Content Top Header */}
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-mono font-bold bg-white/90 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-700" />
                            {act.startTime} &ndash; {act.endTime}
                          </span>

                          {isConfirmedLT && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-600 text-white shadow-2xs">
                              🟢 Confirmed
                            </span>
                          )}
                          {isRequestedLT && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-600 text-white shadow-2xs">
                              🔵 Requested
                            </span>
                          )}
                          {isToBeBookedLT && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-yellow-400 text-slate-950 shadow-2xs">
                              🟡 To Book
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {isLone && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-purple-700" />
                              LONE
                            </span>
                          )}

                          <button
                            onClick={() => setEditingActivity(act)}
                            className="p-1 text-slate-500 hover:text-slate-900 bg-white/80 rounded-md hover:bg-white shadow-2xs"
                            title="Click to edit activity details and booking status"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => deleteActivityFromDay(trip.id, currentDay.id, act.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 bg-white/80 rounded-md hover:bg-white shadow-2xs"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-extrabold text-xs text-slate-950 line-clamp-2 leading-snug">
                        {act.title}
                      </h4>
                      <p className="text-[10px] text-slate-700 line-clamp-1 mt-0.5">
                        {act.location} {supplier && `&bull; ${supplier.name}`}
                      </p>

                      {/* Staff & Deadline Preview */}
                      {(assignedStaffLT || act.bookingDeadline || act.followUpDate) && (
                        <div className="mt-1 text-[10px] font-semibold flex items-center gap-1.5">
                          {assignedStaffLT && (
                            <span className="bg-white/90 border border-slate-200 px-1 py-0.2 rounded text-slate-800">
                              Staff: {assignedStaffLT.name.split(' ')[0]}
                            </span>
                          )}
                          {isToBeBookedLT && (act.bookingDeadline || act.bookingTimeframe) && (
                            <span className="text-yellow-950 font-bold">
                              Due: {act.bookingDeadline || act.bookingTimeframe}
                            </span>
                          )}
                          {isRequestedLT && act.followUpDate && (
                            <span className="text-blue-950 font-bold">
                              Follow-up: {act.followUpDate}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Outward Extension Controls */}
                    <div className="mt-2 pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                      <span className="font-extrabold text-slate-700 font-mono">
                        {Math.round(durationHours * 10) / 10}h duration
                      </span>

                      {/* Outward buttons & drag grip */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExtendOutward(act, -1);
                          }}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded"
                          title="Shrink 1 hour"
                        >
                          -1h
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExtendOutward(act, 1);
                          }}
                          className="px-1.5 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded"
                          title="Extend outward +1 hour"
                        >
                          +1h Outward
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExtendOutward(act, 2);
                          }}
                          className="px-1.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded hidden sm:inline"
                          title="Extend outward +2 hours"
                        >
                          +2h
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Outward Extension:</strong> Hover over the right edge of any box and drag outward to the right to extend its hours. Drag the card left or right along the table to shift timings.
              </span>
            </div>
            <button
              onClick={() => {
                setKeywordTarget('quickAdd');
                setIsKeywordModalOpen(true);
              }}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-xl font-bold text-xs text-slate-800 shrink-0 flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>Browse Saved Descriptions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white shrink-0">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Schedule Activity at {formatHourLabel(quickAddStartHour)}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveQuickAdd} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {/* SOURCE MODE SWITCHER: LIBRARY DROPDOWN VS CUSTOM ACTIVITY */}
              <div className="flex items-center p-1 bg-slate-100 rounded-2xl gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddSourceMode('library');
                    if (activityCatalog.length > 0 && !quickAddSelectedLibraryId) {
                      handleSelectLibraryItem(activityCatalog[0].id);
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    quickAddSourceMode === 'library'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Choose from Activity Library ({activityCatalog.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddSourceMode('custom');
                    setQuickAddSelectedLibraryId('');
                    setQuickAddTitle('');
                    setQuickAddDescription('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    quickAddSourceMode === 'custom'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Type New Custom Activity</span>
                </button>
              </div>

              {/* MODE 1: CHOOSE FROM ACTIVITY LIBRARY DROPDOWN */}
              {quickAddSourceMode === 'library' && (
                <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-amber-950 uppercase flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                      <span>Select Activity from Library Dropdown *</span>
                    </label>
                    <span className="text-[10px] text-amber-800 font-semibold">Autofills details & length</span>
                  </div>
                  <select
                    value={quickAddSelectedLibraryId}
                    onChange={(e) => handleSelectLibraryItem(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold bg-white border-2 border-amber-400 rounded-xl text-slate-900 outline-none shadow-2xs"
                  >
                    <option value="">-- Choose an activity from library --</option>
                    {activityCatalog.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.durationHours}h{item.category ? ` • ${item.category}` : ''}{item.keyword ? ` • Shift+"${item.keyword}"` : ''})
                      </option>
                    ))}
                  </select>

                  {quickAddSelectedLibraryId && (
                    <div className="text-[11px] text-amber-900 bg-white/80 p-2.5 rounded-xl border border-amber-200 space-y-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>Selected: {quickAddTitle}</span>
                        <span className="font-mono text-[10px] bg-amber-200 px-1.5 py-0.2 rounded font-black text-amber-950">
                          {quickAddDuration} Hours
                        </span>
                      </div>
                      <p className="line-clamp-2 text-slate-600">{quickAddDescription}</p>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: TYPE NEW CUSTOM ACTIVITY & AUTO-ADD TO LIBRARY OPTION */}
              {quickAddSourceMode === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase">Custom Activity Title *</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. Private Helicopter Flight over Masada..."
                      value={quickAddTitle}
                      onChange={(e) => setQuickAddTitle(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                  </div>

                  {/* AUTOMATICALLY ADD TO ACTIVITY LIBRARY CHECKBOX */}
                  <div className="p-3 bg-amber-50/60 rounded-2xl border-2 border-amber-300 space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quickAddSaveToLibrary}
                        onChange={(e) => setQuickAddSaveToLibrary(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-400"
                      />
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>Automatically add this to the Activity Library</span>
                          <span className="px-1.5 py-0.2 bg-amber-200 text-amber-950 font-bold text-[9px] rounded uppercase">
                            Recommended
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 leading-snug mt-0.5">
                          Saves this custom activity into your Master Activity Catalog so it can be reused in future itineraries and triggered with Shift-typing!
                        </div>
                      </div>
                    </label>

                    {quickAddSaveToLibrary && (
                      <div className="pt-2 border-t border-amber-200/80 flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">Link Keyword (optional):</span>
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-700">
                            Shift +
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. chopper"
                            value={quickAddLibraryKeyword}
                            onChange={(e) => setQuickAddLibraryKeyword(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                            className="w-full pl-14 pr-2 py-1 text-xs font-mono font-bold bg-white border border-amber-300 rounded-lg outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Title Input when in Library mode for optional fine-tuning */}
              {quickAddSourceMode === 'library' && (
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Activity Title (Customizable)</label>
                  <input
                    type="text"
                    required
                    placeholder="Activity title..."
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Full Description</label>
                <textarea
                  rows={2}
                  placeholder="Rich client-facing overview..."
                  value={quickAddDescription}
                  onChange={(e) => setQuickAddDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Start Hour</label>
                  <select
                    value={quickAddStartHour}
                    onChange={(e) => setQuickAddStartHour(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {formatHourLabel(h)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Duration (Hours)</label>
                  <select
                    value={quickAddDuration}
                    onChange={(e) => setQuickAddDuration(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold text-amber-800"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours</option>
                    <option value={3}>3 Hours</option>
                    <option value={4}>4 Hours (Half Day)</option>
                    <option value={5}>5 Hours</option>
                    <option value={6}>6 Hours</option>
                    <option value={8}>8 Hours (Full Day)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Category / Type (Optional)</label>
                  <select
                    value={quickAddCategory}
                    onChange={(e) => setQuickAddCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="">-- None / Unclassified --</option>
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Dining">Dining</option>
                    <option value="Transport">Transport</option>
                    <option value="Culture">Culture</option>
                    <option value="Leisure">Leisure</option>
                    <option value="Adventure">Adventure</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Assign Supplier</label>
                  <select
                    value={quickAddSupplierId}
                    onChange={(e) => setQuickAddSupplierId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="">-- No Direct Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.isLoneProvider ? '★ (LONE PROVIDER)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AUTOMATIC BOOKING STATUS & WORKER ASSIGNMENT PROMPT */}
              <div className="p-3 bg-amber-50/60 rounded-2xl border-2 border-amber-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Activity Booking Status (Required)</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">Color-coded on table</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickAddBookingStatus('to be booked')}
                    className={`p-2 rounded-xl border text-left text-xs font-extrabold transition-all ${
                      quickAddBookingStatus === 'to be booked'
                        ? 'bg-yellow-100 border-yellow-500 ring-2 ring-yellow-400 text-yellow-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-yellow-50/50'
                    }`}
                  >
                    <div>🟡 To Be Booked</div>
                    <div className="text-[9px] text-yellow-800 font-medium">Yellow marker</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickAddBookingStatus('booking requested')}
                    className={`p-2 rounded-xl border text-left text-xs font-extrabold transition-all ${
                      quickAddBookingStatus === 'booking requested'
                        ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-400 text-blue-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50/50'
                    }`}
                  >
                    <div>🔵 Requested</div>
                    <div className="text-[9px] text-blue-800 font-medium">Blue marker</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickAddBookingStatus('confirmed')}
                    className={`p-2 rounded-xl border text-left text-xs font-extrabold transition-all ${
                      quickAddBookingStatus === 'confirmed'
                        ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-400 text-emerald-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div>🟢 Confirmed</div>
                    <div className="text-[9px] text-emerald-800 font-medium">Green marker</div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-amber-200/60">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                      Assign Employee
                    </label>
                    <select
                      value={quickAddStaffId}
                      onChange={(e) => setQuickAddStaffId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none font-medium"
                    >
                      <option value="">-- No Staff Assignment --</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    {quickAddBookingStatus === 'to be booked' && (
                      <div>
                        <label className="text-[10px] font-bold text-yellow-900 uppercase block mb-1">
                          Booking Timeframe / Deadline
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={quickAddDeadline}
                            onChange={(e) => setQuickAddDeadline(e.target.value)}
                            className="w-1/2 px-2 py-1.5 text-xs bg-white border border-yellow-300 rounded-lg outline-none"
                          />
                          <select
                            value={quickAddBookingTimeframe}
                            onChange={(e) => setQuickAddBookingTimeframe(e.target.value)}
                            className="w-1/2 px-1 py-1.5 text-[10px] font-bold bg-white border border-yellow-300 rounded-lg outline-none text-yellow-950"
                          >
                            <option value="Within 24 hours">24h</option>
                            <option value="Within 48 hours">48h</option>
                            <option value="Within 7 days">7d</option>
                            <option value="Urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {quickAddBookingStatus === 'booking requested' && (
                      <div>
                        <label className="text-[10px] font-bold text-blue-900 uppercase block mb-1">
                          Follow-up Date *
                        </label>
                        <input
                          type="date"
                          value={quickAddFollowUpDate}
                          onChange={(e) => setQuickAddFollowUpDate(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs font-bold text-blue-950 bg-white border border-blue-400 rounded-lg outline-none"
                        />
                      </div>
                    )}

                    {quickAddBookingStatus === 'confirmed' && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-2 rounded-lg border border-emerald-200">
                        ✓ Confirmed &amp; locked in.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </div>

              {/* Sticky Footer: Always visible on screen, never off-screen */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Activity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Edit Activity Modal */}
      {editingActivity && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white shrink-0">
              <h3 className="text-sm font-extrabold text-slate-900">
                Edit Activity Details &amp; Timings
              </h3>
              <button
                type="button"
                onClick={() => setEditingActivity(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateActivityInDay(trip.id, currentDay.id, {
                  ...editingActivity,
                  timeSlot: `${editingActivity.startTime} - ${editingActivity.endTime}`,
                });
                setEditingActivity(null);
              }}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Title</label>
                  <button
                    type="button"
                    onClick={() => {
                      setKeywordTarget('editing');
                      setIsKeywordModalOpen(true);
                    }}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Keyword Snippet</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={editingActivity.title}
                  onChange={(e) => setEditingActivity({ ...editingActivity, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Description</label>
                <textarea
                  rows={3}
                  value={editingActivity.description}
                  onChange={(e) => setEditingActivity({ ...editingActivity, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Start Time</label>
                  <input
                    type="time"
                    required
                    value={editingActivity.startTime}
                    onChange={(e) => setEditingActivity({ ...editingActivity, startTime: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">End Time</label>
                  <input
                    type="time"
                    required
                    value={editingActivity.endTime}
                    onChange={(e) => setEditingActivity({ ...editingActivity, endTime: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Category / Type (Optional)</label>
                  <select
                    value={editingActivity.category || ''}
                    onChange={(e) => setEditingActivity({ ...editingActivity, category: e.target.value || undefined })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="">-- None / Unclassified --</option>
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Dining">Dining</option>
                    <option value="Transport">Transport</option>
                    <option value="Culture">Culture</option>
                    <option value="Leisure">Leisure</option>
                    <option value="Adventure">Adventure</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Supplier</label>
                  <select
                    value={editingActivity.supplierId || ''}
                    onChange={(e) => setEditingActivity({ ...editingActivity, supplierId: e.target.value || undefined })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="">-- No Direct Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.isLoneProvider ? '★ (LONE PROVIDER)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BOOKING STATUS, TIMEFRAME, AND WORKER ASSIGNMENT */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Internal Working Booking Marker
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">Color-coded across table</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingActivity({
                        ...editingActivity,
                        bookingStatus: 'to be booked',
                      })
                    }
                    className={`p-2 rounded-xl border text-left text-xs font-extrabold transition-all ${
                      editingActivity.bookingStatus === 'to be booked'
                        ? 'bg-yellow-100 border-yellow-500 ring-2 ring-yellow-400 text-yellow-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-yellow-50/50'
                    }`}
                  >
                    <div>🟡 To Be Booked</div>
                    <div className="text-[9px] text-yellow-800 font-medium">Yellow marker</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingActivity({
                        ...editingActivity,
                        bookingStatus: 'booking requested',
                      })
                    }
                    className={`p-2 rounded-xl border text-left text-xs font-extrabold transition-all ${
                      editingActivity.bookingStatus === 'booking requested'
                        ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-400 text-blue-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50/50'
                    }`}
                  >
                    <div>🔵 Requested</div>
                    <div className="text-[9px] text-blue-800 font-medium">Blue marker</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingActivity({
                        ...editingActivity,
                        bookingStatus: 'confirmed',
                      })
                    }
                    className={`p-2 rounded-xl border text-left text-xs font-extrabold transition-all ${
                      editingActivity.bookingStatus === 'confirmed'
                        ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-400 text-emerald-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div>🟢 Confirmed</div>
                    <div className="text-[9px] text-emerald-800 font-medium">Green marker</div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                      Assigned Employee
                    </label>
                    <select
                      value={editingActivity.assignedBookingStaffId || ''}
                      onChange={(e) =>
                        setEditingActivity({
                          ...editingActivity,
                          assignedBookingStaffId: e.target.value || undefined,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none font-medium"
                    >
                      <option value="">-- No Staff Assignment --</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    {editingActivity.bookingStatus === 'to be booked' && (
                      <div>
                        <label className="text-[10px] font-bold text-yellow-900 uppercase block mb-1">
                          Booking Timeframe / Deadline
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={editingActivity.bookingDeadline || ''}
                            onChange={(e) =>
                              setEditingActivity({
                                ...editingActivity,
                                bookingDeadline: e.target.value || undefined,
                              })
                            }
                            className="w-1/2 px-2 py-1.5 text-xs bg-white border border-yellow-300 rounded-lg outline-none"
                          />
                          <select
                            value={editingActivity.bookingTimeframe || 'Within 48 hours'}
                            onChange={(e) =>
                              setEditingActivity({
                                ...editingActivity,
                                bookingTimeframe: e.target.value,
                              })
                            }
                            className="w-1/2 px-1 py-1.5 text-[10px] font-bold bg-white border border-yellow-300 rounded-lg outline-none text-yellow-950"
                          >
                            <option value="Within 24 hours">24h</option>
                            <option value="Within 48 hours">48h</option>
                            <option value="Within 7 days">7d</option>
                            <option value="Urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {editingActivity.bookingStatus === 'booking requested' && (
                      <div>
                        <label className="text-[10px] font-bold text-blue-900 uppercase block mb-1">
                          Follow-up Date *
                        </label>
                        <input
                          type="date"
                          value={editingActivity.followUpDate || ''}
                          onChange={(e) =>
                            setEditingActivity({
                              ...editingActivity,
                              followUpDate: e.target.value || undefined,
                            })
                          }
                          className="w-full px-2 py-1.5 text-xs font-bold text-blue-950 bg-white border border-blue-400 rounded-lg outline-none"
                        />
                      </div>
                    )}

                    {editingActivity.bookingStatus === 'confirmed' && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-2 rounded-lg border border-emerald-200">
                        ✓ Confirmed &amp; booked. Prior tasks removed.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </div>

              {/* Sticky Footer: Always visible on screen, never off-screen */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setEditingActivity(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyword Description Generator Modal */}
      <SavedDescriptionGeneratorModal
        isOpen={isKeywordModalOpen}
        onClose={() => setIsKeywordModalOpen(false)}
        onSelect={handleApplySnippet}
      />

      {/* Lone Provider Clash Auditor Modal */}
      {auditSupplierState && (
        <LoneProviderAvailabilityChecker
          isModal={true}
          initialSupplierId={auditSupplierState.supplierId}
          initialDate={auditSupplierState.date}
          onClose={() => setAuditSupplierState(null)}
        />
      )}

      {/* Shift + Type Keyword Auto-Inserter Listener & HUD */}
      <ShiftKeywordListener
        trip={trip}
        activeDayId={currentDayId}
      />
    </div>
  );
};
