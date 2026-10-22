import React, { useState, useRef, useMemo } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  GripHorizontal,
  Sparkles,
  AlertTriangle,
  Building,
  Calendar,
  Search,
  Star,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ChevronDown,
  Info,
  Maximize2,
  Tag,
  BookOpen,
  Edit3,
  ArrowDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  ActivityCatalogItem,
  HotelInfo,
  ItineraryActivity,
  ItineraryDay,
  SavedDescriptionSnippet,
} from '../../types';
import { LoneProviderAvailabilityChecker } from '../suppliers/LoneProviderAvailabilityChecker';
import { LargeDayTableWorkspace } from './LargeDayTableWorkspace';
import { SavedDescriptionGeneratorModal } from './SavedDescriptionGeneratorModal';
import {
  InternalBookingMarker,
  normalizeBookingStatus,
  getBookingStatusDetails,
  getActivityCardColorClasses,
} from './InternalBookingMarker';

interface VisualTimelinePlannerProps {
  tripId: string;
  onOpenHotelModal: (hotel: HotelInfo) => void;
}

// 24 hourly slots: 00:00 through 23:00
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const formatHourLabel = (hour: number) => {
  const pad = hour < 10 ? `0${hour}` : `${hour}`;
  return `${pad}:00`;
};

const parseTimeToHourFraction = (timeStr?: string): number => {
  if (!timeStr || !timeStr.includes(':')) return 9;
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m || 0) / 60;
};

export const VisualTimelinePlanner: React.FC<VisualTimelinePlannerProps> = ({
  tripId,
  onOpenHotelModal,
}) => {
  const {
    itineraries,
    hotels,
    suppliers,
    supplierBookings,
    activityCatalog,
    addActivityCatalogItem,
    addActivityToDay,
    updateActivityInDay,
    deleteActivityFromDay,
    updateActivityBookingStatus,
    staff,
    moveActivity,
    conflicts,
    updateDayInItinerary,
    addHotel,
  } = useApp();

  const trip = itineraries.find((t) => t.id === tripId);

  // Drag and Drop between hours / days
  const [draggedActivityInfo, setDraggedActivityInfo] = useState<{
    activity: ItineraryActivity;
    sourceDayId: string;
  } | null>(null);

  const [hoveredDropTarget, setHoveredDropTarget] = useState<{
    dayId: string;
    hour: number;
  } | null>(null);

  // Hotel prompt & freely editable hotel state for each day
  const [editingHotelDays, setEditingHotelDays] = useState<Record<string, boolean>>({});
  const [hotelInputValues, setHotelInputValues] = useState<Record<string, string>>({});
  const [hotelFeedback, setHotelFeedback] = useState<Record<string, string>>({});

  const daysMissingHotel = useMemo(() => {
    if (!trip?.days) return [];
    return trip.days.filter((d) => {
      const hasName = Boolean(d.hotelName && d.hotelName.trim());
      const hasObj = Boolean(d.hotelId && hotels.some((h) => h.id === d.hotelId));
      return !hasName && !hasObj;
    });
  }, [trip, hotels]);

  // Quick Add Activity Modal
  const [quickAddDayId, setQuickAddDayId] = useState<string | null>(null);
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

  // Manual Edit Activity State
  const [editingActivityState, setEditingActivityState] = useState<{
    dayId: string;
    activity: ItineraryActivity;
  } | null>(null);

  // Large Table Workspace Modal State
  const [largeTableDayId, setLargeTableDayId] = useState<string | null>(null);

  // Keyword Description Generator Modal State
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  const [keywordTarget, setKeywordTarget] = useState<'quickAdd' | 'editing' | null>(null);

  // Lone Provider Auditor Modal Trigger
  const [auditSupplierState, setAuditSupplierState] = useState<{
    supplierId: string;
    date: string;
  } | null>(null);

  // View style: 'vertical' (hours stacked down with drag-down expand) or 'horizontal' (track)
  const [viewOrientation, setViewOrientation] = useState<'vertical' | 'horizontal'>('vertical');

  if (!trip) return null;

  // Check Lone Provider clash helper for any supplier and date
  const checkLoneProviderClash = (supplierId?: string, date?: string) => {
    if (!supplierId || !date) return null;
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier || !supplier.isLoneProvider) return null;

    // Check existing supplier bookings on this date for other trips
    const bookingClash = supplierBookings.find(
      (b) =>
        b.supplierId === supplierId &&
        b.date === date &&
        b.tripId !== trip.id &&
        b.status !== 'Cancelled'
    );
    if (bookingClash) {
      const otherTrip = itineraries.find((t) => t.id === bookingClash.tripId);
      return {
        clash: true,
        supplier,
        message: `CLASH: ${supplier.name} is already booked on ${date} for ${otherTrip?.code || 'another trip'} (${bookingClash.serviceDescription}). Lone providers cannot be double-booked.`,
      };
    }

    // Check other itineraries' activities on this date
    for (const otherTrip of itineraries) {
      if (otherTrip.id === trip.id) continue;
      for (const d of otherTrip.days) {
        if (d.date === date) {
          const matchingAct = d.activities.find((a) => a.supplierId === supplierId);
          if (matchingAct) {
            return {
              clash: true,
              supplier,
              message: `CLASH: ${supplier.name} is scheduled on ${date} in ${otherTrip.code} ("${matchingAct.title}").`,
            };
          }
        }
      }
    }

    return {
      clash: false,
      supplier,
      message: `FREE: ${supplier.name} has zero bookings on ${date} and is completely available without clash.`,
    };
  };

  // Drag start for moving activity
  const handleDragStart = (e: React.DragEvent, act: ItineraryActivity, dayId: string) => {
    setDraggedActivityInfo({ activity: act, sourceDayId: dayId });
    e.dataTransfer.setData('text/plain', JSON.stringify({ actId: act.id, dayId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Drag over target hour box
  const handleDragOver = (e: React.DragEvent, targetDayId: string, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!hoveredDropTarget || hoveredDropTarget.dayId !== targetDayId || hoveredDropTarget.hour !== hour) {
      setHoveredDropTarget({ dayId: targetDayId, hour });
    }
  };

  // Drop onto target hour box
  const handleDrop = (targetDayId: string, targetHour: number) => {
    if (!draggedActivityInfo) return;

    const { activity, sourceDayId } = draggedActivityInfo;
    const currentStart = parseTimeToHourFraction(activity.startTime);
    const currentEnd = parseTimeToHourFraction(activity.endTime);
    const duration = Math.max(1, Math.round(currentEnd - currentStart));

    const newStartH = targetHour;
    const newEndH = Math.min(24, targetHour + duration);

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const newStartStr = `${pad(newStartH)}:00`;
    const newEndStr = `${pad(newEndH)}:00`;

    moveActivity(
      trip.id,
      sourceDayId,
      targetDayId,
      activity.id,
      newStartStr,
      newEndStr
    );

    setDraggedActivityInfo(null);
    setHoveredDropTarget(null);
  };

  // Save or update hotel name freely for a day
  const handleSaveDayHotel = (dayId: string) => {
    if (!trip) return;
    const targetDay = trip.days.find((d) => d.id === dayId);
    if (!targetDay) return;

    const rawInput = hotelInputValues[dayId];
    const currentName =
      targetDay.hotelName || hotels.find((h) => h.id === targetDay.hotelId)?.name || '';
    const hotelName = (rawInput !== undefined ? rawInput : currentName).trim();

    if (!hotelName) {
      updateDayInItinerary(trip.id, {
        ...targetDay,
        hotelId: undefined,
        hotelName: undefined,
      });
      setHotelInputValues((prev) => ({ ...prev, [dayId]: '' }));
      setEditingHotelDays((prev) => ({ ...prev, [dayId]: false }));
      setHotelFeedback((prev) => ({ ...prev, [dayId]: 'Hotel removed' }));
      setTimeout(() => {
        setHotelFeedback((prev) => {
          const next = { ...prev };
          delete next[dayId];
          return next;
        });
      }, 2500);
      return;
    }

    // Match existing hotel case-insensitively or register a new hotel
    const existingMatch = hotels.find(
      (h) => h.name.toLowerCase() === hotelName.toLowerCase()
    );

    let assignedHotelId = existingMatch?.id;

    if (!existingMatch) {
      const newHotelId = `hotel-${Date.now()}`;
      const newHotel: HotelInfo = {
        id: newHotelId,
        name: hotelName,
        city: trip.destination.split(',')[0]?.trim() || 'Local Area',
        country: trip.destination.split(',')[1]?.trim() || 'Israel',
        address: `${hotelName}, ${trip.destination}`,
        starRating: 5,
        imageUrl:
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        galleryUrls: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        ],
        description: `Luxury accommodations at ${hotelName}.`,
        roomType: 'Deluxe Room',
        boardBasis: 'Bed & Breakfast',
        amenities: ['Free WiFi', 'Breakfast Included', 'Concierge Service', 'Air Conditioning'],
        checkInTime: '15:00',
        checkOutTime: '11:00',
        contactPhone: '+972 2-555-0100',
        pricePerNight: 450,
        currency: trip.currency || 'USD',
      };
      addHotel(newHotel);
      assignedHotelId = newHotelId;
    }

    updateDayInItinerary(trip.id, {
      ...targetDay,
      hotelId: assignedHotelId,
      hotelName: hotelName,
    });

    setEditingHotelDays((prev) => ({ ...prev, [dayId]: false }));
    setHotelFeedback((prev) => ({ ...prev, [dayId]: `Saved: ${hotelName}` }));
    setTimeout(() => {
      setHotelFeedback((prev) => {
        const next = { ...prev };
        delete next[dayId];
        return next;
      });
    }, 2500);
  };

  // Select existing hotel from catalog
  const handleSelectDayHotelFromCatalog = (dayId: string, selectedHotelId: string) => {
    if (!trip) return;
    const targetDay = trip.days.find((d) => d.id === dayId);
    if (!targetDay) return;

    if (!selectedHotelId) {
      updateDayInItinerary(trip.id, {
        ...targetDay,
        hotelId: undefined,
        hotelName: undefined,
      });
      setHotelInputValues((prev) => ({ ...prev, [dayId]: '' }));
      setEditingHotelDays((prev) => ({ ...prev, [dayId]: false }));
      return;
    }

    const hotel = hotels.find((h) => h.id === selectedHotelId);
    if (hotel) {
      updateDayInItinerary(trip.id, {
        ...targetDay,
        hotelId: hotel.id,
        hotelName: hotel.name,
      });
      setHotelInputValues((prev) => ({ ...prev, [dayId]: hotel.name }));
      setEditingHotelDays((prev) => ({ ...prev, [dayId]: false }));
      setHotelFeedback((prev) => ({ ...prev, [dayId]: `Assigned ${hotel.name}` }));
      setTimeout(() => {
        setHotelFeedback((prev) => {
          const next = { ...prev };
          delete next[dayId];
          return next;
        });
      }, 2500);
    }
  };

  const handleClearDayHotel = (dayId: string) => {
    if (!trip) return;
    const targetDay = trip.days.find((d) => d.id === dayId);
    if (!targetDay) return;
    updateDayInItinerary(trip.id, {
      ...targetDay,
      hotelId: undefined,
      hotelName: undefined,
    });
    setHotelInputValues((prev) => ({ ...prev, [dayId]: '' }));
    setEditingHotelDays((prev) => ({ ...prev, [dayId]: false }));
    setHotelFeedback((prev) => ({ ...prev, [dayId]: 'Hotel removed' }));
    setTimeout(() => {
      setHotelFeedback((prev) => {
        const next = { ...prev };
        delete next[dayId];
        return next;
      });
    }, 2500);
  };

  // Select from activity library dropdown in Visual Timeline
  const handleSelectLibraryItemInTimeline = (catalogItemId: string) => {
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

  // Quick add activity trigger
  const handleOpenQuickAdd = (
    dayId: string,
    hour: number,
    defaultMode: 'library' | 'custom' = 'library'
  ) => {
    setQuickAddDayId(dayId);
    setQuickAddStartHour(hour);
    setQuickAddDuration(2);
    setQuickAddSourceMode(defaultMode);
    setQuickAddSelectedLibraryId('');
    setQuickAddSaveToLibrary(true);
    setQuickAddLibraryKeyword('');
    setQuickAddTitle('');
    setQuickAddDescription('');
    setQuickAddCategory('Sightseeing');
    setQuickAddSupplierId('');
    setQuickAddBookingStatus('to be booked');
    setQuickAddStaffId('');
    setQuickAddDeadline('');
    setQuickAddBookingTimeframe('Within 48 hours');
    setQuickAddFollowUpDate('');

    // Pre-select first item from activity library if available and in library mode
    if (defaultMode === 'library' && activityCatalog.length > 0) {
      const first = activityCatalog[0];
      setQuickAddSelectedLibraryId(first.id);
      setQuickAddTitle(first.name);
      setQuickAddDescription(first.description);
      setQuickAddCategory(first.category || 'Sightseeing');
      setQuickAddDuration(Math.max(1, Math.round(first.durationHours)));
      if (first.supplierId) {
        setQuickAddSupplierId(first.supplierId);
      }
    }
  };

  const handleApplyKeywordSnippet = (snippet: SavedDescriptionSnippet) => {
    if (keywordTarget === 'quickAdd') {
      setQuickAddTitle(snippet.title);
      setQuickAddDescription(snippet.description);
      setQuickAddCategory(snippet.category || '');
      setQuickAddDuration(snippet.defaultDurationHours);
      if (snippet.recommendedSupplierId) {
        setQuickAddSupplierId(snippet.recommendedSupplierId);
      }
    } else if (keywordTarget === 'editing' && editingActivityState) {
      setEditingActivityState({
        ...editingActivityState,
        activity: {
          ...editingActivityState.activity,
          title: snippet.title,
          description: snippet.description,
          category: snippet.category,
          location: snippet.location,
          supplierId: snippet.recommendedSupplierId || editingActivityState.activity.supplierId,
        },
      });
    }
  };

  const handleSaveQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddDayId || !quickAddTitle.trim()) return;

    const startH = quickAddStartHour;
    const endH = Math.min(24, startH + quickAddDuration);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    const act: ItineraryActivity = {
      id: `act-${Date.now()}`,
      title: quickAddTitle.trim(),
      startTime: `${pad(startH)}:00`,
      endTime: `${pad(endH)}:00`,
      timeSlot: `${pad(startH)}:00 - ${pad(endH)}:00`,
      location: trip.destination,
      description: quickAddDescription.trim() || `Curated session in ${trip.destination}.`,
      category: quickAddCategory.trim() || undefined,
      supplierId: quickAddSupplierId || undefined,
      included: true,
      costEstimate: 200 * quickAddDuration,
      currency: trip.currency,
      bookingStatus: (quickAddBookingStatus as any) || 'to be booked',
      assignedBookingStaffId: quickAddStaffId || undefined,
      bookingDeadline: quickAddDeadline || undefined,
      bookingTimeframe: quickAddBookingTimeframe || undefined,
      followUpDate: quickAddFollowUpDate || undefined,
    };

    addActivityToDay(trip.id, quickAddDayId, act);

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
    }

    setQuickAddDayId(null);
    setQuickAddBookingStatus('to be booked');
    setQuickAddStaffId('');
    setQuickAddDeadline('');
    setQuickAddBookingTimeframe('Within 48 hours');
    setQuickAddFollowUpDate('');
  };

  // Quick duration adjust: extend or shrink hours
  const handleAdjustDuration = (dayId: string, act: ItineraryActivity, deltaHours: number) => {
    const start = parseTimeToHourFraction(act.startTime);
    const end = parseTimeToHourFraction(act.endTime);
    let newEnd = end + deltaHours;

    if (newEnd <= start + 0.5) return; // Minimum 30 mins
    if (newEnd > 24) newEnd = 24;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const wholeH = Math.floor(newEnd);
    const mins = Math.round((newEnd - wholeH) * 60);
    const newEndStr = `${pad(wholeH)}:${pad(mins)}`;

    updateActivityInDay(trip.id, dayId, {
      ...act,
      endTime: newEndStr,
      timeSlot: `${act.startTime} - ${newEndStr}`,
    });
  };

  // Interactive mouse drag-down resizing
  const handleStartVerticalResize = (
    e: React.MouseEvent,
    act: ItineraryActivity,
    dayId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const initialEnd = parseTimeToHourFraction(act.endTime);
    const startHour = parseTimeToHourFraction(act.startTime);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      // 52px height per hour slot
      const deltaHours = Math.round(deltaY / 52);
      const newEnd = Math.min(24, Math.max(startHour + 1, initialEnd + deltaHours));

      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const newEndStr = `${pad(newEnd)}:00`;

      updateActivityInDay(trip.id, dayId, {
        ...act,
        endTime: newEndStr,
        timeSlot: `${act.startTime} - ${newEndStr}`,
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const quickAddTargetDay = trip.days.find((d) => d.id === quickAddDayId);
  const quickAddClash = checkLoneProviderClash(quickAddSupplierId, quickAddTargetDay?.date);

  const editingTargetDay = trip.days.find((d) => d.id === editingActivityState?.dayId);
  const editClash = checkLoneProviderClash(
    editingActivityState?.activity.supplierId,
    editingTargetDay?.date
  );

  return (
    <div className="space-y-6">
      {/* Visual Planner Bar & Lone Provider Search Trigger */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-slate-950">
              Visual Hourly Itinerary Designer
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Click hour box to add &bull; Drag down to make multi-hour &bull; Drag day-to-day to reschedule
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 mt-1">
            Visual Day-by-Day Schedule Builder
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Lone Provider Clash Search Button */}
          <button
            onClick={() =>
              setAuditSupplierState({
                supplierId: suppliers.find((s) => s.isLoneProvider)?.id || '',
                date: trip.startDate,
              })
            }
            className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            title="Search existing bookings for lone providers to ensure zero clash before booking"
          >
            <Search className="w-3.5 h-3.5 text-amber-600" />
            <span>Search Lone Provider Availability (No Clash)</span>
          </button>

          {/* Keyword Description Generator Tool */}
          <button
            onClick={() => {
              setKeywordTarget('quickAdd');
              setIsKeywordModalOpen(true);
            }}
            className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            title="Search and insert saved luxury descriptions by keyword"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Keyword Description Generator</span>
          </button>

          {/* Orientation Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewOrientation('vertical')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewOrientation === 'vertical'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GripVertical className="w-3.5 h-3.5" />
              <span>Vertical Hourly Blocks (Drag Down)</span>
            </button>
            <button
              onClick={() => setViewOrientation('horizontal')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewOrientation === 'horizontal'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GripHorizontal className="w-3.5 h-3.5" />
              <span>Horizontal Track</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Helper Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Interactive Schedule Features:</strong> Click any hour box (e.g. 10:00) to add an activity. Grab the bottom handle and <strong>drag down</strong> to expand it across multiple hours. Drag the card between hours or from day to day to reschedule instantly.
          </span>
        </div>
      </div>

      {/* Hotel Prompt Alert Banner */}
      {daysMissingHotel.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/5 border-2 border-amber-400/90 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-black text-amber-950">Hotel Required on Every Day of Itinerary</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-300 text-amber-950 border border-amber-400 animate-pulse">
                  {daysMissingHotel.length} of {trip.days.length} Days Need Hotel
                </span>
              </div>
              <p className="text-xs text-amber-900/80 font-medium mt-0.5">
                Please enter the hotel for every day of the tour below. Each night card features a direct input prompt.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const firstMissing = daysMissingHotel[0];
                if (firstMissing) {
                  setEditingHotelDays((prev) => ({ ...prev, [firstMissing.id]: true }));
                  const el = document.getElementById(`timeline-day-card-${firstMissing.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }
              }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Jump to Night {daysMissingHotel[0]?.dayNumber}</span>
            </button>
          </div>
        </div>
      )}

      {/* Days Listed One Below Another */}
      <div className="space-y-6">
        {trip.days.map((day) => {
          const dayHotel = hotels.find((h) => h.id === day.hotelId);
          const currentHotelName = day.hotelName || dayHotel?.name || '';
          const isEditingHotel = Boolean(editingHotelDays[day.id]);
          const currentHotelInputValue =
            hotelInputValues[day.id] !== undefined ? hotelInputValues[day.id] : currentHotelName;
          const dayConflicts = conflicts.filter(
            (c) => (c.tripId1 === trip.id || c.tripId2 === trip.id) && c.date === day.date
          );

          return (
            <div
              key={day.id}
              id={`timeline-day-card-${day.id}`}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 transition-all"
            >
              {/* Day Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <span className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-xs">
                    {day.dayNumber}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{day.date}</span>
                      {dayConflicts.length > 0 && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          {dayConflicts.length} Conflict on this Day
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-900">{day.title}</h4>
                  </div>
                </div>

                {/* Hotel badge & fast add activity */}
                <div className="flex items-center space-x-2">
                  {currentHotelName ? (
                    <button
                      onClick={() => {
                        if (dayHotel) {
                          onOpenHotelModal(dayHotel);
                        } else {
                          setEditingHotelDays((prev) => ({ ...prev, [day.id]: true }));
                          setHotelInputValues((prev) => ({ ...prev, [day.id]: currentHotelName }));
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Hotel for this night - Click to view or change"
                    >
                      <Building className="w-3.5 h-3.5 text-amber-600" />
                      <span className="truncate max-w-[160px] font-bold">{currentHotelName}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingHotelDays((prev) => ({ ...prev, [day.id]: true }));
                        setHotelInputValues((prev) => ({ ...prev, [day.id]: '' }));
                      }}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-amber-800 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Prompt: Enter hotel name for this night"
                    >
                      <Building className="w-3.5 h-3.5 text-amber-600" />
                      <span>+ Enter Hotel Name</span>
                    </button>
                  )}
                  {/* OPEN DAY TO LARGE TABLE WORKSPACE BUTTON */}
                  <button
                    onClick={() => setLargeTableDayId(day.id)}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                    title="Open this day in expansive large table workspace with outward box stretching"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Large Table View</span>
                  </button>

                  {/* CHOOSE FROM SAVED ACTIVITIES BUTTON */}
                  <button
                    onClick={() => handleOpenQuickAdd(day.id, 9, 'library')}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-950 font-extrabold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors"
                    title="Choose from list of saved activities"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>From Saved Activities ({activityCatalog.length})</span>
                  </button>

                  <button
                    onClick={() => handleOpenQuickAdd(day.id, 9, 'custom')}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Add Activity</span>
                  </button>
                </div>
              </div>

              {/* VIEW 1: VERTICAL HOURLY TIMELINE (HOURS LISTED VERTICALLY AS BOXES, DRAG DOWN TO EXTEND) */}
              {viewOrientation === 'vertical' ? (
                <div className="space-y-1 pt-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-2 flex items-center justify-between">
                    <span>Hourly Schedule Timeline (00:00 &ndash; 24:00)</span>
                    <span className="text-slate-400 font-normal">Click an hour to add &bull; Grab bottom edge and drag down to make multi-hour</span>
                  </div>

                  <div className="space-y-1 relative">
                    {HOURS.map((hour) => {
                      // Activities starting exactly at this hour
                      const startingActs = day.activities.filter((act) => {
                        const start = parseTimeToHourFraction(act.startTime);
                        return Math.floor(start) === hour;
                      });

                      // Activities covering this hour but started earlier
                      const coveredByEarlierAct = day.activities.some((act) => {
                        const start = parseTimeToHourFraction(act.startTime);
                        const end = parseTimeToHourFraction(act.endTime);
                        return Math.floor(start) < hour && end > hour;
                      });

                      const isHovered =
                        hoveredDropTarget?.dayId === day.id && hoveredDropTarget?.hour === hour;

                      return (
                        <div key={hour} className="relative">
                          {/* Hour slot row */}
                          <div
                            onDragOver={(e) => handleDragOver(e, day.id, hour)}
                            onDrop={() => handleDrop(day.id, hour)}
                            onClick={() => {
                              if (startingActs.length === 0 && !coveredByEarlierAct) {
                                handleOpenQuickAdd(day.id, hour);
                              }
                            }}
                            className={`min-h-[52px] rounded-xl border flex items-center justify-between px-3.5 py-1.5 transition-all ${
                              isHovered
                                ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-400'
                                : coveredByEarlierAct
                                ? 'bg-slate-50/30 border-slate-100 opacity-60'
                                : startingActs.length > 0
                                ? 'bg-slate-50/50 border-slate-200'
                                : 'bg-slate-50/50 border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 cursor-pointer group'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-xs font-bold text-slate-400 w-12">
                                {formatHourLabel(hour)}
                              </span>

                              {startingActs.length === 0 && !coveredByEarlierAct && (
                                <span className="text-xs text-slate-400 group-hover:text-amber-700 flex items-center gap-1 font-medium">
                                  <Plus className="w-3 h-3 text-slate-300 group-hover:text-amber-600 transition-transform group-hover:scale-125" />
                                  <span>Click to schedule activity</span>
                                </span>
                              )}
                            </div>

                            {startingActs.length === 0 && !coveredByEarlierAct && (
                              <span className="text-[10px] text-slate-300 group-hover:text-amber-600 font-semibold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                + Add at {formatHourLabel(hour)}
                              </span>
                            )}
                          </div>

                          {/* Starting Activities Cards (Spanning vertically downwards) */}
                          {startingActs.map((act) => {
                            const startH = parseTimeToHourFraction(act.startTime);
                            const endH = parseTimeToHourFraction(act.endTime);
                            const durationH = Math.max(1, endH - startH);
                            const heightPx = durationH * 52 + (durationH - 1) * 4;

                            const supplier = suppliers.find((s) => s.id === act.supplierId);
                            const isLone = supplier?.isLoneProvider;

                            // Conflict check
                            const hasClash = dayConflicts.some(
                              (c) =>
                                c.type === 'SCHEDULE_OVERLAP' ||
                                (c.supplierId && c.supplierId === act.supplierId)
                            );

                            const norm = (act.bookingStatus || 'to be booked').toLowerCase();
                            const isConfirmed = norm === 'confirmed' || norm === 'booked';
                            const isRequested = norm === 'booking requested' || norm === 'requested';
                            const isToBeBooked = !isConfirmed && !isRequested;

                            const cardColorClass = isConfirmed
                              ? 'bg-emerald-50/95 border-emerald-400 ring-1 ring-emerald-400 text-emerald-950 shadow-sm'
                              : isRequested
                              ? 'bg-blue-50/95 border-blue-400 ring-1 ring-blue-400 text-blue-950 shadow-sm'
                              : 'bg-yellow-50/95 border-yellow-400 ring-1 ring-yellow-400 text-yellow-950 shadow-sm';

                            const assignedStaff = staff.find((s) => s.id === act.assignedBookingStaffId);

                            return (
                              <div
                                key={act.id}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, act, day.id)}
                                onClick={() => setEditingActivityState({ dayId: day.id, activity: act })}
                                style={{
                                  minHeight: `${heightPx}px`,
                                  top: 0,
                                }}
                                className={`absolute left-16 right-0 rounded-2xl p-3 shadow-md border cursor-pointer active:cursor-grabbing transition-all flex flex-col justify-between overflow-hidden select-none z-20 group ${
                                  hasClash
                                    ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
                                    : cardColorClass
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 bg-white/90 border border-slate-200">
                                        <Clock className="w-3 h-3 text-slate-600" />
                                        {act.startTime} &ndash; {act.endTime} ({Math.round(durationH * 10) / 10}h)
                                      </span>
                                      
                                      {/* Status Color Badge */}
                                      {isConfirmed && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                                          🟢 Confirmed
                                        </span>
                                      )}
                                      {isRequested && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-2xs">
                                          🔵 Booking Requested
                                        </span>
                                      )}
                                      {isToBeBooked && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-400 text-slate-950 shadow-2xs">
                                          🟡 To Be Booked
                                        </span>
                                      )}

                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/80 border border-slate-200 text-slate-700">
                                        {act.category}
                                      </span>
                                      {isLone && (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1">
                                          <Star className="w-2.5 h-2.5 fill-purple-700" />
                                          LONE PROVIDER
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => setEditingActivityState({ dayId: day.id, activity: act })}
                                        className="p-1 text-slate-500 hover:text-slate-900 bg-white/80 hover:bg-white rounded-md border border-slate-200 transition-colors shadow-2xs"
                                        title="Click to edit activity details and booking status"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => deleteActivityFromDay(trip.id, day.id, act.id)}
                                        className="p-1 text-slate-500 hover:text-rose-600 bg-white/80 hover:bg-white rounded-md border border-slate-200 transition-colors shadow-2xs"
                                        title="Delete activity"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="text-sm font-bold text-slate-950">
                                    {act.title}
                                  </div>
                                  <div className="text-xs text-slate-700 mt-0.5 line-clamp-1">
                                    {act.location} {supplier && <span>&bull; Supplier: <strong>{supplier.name}</strong></span>}
                                  </div>

                                  {/* Staff Assignment & Deadline / Follow-up preview */}
                                  {(assignedStaff || act.bookingDeadline || act.followUpDate) && (
                                    <div className="mt-1 text-[11px] font-medium flex items-center gap-2">
                                      {assignedStaff && (
                                        <span className="bg-white/80 border border-slate-200 px-1.5 py-0.5 rounded-md text-slate-800">
                                          Staff: <strong>{assignedStaff.name.split(' ')[0]}</strong>
                                        </span>
                                      )}
                                      {isToBeBooked && (act.bookingDeadline || act.bookingTimeframe) && (
                                        <span className="text-yellow-900 font-bold">
                                          Deadline: {act.bookingDeadline || act.bookingTimeframe}
                                        </span>
                                      )}
                                      {isRequested && act.followUpDate && (
                                        <span className="text-blue-900 font-bold">
                                          Follow-up: {act.followUpDate}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* DRAG DOWN TO EXTEND RESIZE BAR HANDLE */}
                                <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-semibold">
                                    <span>Drag card to reschedule &bull;</span>
                                    <span>{Math.round(durationH * 10) / 10} Hours</span>
                                  </div>

                                  {/* Multi-hour buttons & mouse drag handle */}
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAdjustDuration(day.id, act, -1);
                                      }}
                                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md"
                                      title="Shrink 1 hour"
                                    >
                                      -1h
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAdjustDuration(day.id, act, 1);
                                      }}
                                      className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-950 text-[10px] font-bold rounded-md"
                                      title="Extend +1 hour"
                                    >
                                      +1h
                                    </button>

                                    {/* Mouse Drag Down Handle */}
                                    <div
                                      onMouseDown={(e) => handleStartVerticalResize(e, act, day.id)}
                                      className="px-2.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-md cursor-ns-resize flex items-center gap-1 shadow-xs"
                                      title="Click and drag down with mouse to expand multi-hour duration"
                                    >
                                      <GripVertical className="w-3 h-3 text-amber-400" />
                                      <span>Drag Down to Extend</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* VIEW 2: HORIZONTAL TIME TRACK (Hours as Boxes in a Row) */
                <div className="space-y-2">
                  <div className="overflow-x-auto pb-2 scrollbar-thin">
                    <div className="min-w-[920px]">
                      {/* Hour Labels Header */}
                      <div className="grid grid-cols-14 gap-1 text-[11px] font-mono font-bold text-slate-400 text-center pb-1 border-b border-slate-100">
                        {HOURS.map((hour) => (
                          <div key={hour} className="py-1">
                            {formatHourLabel(hour)}
                          </div>
                        ))}
                      </div>

                      {/* Interactive Hour Slots Row (Clickable Drop Targets) */}
                      <div className="grid grid-cols-14 gap-1 pt-2 relative min-h-[110px]">
                        {HOURS.map((hour) => {
                          const isHovered =
                            hoveredDropTarget?.dayId === day.id && hoveredDropTarget?.hour === hour;

                          return (
                            <div
                              key={hour}
                              onDragOver={(e) => handleDragOver(e, day.id, hour)}
                              onDrop={() => handleDrop(day.id, hour)}
                              onClick={() => handleOpenQuickAdd(day.id, hour)}
                              className={`h-24 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-1 group relative ${
                                isHovered
                                  ? 'bg-amber-100 border-amber-500 scale-102 ring-2 ring-amber-400'
                                  : 'border-slate-200/80 bg-slate-50/50 hover:bg-amber-50/40 hover:border-amber-300'
                              }`}
                              title={`Click to add activity at ${formatHourLabel(hour)}`}
                            >
                              <span className="text-[10px] font-mono text-slate-400 group-hover:text-amber-700">
                                {formatHourLabel(hour)}
                              </span>
                              <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 mt-1 transition-transform group-hover:scale-125" />
                              <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                + Add
                              </span>
                            </div>
                          );
                        })}

                        {/* Positioned Multi-Hour Activity Cards Overlay */}
                        {day.activities.map((act) => {
                          const startH = parseTimeToHourFraction(act.startTime);
                          const endH = parseTimeToHourFraction(act.endTime);

                          const clampedStart = Math.max(0, Math.min(23.5, startH));
                          const clampedEnd = Math.max(clampedStart + 0.5, Math.min(24, endH));

                          const startOffsetHours = clampedStart;
                          const durationHours = clampedEnd - clampedStart;

                          const leftPct = (startOffsetHours / 24) * 100;
                          const widthPct = Math.max((durationHours / 24) * 100, 4);

                          const supplier = suppliers.find((s) => s.id === act.supplierId);
                          const isLone = supplier?.isLoneProvider;

                          const hasClash = dayConflicts.some(
                            (c) =>
                              c.type === 'SCHEDULE_OVERLAP' ||
                              (c.supplierId && c.supplierId === act.supplierId)
                          );

                          const normH = (act.bookingStatus || 'to be booked').toLowerCase();
                          const isConfirmedH = normH === 'confirmed' || normH === 'booked';
                          const isRequestedH = normH === 'booking requested' || normH === 'requested';
                          const isToBeBookedH = !isConfirmedH && !isRequestedH;

                          const cardColorClassH = isConfirmedH
                            ? 'bg-emerald-50/95 border-emerald-400 ring-1 ring-emerald-400 text-emerald-950 shadow-sm'
                            : isRequestedH
                            ? 'bg-blue-50/95 border-blue-400 ring-1 ring-blue-400 text-blue-950 shadow-sm'
                            : 'bg-yellow-50/95 border-yellow-400 ring-1 ring-yellow-400 text-yellow-950 shadow-sm';

                          return (
                            <div
                              key={act.id}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, act, day.id)}
                              onClick={() => setEditingActivityState({ dayId: day.id, activity: act })}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                top: '8px',
                              }}
                              className={`absolute h-[92px] rounded-2xl p-2.5 shadow-md border cursor-pointer active:cursor-grabbing transition-shadow flex flex-col justify-between overflow-hidden group select-none z-10 ${
                                hasClash
                                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
                                  : cardColorClassH
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <div className="flex items-center gap-1 truncate">
                                    <span className="text-[10px] font-mono font-bold flex items-center gap-0.5 bg-white/90 px-1 py-0.2 rounded-md">
                                      <Clock className="w-2.5 h-2.5" />
                                      {act.startTime}
                                    </span>
                                    {isConfirmedH && (
                                      <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-emerald-600 text-white">
                                        🟢 Confirmed
                                      </span>
                                    )}
                                    {isRequestedH && (
                                      <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-blue-600 text-white">
                                        🔵 Requested
                                      </span>
                                    )}
                                    {isToBeBookedH && (
                                      <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-yellow-400 text-slate-950">
                                        🟡 To Book
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    {isLone && (
                                      <span className="px-1 py-0.2 rounded-full text-[8px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300">
                                        ★ LONE
                                      </span>
                                    )}
                                    <button
                                      onClick={() => setEditingActivityState({ dayId: day.id, activity: act })}
                                      className="p-0.5 text-slate-500 hover:text-slate-900 bg-white/70 hover:bg-white rounded-sm"
                                      title="Click to edit activity details and booking status"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      onClick={() => deleteActivityFromDay(trip.id, day.id, act.id)}
                                      className="p-0.5 text-slate-500 hover:text-rose-600 bg-white/70 hover:bg-white rounded-sm"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="font-bold text-xs text-slate-950 line-clamp-1">
                                  {act.title}
                                </div>
                                <div className="text-[10px] text-slate-700 line-clamp-1">
                                  {act.location} {supplier && `&bull; ${supplier.name}`}
                                </div>
                              </div>

                              {/* Multi-hour Drag & Duration adjust controls */}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[9px] text-slate-400">
                                <span className="font-semibold text-slate-600">
                                  {Math.round(durationHours * 10) / 10}h duration
                                </span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAdjustDuration(day.id, act, -1);
                                    }}
                                    className="px-1 py-0.2 bg-slate-100 hover:bg-slate-200 rounded font-bold text-slate-700"
                                    title="Decrease 1 hour"
                                  >
                                    -1h
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAdjustDuration(day.id, act, 1);
                                    }}
                                    className="px-1 py-0.2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold"
                                    title="Extend duration +1 hour"
                                  >
                                    +1h
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BOTTOM OF THAT DAY: HOTEL PROMPT & FREELY EDITABLE ACCOMMODATION */}
              <div className="mt-4 pt-3 border-t border-slate-200">
                {!currentHotelName || isEditingHotel ? (
                  /* PROMPT STATE / FREE EDITING STATE */
                  <div className="bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-white border-2 border-amber-300/80 rounded-2xl p-4 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs shrink-0">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                              Night {day.dayNumber} Overnight Hotel &bull; {day.date}
                            </span>
                            {!currentHotelName ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900 border border-amber-300 animate-pulse">
                                ⚠️ Hotel Needed &bull; Please enter hotel name
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                ✏️ Changing Hotel
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            {!currentHotelName
                              ? `Please enter the name of the hotel for Night ${day.dayNumber}. You can change this freely at any time.`
                              : `Freely update or change the hotel name for Night ${day.dayNumber}:`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-start sm:self-center">
                        {hotelFeedback[day.id] && (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {hotelFeedback[day.id]}
                          </span>
                        )}
                        {currentHotelName && isEditingHotel && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditingHotelDays((prev) => ({ ...prev, [day.id]: false }))
                            }
                            className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 font-bold rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                      <div className="relative flex-1">
                        <Building className="w-4 h-4 text-amber-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={currentHotelInputValue}
                          onChange={(e) =>
                            setHotelInputValues((prev) => ({
                              ...prev,
                              [day.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveDayHotel(day.id);
                            }
                          }}
                          placeholder={`Enter hotel name (e.g. King David Hotel, The Norman, Waldorf Astoria, Inbal)...`}
                          className="w-full pl-10 pr-3 py-2.5 bg-white border-2 border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 shadow-2xs transition-all"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveDayHotel(day.id)}
                        disabled={!currentHotelInputValue.trim()}
                        className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>{currentHotelName ? 'Update Hotel' : 'Set Hotel'}</span>
                      </button>

                      <div className="relative shrink-0 md:w-60">
                        <select
                          value={day.hotelId || ''}
                          onChange={(e) =>
                            handleSelectDayHotelFromCatalog(day.id, e.target.value)
                          }
                          className="w-full px-3 py-2.5 bg-white border border-slate-300 hover:border-amber-400 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500/20 cursor-pointer shadow-2xs"
                        >
                          <option value="">-- Or choose from catalog ({hotels.length}) --</option>
                          {hotels.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name} ({h.city}) &bull; ${h.pricePerNight}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Quick Suggestion Chips */}
                    {hotels.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-600">Quick select:</span>
                        {hotels.slice(0, 6).map((h) => (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => handleSelectDayHotelFromCatalog(day.id, h.id)}
                            className="px-2 py-0.5 bg-white hover:bg-amber-100 hover:text-amber-900 text-slate-700 border border-slate-200 hover:border-amber-300 rounded-md font-medium transition-colors cursor-pointer"
                          >
                            + {h.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* ALLOCATED HOTEL CARD WITH FREELY CHANGE BUTTON */
                  <div className="bg-slate-50/80 hover:bg-amber-50/30 border border-slate-200 hover:border-amber-300/80 rounded-2xl p-3.5 transition-all shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0">
                          <Building className="w-4 h-4 text-amber-700" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Night {day.dayNumber} Overnight Hotel &bull; {day.date}
                            </span>
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              Hotel Allocated
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <h5 className="text-sm font-black text-slate-950">
                              {currentHotelName}
                            </h5>
                            {dayHotel && (
                              <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                                <span>&bull;</span>
                                <span>
                                  {dayHotel.city}, {dayHotel.country}
                                </span>
                                {dayHotel.starRating && (
                                  <span className="text-amber-500 font-bold">
                                    {'★'.repeat(dayHotel.starRating)}
                                  </span>
                                )}
                                <span>&bull;</span>
                                <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                                  {dayHotel.roomType}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {hotelFeedback[day.id] && (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {hotelFeedback[day.id]}
                          </span>
                        )}

                        {/* FREELY CHANGE HOTEL BUTTON */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingHotelDays((prev) => ({ ...prev, [day.id]: true }));
                            setHotelInputValues((prev) => ({
                              ...prev,
                              [day.id]: currentHotelName,
                            }));
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-amber-50 border border-slate-300 hover:border-amber-400 text-slate-800 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Freely change or rename the hotel for this day"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          <span>Change Hotel</span>
                        </button>

                        {dayHotel && (
                          <button
                            type="button"
                            onClick={() => onOpenHotelModal(dayHotel)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="View amenities, room gallery, contact phone, and details"
                          >
                            <Info className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Details</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleClearDayHotel(day.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Clear hotel for this night"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Add Activity Modal */}
      {quickAddDayId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded-xl">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Add Activity at {formatHourLabel(quickAddStartHour)}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Day {trip.days.find((d) => d.id === quickAddDayId)?.dayNumber || ''} &bull; {trip.days.find((d) => d.id === quickAddDayId)?.date || ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickAddDayId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveQuickAdd} className="flex-1 overflow-y-auto space-y-3.5 pt-3 pr-1">
              {/* SOURCE MODE SWITCHER: LIBRARY DROPDOWN VS CUSTOM ACTIVITY */}
              <div className="flex items-center p-1 bg-slate-100 rounded-2xl gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddSourceMode('library');
                    if (activityCatalog.length > 0 && !quickAddSelectedLibraryId) {
                      handleSelectLibraryItemInTimeline(activityCatalog[0].id);
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    quickAddSourceMode === 'library'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Choose from Saved Activities ({activityCatalog.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddSourceMode('custom');
                    setQuickAddSelectedLibraryId('');
                    setQuickAddTitle('');
                    setQuickAddDescription('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    quickAddSourceMode === 'custom'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Type New Custom Activity</span>
                </button>
              </div>

              {/* MODE 1: CHOOSE FROM SAVED ACTIVITIES DROPDOWN */}
              {quickAddSourceMode === 'library' && (
                <div className="p-3 bg-amber-50/70 rounded-2xl border-2 border-amber-300 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-amber-950 uppercase flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                      <span>Select Activity from Saved Library *</span>
                    </label>
                    <span className="text-[10px] text-amber-800 font-semibold">Autofills details &amp; duration</span>
                  </div>
                  <select
                    value={quickAddSelectedLibraryId}
                    onChange={(e) => handleSelectLibraryItemInTimeline(e.target.value)}
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
                    <div className="text-[11px] text-amber-950 bg-white/90 p-2.5 rounded-xl border border-amber-200 space-y-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>Selected: {quickAddTitle}</span>
                        <span className="font-mono text-[10px] bg-amber-200 px-1.5 py-0.5 rounded font-black text-amber-950">
                          {quickAddDuration} Hours
                        </span>
                      </div>
                      {quickAddDescription && (
                        <p className="line-clamp-2 text-slate-600">{quickAddDescription}</p>
                      )}
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
                      placeholder="e.g. Private Helicopter Flight over Dead Sea..."
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
                          Saves this custom activity into your Master Activity Catalog so it can be reused across all days and future itineraries!
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Activity Title (Customizable)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setKeywordTarget('quickAdd');
                        setIsKeywordModalOpen(true);
                      }}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Generate from Keyword</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Description</label>
                <textarea
                  rows={2}
                  placeholder="Rich client-facing overview or generated snippet..."
                  value={quickAddDescription}
                  onChange={(e) => setQuickAddDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg leading-relaxed"
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
                    <option value={3}>3 Hours (Half Day)</option>
                    <option value={4}>4 Hours</option>
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
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
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

              {/* Lone Provider Clash Warning & Direct Search Trigger */}
              {quickAddClash && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-2 ${
                    quickAddClash.clash
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {quickAddClash.clash ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{quickAddClash.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setAuditSupplierState({
                        supplierId: quickAddSupplierId,
                        date: quickAddTargetDay?.date || trip.startDate,
                      })
                    }
                    className="text-[11px] underline font-bold text-slate-800 hover:text-black flex items-center gap-1"
                  >
                    <Search className="w-3 h-3" />
                    <span>Search all existing bookings for {quickAddClash.supplier.name}</span>
                  </button>
                </div>
              )}

              {/* AUTOMATIC BOOKING STATUS & WORKER ASSIGNMENT PROMPT */}
              <div className="p-3 bg-amber-50/60 rounded-2xl border-2 border-amber-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Activity Booking Status (Required)</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">Color-coded on timeline</span>
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

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickAddDayId(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Place Activity on Grid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Edit Activity Modal */}
      {editingActivityState && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Edit Activity &amp; Timings
              </h3>
              <button
                onClick={() => setEditingActivityState(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-lg"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateActivityInDay(trip.id, editingActivityState.dayId, {
                  ...editingActivityState.activity,
                  timeSlot: `${editingActivityState.activity.startTime} - ${editingActivityState.activity.endTime}`,
                });
                setEditingActivityState(null);
              }}
              className="space-y-3"
            >
              {/* Load from Saved Activity Library */}
              <div className="p-3 bg-amber-50/80 rounded-2xl border-2 border-amber-300 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-950 uppercase flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                    <span>Load / Replace from Activity Library ({activityCatalog.length})</span>
                  </label>
                  <span className="text-[10px] text-amber-800 font-semibold">Autofills details &amp; duration</span>
                </div>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const selected = activityCatalog.find((a) => a.id === e.target.value);
                    if (selected && editingActivityState) {
                      const currentStartH = parseTimeToHourFraction(editingActivityState.activity.startTime);
                      const newEndH = Math.min(24, currentStartH + selected.durationHours);
                      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
                      setEditingActivityState({
                        ...editingActivityState,
                        activity: {
                          ...editingActivityState.activity,
                          title: selected.name,
                          description: selected.description,
                          category: selected.category || editingActivityState.activity.category,
                          supplierId: selected.supplierId || editingActivityState.activity.supplierId,
                          endTime: `${pad(Math.floor(newEndH))}:00`,
                        },
                      });
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-amber-300 rounded-xl text-slate-900 outline-none shadow-2xs"
                >
                  <option value="">-- Choose to replace with saved activity --</option>
                  {activityCatalog.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.durationHours}h{item.category ? ` • ${item.category}` : ''}{item.keyword ? ` • Shift+"${item.keyword}"` : ''})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Title</label>
                <input
                  type="text"
                  required
                  value={editingActivityState.activity.title}
                  onChange={(e) =>
                    setEditingActivityState({
                      ...editingActivityState,
                      activity: { ...editingActivityState.activity, title: e.target.value },
                    })
                  }
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Description</label>
                <textarea
                  rows={2}
                  value={editingActivityState.activity.description || ''}
                  onChange={(e) =>
                    setEditingActivityState({
                      ...editingActivityState,
                      activity: { ...editingActivityState.activity, description: e.target.value },
                    })
                  }
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Start Time</label>
                  <input
                    type="time"
                    required
                    value={editingActivityState.activity.startTime}
                    onChange={(e) =>
                      setEditingActivityState({
                        ...editingActivityState,
                        activity: { ...editingActivityState.activity, startTime: e.target.value },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">End Time</label>
                  <input
                    type="time"
                    required
                    value={editingActivityState.activity.endTime}
                    onChange={(e) =>
                      setEditingActivityState({
                        ...editingActivityState,
                        activity: { ...editingActivityState.activity, endTime: e.target.value },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Category / Type (Optional)</label>
                  <select
                    value={editingActivityState.activity.category || ''}
                    onChange={(e) =>
                      setEditingActivityState({
                        ...editingActivityState,
                        activity: { ...editingActivityState.activity, category: e.target.value || undefined },
                      })
                    }
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
                    value={editingActivityState.activity.supplierId || ''}
                    onChange={(e) =>
                      setEditingActivityState({
                        ...editingActivityState,
                        activity: { ...editingActivityState.activity, supplierId: e.target.value || undefined },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
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

              {/* Lone Provider Clash Warning & Schedule Audit in Edit Modal */}
              {editClash && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-2 ${
                    editClash.clash
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {editClash.clash ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{editClash.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setAuditSupplierState({
                        supplierId: editingActivityState.activity.supplierId || '',
                        date: editingTargetDay?.date || trip.startDate,
                      })
                    }
                    className="text-[11px] underline font-bold text-slate-800 hover:text-black flex items-center gap-1"
                  >
                    <Search className="w-3 h-3" />
                    <span>Search all existing bookings for {editClash.supplier.name}</span>
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Location</label>
                <input
                  type="text"
                  value={editingActivityState.activity.location}
                  onChange={(e) =>
                    setEditingActivityState({
                      ...editingActivityState,
                      activity: { ...editingActivityState.activity, location: e.target.value },
                    })
                  }
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              {/* BOOKING STATUS, TIMEFRAME, AND STAFF ASSIGNMENT */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Internal Working Booking Marker
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">Color-coded across itinerary</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingActivityState({
                        ...editingActivityState,
                        activity: { ...editingActivityState.activity, bookingStatus: 'to be booked' },
                      })
                    }
                    className={`p-2 rounded-xl border text-left text-xs font-extrabold transition-all ${
                      editingActivityState.activity.bookingStatus === 'to be booked'
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
                      setEditingActivityState({
                        ...editingActivityState,
                        activity: { ...editingActivityState.activity, bookingStatus: 'booking requested' },
                      })
                    }
                    className={`p-2 rounded-xl border text-left text-xs font-extrabold transition-all ${
                      editingActivityState.activity.bookingStatus === 'booking requested'
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
                      setEditingActivityState({
                        ...editingActivityState,
                        activity: { ...editingActivityState.activity, bookingStatus: 'confirmed' },
                      })
                    }
                    className={`p-2 rounded-xl border text-left text-xs font-extrabold transition-all ${
                      editingActivityState.activity.bookingStatus === 'confirmed'
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
                      value={editingActivityState.activity.assignedBookingStaffId || ''}
                      onChange={(e) =>
                        setEditingActivityState({
                          ...editingActivityState,
                          activity: {
                            ...editingActivityState.activity,
                            assignedBookingStaffId: e.target.value || undefined,
                          },
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
                    {editingActivityState.activity.bookingStatus === 'to be booked' && (
                      <div>
                        <label className="text-[10px] font-bold text-yellow-900 uppercase block mb-1">
                          Timeframe / Deadline to Book
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={editingActivityState.activity.bookingDeadline || ''}
                            onChange={(e) =>
                              setEditingActivityState({
                                ...editingActivityState,
                                activity: {
                                  ...editingActivityState.activity,
                                  bookingDeadline: e.target.value || undefined,
                                },
                              })
                            }
                            className="w-1/2 px-2 py-1.5 text-xs bg-white border border-yellow-300 rounded-lg outline-none"
                          />
                          <select
                            value={editingActivityState.activity.bookingTimeframe || 'Within 48 hours'}
                            onChange={(e) =>
                              setEditingActivityState({
                                ...editingActivityState,
                                activity: {
                                  ...editingActivityState.activity,
                                  bookingTimeframe: e.target.value,
                                },
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

                    {editingActivityState.activity.bookingStatus === 'booking requested' && (
                      <div>
                        <label className="text-[10px] font-bold text-blue-900 uppercase block mb-1">
                          Follow-up Date *
                        </label>
                        <input
                          type="date"
                          value={editingActivityState.activity.followUpDate || ''}
                          onChange={(e) =>
                            setEditingActivityState({
                              ...editingActivityState,
                              activity: {
                                ...editingActivityState.activity,
                                followUpDate: e.target.value || undefined,
                              },
                            })
                          }
                          className="w-full px-2 py-1.5 text-xs font-bold text-blue-950 bg-white border border-blue-400 rounded-lg outline-none"
                        />
                      </div>
                    )}

                    {editingActivityState.activity.bookingStatus === 'confirmed' && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-2 rounded-lg border border-emerald-200">
                        ✓ Confirmed &amp; booked. Any prior tasks removed.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingActivityState(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lone Provider Availability Search Modal */}
      {auditSupplierState && (
        <LoneProviderAvailabilityChecker
          isModal={true}
          initialSupplierId={auditSupplierState.supplierId}
          initialDate={auditSupplierState.date}
          onClose={() => setAuditSupplierState(null)}
          onQuickBook={(supplierId) => {
            if (editingActivityState) {
              setEditingActivityState({
                ...editingActivityState,
                activity: { ...editingActivityState.activity, supplierId },
              });
            } else if (quickAddDayId) {
              setQuickAddSupplierId(supplierId);
            }
            setAuditSupplierState(null);
          }}
        />
      )}
    </div>
  );
};
