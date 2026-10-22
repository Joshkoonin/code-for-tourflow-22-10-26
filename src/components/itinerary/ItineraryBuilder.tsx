import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Building,
  Building2,
  Sparkles,
  Save,
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  Star,
  Users,
  DollarSign,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  CheckCircle2,
  Command,
  Table,
  LayoutGrid,
  Tag,
  BookOpen,
  Edit3,
  Share2,
  FileText,
  Compass,
  ArrowDown,
  Briefcase,
  Camera,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HotelDetailModal } from './HotelDetailModal';
import { GenerateClientLinkModal } from './GenerateClientLinkModal';
import { VisualTimelinePlanner } from './VisualTimelinePlanner';

import { InternalBookingMarker, getBookingStatusDetails } from './InternalBookingMarker';
import { CtrlActivityAutoInserterModal } from './CtrlActivityAutoInserterModal';
import { ShiftKeywordListener } from './ShiftKeywordListener';
import { ItineraryLogoModal } from './ItineraryLogoModal';
import { ItineraryHeroPhotoModal } from './ItineraryHeroPhotoModal';
import { GeneralProjectedCostsSection } from './GeneralProjectedCostsSection';
import { Image as ImageIcon } from 'lucide-react';
import {
  ActivityCatalogItem,
  HotelInfo,
  Itinerary,
  ItineraryActivity,
  ItineraryDay,
} from '../../types';

interface ItineraryBuilderProps {
  tripId: string;
  onBack: () => void;
}

export const ItineraryBuilder: React.FC<ItineraryBuilderProps> = ({ tripId, onBack }) => {
  const {
    itineraries,
    updateItinerary,
    addDayToItinerary,
    updateDayInItinerary,
    deleteDayFromItinerary,
    addActivityToDay,
    updateActivityInDay,
    deleteActivityFromDay,
    updateActivityBookingStatus,
    staff,
    hotels,
    addHotel,
    suppliers,
    clients,
    openClientPortal,
    conflicts,
    activityCatalog,
    addActivityCatalogItem,
    hasFullFinancialView,
    passports,
    setActiveView,
  } = useApp();

  const trip = itineraries.find((t) => t.id === tripId);
  const [selectedHotelForModal, setSelectedHotelForModal] = useState<HotelInfo | null>(null);
  const [plannerMode, setPlannerMode] = useState<'visual_timeline' | 'classic_list'>('visual_timeline');
  const [selectedLargeTableDayId, setSelectedLargeTableDayId] = useState<string>(trip?.days[0]?.id || '');

  // New activity state & catalog linking
  const [activeDayIdForNewActivity, setActiveDayIdForNewActivity] = useState<string | null>(null);
  const [newActivitySourceMode, setNewActivitySourceMode] = useState<'library' | 'custom'>('library');
  const [newActivitySelectedLibraryId, setNewActivitySelectedLibraryId] = useState<string>('');
  const [saveCustomToLibrary, setSaveCustomToLibrary] = useState<boolean>(true);
  const [customLibraryKeyword, setCustomLibraryKeyword] = useState<string>('');
  const [newActivityData, setNewActivityData] = useState<Partial<ItineraryActivity>>({
    title: '',
    startTime: '09:00',
    endTime: '11:00',
    location: '',
    description: '',
    category: '',
    included: true,
    costEstimate: undefined,
    currency: 'USD',
    bookingStatus: 'to be booked',
    assignedBookingStaffId: '',
    bookingDeadline: '',
  });

  const handleSelectLibraryItemInBuilder = (catalogItemId: string) => {
    setNewActivitySelectedLibraryId(catalogItemId);
    if (!catalogItemId) {
      setNewActivityData((prev) => ({
        ...prev,
        title: '',
        description: '',
        supplierId: '',
        category: '',
        costEstimate: 0,
      }));
      return;
    }
    const item = activityCatalog.find((a) => a.id === catalogItemId);
    if (item) {
      const startH = parseInt((newActivityData.startTime || '09:00').split(':')[0], 10);
      const durationHours = Math.max(1, Math.round(item.durationHours));
      const endH = Math.min(23, startH + durationHours);
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const endStr = `${pad(endH)}:00`;

      setNewActivityData((prev) => ({
        ...prev,
        title: item.name,
        description: item.description,
        category: item.category || '',
        location: item.location || trip?.destination || '',
        supplierId: item.supplierId || '',
        costEstimate: item.costEstimate ?? 0,
        endTime: endStr,
      }));
    }
  };

  // Edit existing activity state
  const [editingActivity, setEditingActivity] = useState<{ dayId: string; activity: ItineraryActivity } | null>(null);

  // Quick 1-click Cost to Me changer state
  const [quickCostModalActivity, setQuickCostModalActivity] = useState<{
    dayId: string;
    activity: ItineraryActivity;
    cost: number;
  } | null>(null);

  // Edit Day state
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingDayTitle, setEditingDayTitle] = useState('');
  const [editingDaySummary, setEditingDaySummary] = useState('');

  // Add Hotel modal state
  const [isAddHotelModalOpen, setIsAddHotelModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newHotel, setNewHotel] = useState<Partial<HotelInfo>>({
    name: '',
    city: trip?.destination.split(',')[0] || 'Jerusalem',
    country: 'Israel',
    address: '',
    starRating: 5,
    boardBasis: 'Bed & Breakfast',
    currency: trip?.currency || 'USD',
    amenities: ['Free Wi-Fi', 'Luxury Spa', 'Concierge Butler', 'Swimming Pool', 'Fine Dining'],
    description: '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    galleryUrls: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'],
    contactPhone: '+972 3 555 1234',
  });

  // Edit trip basic info state
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerTitle, setHeaderTitle] = useState(trip?.title || '');
  const [headerDestination, setHeaderDestination] = useState(trip?.destination || '');
  const [headerPrice, setHeaderPrice] = useState(trip?.totalClientPrice || 0);
  const [headerPartySize, setHeaderPartySize] = useState(trip?.partySize || 1);
  const [headerStartDate, setHeaderStartDate] = useState(trip?.startDate || '');
  const [headerEndDate, setHeaderEndDate] = useState(trip?.endDate || '');
  const [headerStatus, setHeaderStatus] = useState(trip?.status || 'Draft');
  const [headerGuide, setHeaderGuide] = useState(trip?.guideName || '');
  const [headerDriver, setHeaderDriver] = useState(trip?.driverName || '');
  const [headerHotelId, setHeaderHotelId] = useState<string>(() => {
    return trip?.days.find((d) => d.hotelId)?.hotelId || '';
  });
  const [isItineraryLogoModalOpen, setIsItineraryLogoModalOpen] = useState(false);
  const [isHeroPhotoModalOpen, setIsHeroPhotoModalOpen] = useState(false);

  // Change Hotel at which client is staying modal state
  const [isChangeHotelModalOpen, setIsChangeHotelModalOpen] = useState(false);
  const [targetHotelId, setTargetHotelId] = useState<string>('');
  const [targetHotelCustomName, setTargetHotelCustomName] = useState<string>('');
  const [selectedDayIdsForHotel, setSelectedDayIdsForHotel] = useState<string[]>([]);
  const [applyToAllNights, setApplyToAllNights] = useState<boolean>(true);
  const [hotelChangeSuccessMsg, setHotelChangeSuccessMsg] = useState<string | null>(null);

  // Daily hotel entry prompt and inputs
  const [dayHotelInputs, setDayHotelInputs] = useState<Record<string, string>>({});
  const [editingHotelDays, setEditingHotelDays] = useState<Record<string, boolean>>({});
  const [hotelFeedback, setHotelFeedback] = useState<Record<string, string>>({});

  const daysMissingHotel = useMemo(() => {
    if (!trip?.days) return [];
    return trip.days.filter((d) => {
      const hasName = Boolean(d.hotelName && d.hotelName.trim());
      const hasObj = Boolean(d.hotelId && hotels.some((h) => h.id === d.hotelId));
      return !hasName && !hasObj;
    });
  }, [trip, hotels]);

  const hotelNames = useMemo(() => {
    if (!trip?.days) return [];
    const list = Array.from(new Set(trip.days.map((d) => d.hotelName).filter(Boolean))) as string[];
    return list;
  }, [trip]);

  const handleOpenChangeHotelModal = () => {
    const firstAssignedId = trip?.days.find((d) => d.hotelId)?.hotelId || '';
    const firstAssignedName = trip?.days.find((d) => d.hotelName)?.hotelName || '';
    setTargetHotelId(firstAssignedId);
    setTargetHotelCustomName(firstAssignedName);
    setSelectedDayIdsForHotel(trip?.days.map((d) => d.id) || []);
    setApplyToAllNights(true);
    setIsChangeHotelModalOpen(true);
  };

  const handleApplyHotelChange = () => {
    if (!trip) return;
    const customName = targetHotelCustomName.trim();
    const selectedHotelObj = hotels.find((h) => h.id === targetHotelId);

    let assignedId = targetHotelId;
    let assignedName = selectedHotelObj ? selectedHotelObj.name : customName;

    if (customName && !selectedHotelObj) {
      const match = hotels.find((h) => h.name.toLowerCase() === customName.toLowerCase());
      if (match) {
        assignedId = match.id;
        assignedName = match.name;
      } else {
        const newHotelId = `hotel-${Date.now()}`;
        const newHotel: HotelInfo = {
          id: newHotelId,
          name: customName,
          city: trip.destination.split(',')[0]?.trim() || 'Local Area',
          country: trip.destination.split(',')[1]?.trim() || 'Israel',
          address: `${customName}, ${trip.destination}`,
          starRating: 5,
          imageUrl:
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
          galleryUrls: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
          ],
          description: `Accommodations at ${customName}.`,
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
        assignedId = newHotelId;
        assignedName = customName;
      }
    }

    const targetDays = applyToAllNights
      ? trip.days
      : trip.days.filter((d) => selectedDayIdsForHotel.includes(d.id));

    targetDays.forEach((day) => {
      updateDayInItinerary(trip.id, {
        ...day,
        hotelId: assignedId || undefined,
        hotelName: assignedName || undefined,
      });
      if (assignedName) {
        setDayHotelInputs((prev) => ({ ...prev, [day.id]: assignedName }));
      }
    });

    const hotelLabel = assignedName || 'No Hotel (Cleared)';
    setHotelChangeSuccessMsg(`Successfully updated hotel to "${hotelLabel}" for ${targetDays.length} tour nights!`);
    setTimeout(() => setHotelChangeSuccessMsg(null), 3500);
    setIsChangeHotelModalOpen(false);
  };

  // Ctrl + Activity Name Auto-Inserter Modal State
  const [isCtrlInserterOpen, setIsCtrlInserterOpen] = useState(false);
  const [ctrlInserterQuery, setCtrlInserterQuery] = useState('');
  const [ctrlInserterDayId, setCtrlInserterDayId] = useState<string | undefined>(undefined);

  // Global Keyboard Listener for holding Ctrl and typing activity name
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is in an existing input or textarea unless Ctrl is held with space/k
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        // Reserved standard browser combos we should avoid overriding: Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Ctrl+A, Ctrl+R
        const keyLower = e.key.toLowerCase();
        const reservedKeys = ['c', 'v', 'x', 'z', 'a', 'r', 'w', 't', 'p', 's', 'f', 'o', 'n'];

        if (e.key === ' ' || e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setCtrlInserterQuery('');
          setIsCtrlInserterOpen(true);
        } else if (e.key.length === 1 && !reservedKeys.includes(keyLower) && !isInput) {
          e.preventDefault();
          setCtrlInserterQuery(e.key);
          setIsCtrlInserterOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!trip) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Trip not found.</p>
        <button onClick={onBack} className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs">
          Back
        </button>
      </div>
    );
  }

  // Check if this trip is involved in any detected conflicts
  const tripConflicts = conflicts.filter(
    (c) => c.tripId1 === trip.id || c.tripId2 === trip.id
  );

  const handleSaveHeader = () => {
    updateItinerary({
      ...trip,
      title: headerTitle,
      tourName: headerTitle,
      destination: headerDestination,
      totalClientPrice: Number(headerPrice),
      status: headerStatus,
      guideName: headerGuide.trim() || undefined,
      driverName: headerDriver.trim() || undefined,
      partySize: headerPartySize,
      startDate: headerStartDate,
      endDate: headerEndDate,
    });

    if (headerHotelId !== undefined) {
      const selHotelObj = hotels.find((h) => h.id === headerHotelId);
      trip.days.forEach((day) => {
        updateDayInItinerary(trip.id, {
          ...day,
          hotelId: headerHotelId || undefined,
          hotelName: selHotelObj ? selHotelObj.name : undefined,
        });
      });
    }

    setIsEditingHeader(false);
  };

  const handleAddDay = () => {
    const nextDayNum = trip.days.length + 1;
    const lastDay = trip.days[trip.days.length - 1];
    let nextDate = trip.startDate;
    if (lastDay) {
      const d = new Date(lastDay.date);
      d.setDate(d.getDate() + 1);
      nextDate = d.toISOString().split('T')[0];
    }

    const newDay: ItineraryDay = {
      id: `day-${Date.now()}`,
      dayNumber: nextDayNum,
      date: nextDate,
      title: `Day ${nextDayNum}: Exploration & Discovery`,
      summary: 'Curated experiences and private leisure.',
      hotelId: undefined,
      hotelName: undefined,
      activities: [],
    };
    addDayToItinerary(trip.id, newDay);
  };

  const handleSaveDayEdit = (dayId: string) => {
    const day = trip.days.find((d) => d.id === dayId);
    if (!day) return;
    updateDayInItinerary(trip.id, {
      ...day,
      title: editingDayTitle || day.title,
      summary: editingDaySummary || day.summary,
    });
    setEditingDayId(null);
  };

  const handleSaveHotelForDay = (dayId: string) => {
    if (!trip) return;
    const targetDay = trip.days.find((d) => d.id === dayId);
    if (!targetDay) return;

    const rawInput = dayHotelInputs[dayId];
    const currentName = targetDay.hotelName || hotels.find((h) => h.id === targetDay.hotelId)?.name || '';
    const hotelName = (rawInput !== undefined ? rawInput : currentName).trim();

    if (!hotelName) {
      updateDayInItinerary(trip.id, {
        ...targetDay,
        hotelId: undefined,
        hotelName: undefined,
      });
      setDayHotelInputs((prev) => ({ ...prev, [dayId]: '' }));
      setEditingHotelDays((prev) => ({ ...prev, [dayId]: false }));
      return;
    }

    const existingMatch = hotels.find(
      (h) => h.name.toLowerCase() === hotelName.toLowerCase()
    );

    let assignedHotelId = existingMatch?.id;

    updateDayInItinerary(trip.id, {
      ...targetDay,
      hotelId: assignedHotelId,
      hotelName: hotelName,
    });

    setEditingHotelDays((prev) => ({ ...prev, [dayId]: false }));
    setDayHotelInputs((prev) => ({ ...prev, [dayId]: hotelName }));
    setHotelFeedback((prev) => ({ ...prev, [dayId]: `Saved: ${hotelName}` }));
    setTimeout(() => {
      setHotelFeedback((prev) => {
        const next = { ...prev };
        delete next[dayId];
        return next;
      });
    }, 2500);
  };

  const handleSelectHotelForDay = (dayId: string, selectedHotelId: string) => {
    if (!trip) return;
    const targetDay = trip.days.find((d) => d.id === dayId);
    if (!targetDay) return;

    if (!selectedHotelId) {
      updateDayInItinerary(trip.id, {
        ...targetDay,
        hotelId: undefined,
        hotelName: undefined,
      });
      setDayHotelInputs((prev) => ({ ...prev, [dayId]: '' }));
      setEditingHotelDays((prev) => ({ ...prev, [dayId]: false }));
      return;
    }

    const hotel = hotels.find((h) => h.id === selectedHotelId);
    updateDayInItinerary(trip.id, {
      ...targetDay,
      hotelId: selectedHotelId,
      hotelName: hotel ? hotel.name : undefined,
    });
    setEditingHotelDays((prev) => ({ ...prev, [dayId]: false }));
    if (hotel) {
      setDayHotelInputs((prev) => ({ ...prev, [dayId]: hotel.name }));
    }
  };

  const handleHotelChange = (day: ItineraryDay, newHotelId: string) => {
    const selHotel = hotels.find((h) => h.id === newHotelId);
    updateDayInItinerary(trip.id, {
      ...day,
      hotelId: newHotelId || undefined,
      hotelName: selHotel ? selHotel.name : undefined,
    });
  };

  const handleCreateActivity = (dayId: string) => {
    if (!newActivityData.title) return;
    const act: ItineraryActivity = {
      id: `act-${Date.now()}`,
      title: newActivityData.title || 'Curated Activity',
      startTime: newActivityData.startTime || '09:00',
      endTime: newActivityData.endTime || '11:00',
      timeSlot: `${newActivityData.startTime || '09:00'} - ${newActivityData.endTime || '11:00'}`,
      description: newActivityData.description || '',
      location: newActivityData.location || trip.destination,
      supplierId: newActivityData.supplierId || undefined,
      category: newActivityData.category?.trim() || undefined,
      included: newActivityData.included ?? true,
      costEstimate: newActivityData.costEstimate !== undefined && newActivityData.costEstimate !== null ? Number(newActivityData.costEstimate) : undefined,
      currency: trip.currency,
      bookingStatus: newActivityData.bookingStatus || 'to be booked',
      assignedBookingStaffId: newActivityData.assignedBookingStaffId || undefined,
      bookingDeadline: newActivityData.bookingDeadline || undefined,
      bookingTimeframe: newActivityData.bookingTimeframe || undefined,
      followUpDate: newActivityData.followUpDate || undefined,
    };
    addActivityToDay(trip.id, dayId, act);

    // If custom activity and user opted to automatically have that added to the activities library:
    if (newActivitySourceMode === 'custom' && saveCustomToLibrary) {
      const cleanKeyword = customLibraryKeyword.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const startH = parseInt(act.startTime.split(':')[0] || '9', 10);
      const endH = parseInt(act.endTime.split(':')[0] || '11', 10);
      const durationHours = Math.max(1, endH - startH);

      const newCatalogItem: ActivityCatalogItem = {
        id: `act-${Date.now()}`,
        name: act.title,
        description: act.description,
        durationHours: durationHours,
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

    setActiveDayIdForNewActivity(null);
    setNewActivitySelectedLibraryId('');
    setNewActivitySourceMode('library');
    setCustomLibraryKeyword('');
    setNewActivityData({
      title: '',
      startTime: '09:00',
      endTime: '11:00',
      location: '',
      description: '',
      category: '',
      included: true,
      costEstimate: 0,
      currency: trip.currency,
      bookingStatus: 'to be booked',
      assignedBookingStaffId: '',
      bookingDeadline: '',
      bookingTimeframe: 'Within 48 hours',
      followUpDate: '',
    });
  };

  const handleUpdateActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;

    updateActivityInDay(trip.id, editingActivity.dayId, {
      ...editingActivity.activity,
      timeSlot: `${editingActivity.activity.startTime} - ${editingActivity.activity.endTime}`,
    });
    setEditingActivity(null);
  };

  const handleSaveNewHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotel.name || !newHotel.city) return;

    const createdHotel: HotelInfo = {
      id: `hotel-${Date.now()}`,
      name: newHotel.name,
      city: newHotel.city,
      country: newHotel.country || 'Israel',
      address: newHotel.address || `${newHotel.city} City Center`,
      starRating: Number(newHotel.starRating) || 5,
      imageUrl: newHotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
      galleryUrls: [newHotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'],
      description: newHotel.description || 'Verified premier hospitality partner.',
      roomType: newHotel.roomType || 'Executive Suite',
      boardBasis: (newHotel.boardBasis as any) || 'Bed & Breakfast',
      amenities: newHotel.amenities || ['Free Wi-Fi', 'Pool', 'Spa', 'Fine Dining'],
      checkInTime: newHotel.checkInTime || '15:00',
      checkOutTime: newHotel.checkOutTime || '11:00',
      contactPhone: newHotel.contactPhone || '+972 3 555 1234',
      pricePerNight: Number(newHotel.pricePerNight) || 500,
      currency: (newHotel.currency as any) || trip.currency,
    };

    addHotel(createdHotel);
    setIsAddHotelModalOpen(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                {trip.code}
              </span>
              <span className="text-xs text-slate-500 font-medium">Itinerary Design Studio</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {trip.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Hero Banner Photo Trigger */}
          <button
            onClick={() => setIsHeroPhotoModalOpen(true)}
            className="px-3.5 py-2 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
            title="Upload photo or change the top hero image for this itinerary"
          >
            <Camera className="w-3.5 h-3.5 text-amber-600" />
            <span>Hero Banner Photo</span>
          </button>

          {/* Particular Itinerary Logo Trigger */}
          <button
            onClick={() => setIsItineraryLogoModalOpen(true)}
            className={`px-3.5 py-2 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
              trip.logoUrl
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
            title="Place or change particular logo for this itinerary"
          >
            {trip.logoUrl ? (
              <img src={trip.logoUrl} alt="Logo" className="w-4 h-4 object-contain rounded" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{trip.logoUrl ? 'Change Itinerary Logo' : '+ Itinerary Logo'}</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            title="Generate live client link, QR code, and real-time synchronized share dossier"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Generate Client Link</span>
          </button>
          <button
            onClick={() => setIsAddHotelModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span>+ Add Partner Hotel</span>
          </button>
          <button
            onClick={() => setActiveView('passports')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            title="Manage participant passports manifest for this tour"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>Passports ({passports.filter((p) => p.tripId === trip.id).length}/{trip.partySize})</span>
          </button>
          <button
            onClick={() => {
              setActiveView('tour-management');
            }}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 border border-indigo-200 cursor-pointer"
            title="Open dedicated Tour Management Area (Supplier invoices, income received, and running P&L report)"
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tour Management Area</span>
          </button>
          <button
            onClick={() => openClientPortal(trip.id)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Live Client View</span>
          </button>
        </div>
      </div>

      {/* Hotel Change Success Toast */}
      {hotelChangeSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{hotelChangeSuccessMsg}</span>
          </div>
          <button onClick={() => setHotelChangeSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 text-sm">
            &times;
          </button>
        </div>
      )}

      {/* Conflict Alert Banner for This Trip */}
      {tripConflicts.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-800 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider">
              {tripConflicts.length} Conflict(s) Detected on this Itinerary:
            </span>
            {tripConflicts.map((c) => (
              <p key={c.id}>
                &bull; <strong>{c.title}</strong>: {c.description}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Top of Itinerary Hero Image Banner */}
      <div className="relative h-44 sm:h-56 w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs group">
        <img
          src={trip.heroImage?.trim() || 'https://images.unsplash.com/photo-1544971587-b842c27f8e14?w=1600&auto=format&fit=crop&q=80'}
          alt={trip.title}
          className="w-full h-full object-cover object-center filter brightness-90 group-hover:scale-102 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex flex-col justify-end p-5 text-white">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  {trip.code}
                </span>
                <span className="text-xs text-slate-300 font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {trip.destination}
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  &bull; {trip.startDate} to {trip.endDate} ({trip.days.length} Days)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 drop-shadow-md">
                {trip.tourName || trip.title}
              </h2>
            </div>
            <button
              onClick={() => setIsHeroPhotoModalOpen(true)}
              className="px-3.5 py-2 bg-white/90 hover:bg-white text-slate-950 font-bold text-xs rounded-xl shadow-md backdrop-blur-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Upload photo or change the top hero image"
            >
              <Camera className="w-3.5 h-3.5 text-amber-600" />
              <span>Change / Upload Hero Photo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trip Meta Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        {isEditingHeader ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Trip Title</label>
                <input
                  type="text"
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Destination</label>
                <input
                  type="text"
                  value={headerDestination}
                  onChange={(e) => setHeaderDestination(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              {hasFullFinancialView && (
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Total Client Price ({trip.currency})</label>
                  <input
                    type="number"
                    value={headerPrice}
                    onChange={(e) => setHeaderPrice(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Party Size</label>
                <input
                  type="number"
                  min={1}
                  value={headerPartySize}
                  onChange={(e) => setHeaderPartySize(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Start Date</label>
                <input
                  type="date"
                  value={headerStartDate}
                  onChange={(e) => setHeaderStartDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">End Date</label>
                <input
                  type="date"
                  value={headerEndDate}
                  onChange={(e) => setHeaderEndDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Status</label>
                <select
                  value={headerStatus}
                  onChange={(e) => setHeaderStatus(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="Draft">Draft</option>
                  <option value="Proposed">Proposed</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Dedicated Tour Guide</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Avi Ron"
                  value={headerGuide}
                  onChange={(e) => setHeaderGuide(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Dedicated Driver / Chauffeur</label>
                <input
                  type="text"
                  placeholder="e.g. Ehud VIP Fleet"
                  value={headerDriver}
                  onChange={(e) => setHeaderDriver(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Client Hotel Accommodation (Applies across tour nights)</span>
                </label>
                <div className="flex gap-2 mt-1">
                  <select
                    value={headerHotelId}
                    onChange={(e) => setHeaderHotelId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 font-bold text-slate-900"
                  >
                    <option value="">-- No Hotel Assigned (Self-Booked) --</option>
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} &bull; {h.city}, {h.country} ({h.starRating}★){hasFullFinancialView ? ` - $${h.pricePerNight} ${h.currency}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditingHeader(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHeader}
                className="px-4 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Destination</span>
                <span className="font-semibold text-slate-900 text-sm flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  {trip.destination}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Dates</span>
                <span className="font-semibold text-slate-900 text-sm flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  {trip.startDate} &mdash; {trip.endDate} ({trip.days.length} Days)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Party Size</span>
                <span className="font-semibold text-slate-900 text-sm flex items-center gap-1 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  {trip.partySize} Guests
                </span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Dedicated Guide</span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1 mt-0.5">
                  <Compass className="w-3.5 h-3.5 text-amber-600" />
                  {trip.guideName || 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Chauffeur / Driver</span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-amber-600" />
                  {trip.driverName || 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Client Hotel</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>{hotelNames.length > 0 ? hotelNames.join(', ') : 'No Hotel Assigned'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenChangeHotelModal}
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-extrabold underline cursor-pointer"
                    title="Change hotel stay for client"
                  >
                    Change
                  </button>
                </div>
              </div>
              {hasFullFinancialView && (
                <div>
                  <span className="text-slate-400 block uppercase text-[10px] font-bold">Package Price</span>
                  <span className="font-bold text-slate-900 text-sm text-emerald-700 flex items-center gap-1 mt-0.5">
                    ${trip.totalClientPrice.toLocaleString()} {trip.currency}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block uppercase text-[10px] font-bold">Status</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 inline-block mt-0.5">
                  {trip.status}
                </span>
              </div>
              {trip.logoUrl && (
                <div>
                  <span className="text-slate-400 block uppercase text-[10px] font-bold">Itinerary Logo</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="h-7 max-w-[100px] px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                      <img src={trip.logoUrl} alt="Logo" className="max-h-5 max-w-[85px] object-contain" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsItineraryLogoModalOpen(true)}
                      className="text-[10px] text-amber-700 hover:underline font-bold"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenChangeHotelModal}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Change hotel property at which client is staying"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Change Hotel Stay</span>
              </button>
              <button
                onClick={() => {
                  setHeaderTitle(trip.title);
                  setHeaderDestination(trip.destination);
                  setHeaderPrice(trip.totalClientPrice);
                  setHeaderStatus(trip.status);
                  setHeaderGuide(trip.guideName || '');
                  setHeaderDriver(trip.driverName || '');
                  setHeaderHotelId(trip.days.find((d) => d.hotelId)?.hotelId || '');
                  setHeaderStartDate(trip.startDate);
                  setHeaderEndDate(trip.endDate);
                  setIsEditingHeader(true);
                }}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Trip Details</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Proposed Itinerary Financial Projections & General Costs (Full Financial View Members Only) */}
      <GeneralProjectedCostsSection
        trip={trip}
        onUpdateTrip={updateItinerary}
      />

      {/* View Mode Switcher: Large Table (Default) vs Visual Time Grid vs Classic List */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          {/* Interactive Visual Timeline Overview */}
          <button
            onClick={() => setPlannerMode('visual_timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              plannerMode === 'visual_timeline'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Visual Time Grid (All Days)</span>
          </button>
          
          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-950/15 text-slate-950">
            Primary
          </span>

          {/* Classic List View */}
          <button
            onClick={() => setPlannerMode('classic_list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              plannerMode === 'classic_list'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Detailed List View</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Shift + Keyword Fast Insertion Info Badge */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs font-bold shadow-2xs"
            title="Hold Shift and type any linked keyword (e.g. masada, deadsea, wine) to auto-insert the activity"
          >
            <Tag className="w-3.5 h-3.5 text-amber-700" />
            <span>
              Hold <strong className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">Shift</strong> + type keyword to auto-insert
            </span>
          </div>

          {/* Quick Ctrl Auto Insert Activity Button */}
          <button
            onClick={() => {
              setCtrlInserterQuery('');
              setIsCtrlInserterOpen(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all group"
            title="Press Ctrl and type any activity name, or click here to auto-insert with full description and length"
          >
            <span className="px-1.5 py-0.5 rounded-md bg-slate-950/20 text-slate-950 font-mono text-[10px] font-black border border-slate-950/20">
              Ctrl + Type
            </span>
            <span>Auto-Insert</span>
            <Sparkles className="w-3.5 h-3.5 text-slate-950 group-hover:rotate-12 transition-transform" />
          </button>

          <button
            onClick={handleAddDay}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Day</span>
          </button>
        </div>
      </div>

      {plannerMode === 'visual_timeline' ? (
        <VisualTimelinePlanner
          tripId={trip.id}
          onOpenHotelModal={(h) => setSelectedHotelForModal(h)}
        />
      ) : (
        /* Classic List View */
        <div className="space-y-6">
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
                    Please prompt and enter the overnight accommodation for each day. Type the hotel for each day below or bulk-assign across the tour.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const firstMissing = daysMissingHotel[0];
                    if (firstMissing) {
                      const el = document.getElementById(`day-hotel-input-${firstMissing.id}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.focus();
                      }
                    }
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Jump to Night {daysMissingHotel[0]?.dayNumber}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenChangeHotelModal}
                  className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bulk Assign Hotel</span>
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Day-by-Day Schedule &amp; Accommodations ({trip.days.length} Days)
            </h2>
          </div>

        {trip.days.map((day) => {
          const dayHotel = hotels.find((h) => h.id === day.hotelId);
          const isEditingDay = editingDayId === day.id;

          return (
            <div
              key={day.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5"
            >
              {/* Day Header Row */}
              <div className="pb-3 border-b border-slate-100">
                {isEditingDay ? (
                  <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500">Day Title</label>
                      <input
                        type="text"
                        value={editingDayTitle}
                        onChange={(e) => setEditingDayTitle(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500">Day Summary / Theme</label>
                      <textarea
                        rows={2}
                        value={editingDaySummary}
                        onChange={(e) => setEditingDaySummary(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingDayId(null)}
                        className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveDayEdit(day.id)}
                        className="px-4 py-1 bg-slate-900 text-white font-bold text-xs rounded-lg"
                      >
                        Save Day Info
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <span className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-xs">
                        {day.dayNumber}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-400">{day.date}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{day.title}</h3>
                        <p className="text-xs text-slate-500 italic mt-0.5 line-clamp-1">{day.summary}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingDayId(day.id);
                          setEditingDayTitle(day.title);
                          setEditingDaySummary(day.summary);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit Day Title & Summary"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteDayFromItinerary(trip.id, day.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Day"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hotel / Accommodation Selector for This Night */}
              {(() => {
                const currentHotelName = day.hotelName || dayHotel?.name || '';
                const isEditingHotel = Boolean(editingHotelDays[day.id]);

                if (!currentHotelName || isEditingHotel) {
                  return (
                    <div className="bg-gradient-to-r from-amber-50/90 via-amber-50/60 to-white border-2 border-amber-300 rounded-2xl p-4 shadow-2xs space-y-3">
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
                                  ⚠️ Hotel Required &bull; Please enter hotel
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                  ✏️ Updating Hotel
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 font-medium mt-0.5">
                              {!currentHotelName
                                ? `Please enter the hotel for Night ${day.dayNumber}. This will be shown on client itineraries and manifests.`
                                : `Update the hotel name for Night ${day.dayNumber}:`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {hotelFeedback[day.id] && (
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {hotelFeedback[day.id]}
                            </span>
                          )}
                          {currentHotelName && isEditingHotel && (
                            <button
                              type="button"
                              onClick={() => setEditingHotelDays((prev) => ({ ...prev, [day.id]: false }))}
                              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                        <div className="relative flex-1">
                          <Building className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id={`day-hotel-input-${day.id}`}
                            type="text"
                            value={dayHotelInputs[day.id] !== undefined ? dayHotelInputs[day.id] : currentHotelName}
                            onChange={(e) =>
                              setDayHotelInputs((prev) => ({
                                ...prev,
                                [day.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveHotelForDay(day.id);
                              }
                            }}
                            placeholder={`Enter hotel for Night ${day.dayNumber} (e.g. King David Hotel, The Norman, Waldorf Astoria)...`}
                            className="w-full pl-9 pr-3 py-2 text-xs font-bold text-slate-900 bg-white border-2 border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl placeholder:text-slate-400"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSaveHotelForDay(day.id)}
                          disabled={!(dayHotelInputs[day.id] !== undefined ? dayHotelInputs[day.id] : currentHotelName).trim()}
                          className="px-4 py-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>{currentHotelName ? 'Update Hotel' : 'Save Hotel'}</span>
                        </button>

                        {hotels.length > 0 && (
                          <div className="relative shrink-0 md:w-56">
                            <select
                              value={day.hotelId || ''}
                              onChange={(e) => handleSelectHotelForDay(day.id, e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-300 hover:border-amber-400 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500/20 cursor-pointer shadow-2xs"
                            >
                              <option value="">-- Or choose from catalog ({hotels.length}) --</option>
                              {hotels.map((h) => (
                                <option key={h.id} value={h.id}>
                                  {h.name} ({h.city})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-slate-50/90 hover:bg-amber-50/40 p-4 rounded-2xl border border-slate-200/90 hover:border-amber-300/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-amber-100/80 rounded-xl border border-amber-300 text-amber-800 shrink-0">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Night {day.dayNumber} Overnight Hotel &bull; {day.date}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            Hotel Allocated
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <h4 className="text-sm font-black text-slate-900">
                            {currentHotelName}
                          </h4>
                          {dayHotel && (
                            <span className="text-xs text-amber-800 font-semibold bg-amber-100/70 px-2 py-0.5 rounded-md">
                              {dayHotel.roomType} &bull; {dayHotel.boardBasis}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-start md:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingHotelDays((prev) => ({ ...prev, [day.id]: true }));
                          setDayHotelInputs((prev) => ({ ...prev, [day.id]: currentHotelName }));
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>Change Hotel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateDayInItinerary(trip.id, {
                            ...day,
                            hotelId: undefined,
                            hotelName: undefined,
                          });
                          setDayHotelInputs((prev) => ({ ...prev, [day.id]: '' }));
                        }}
                        className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                        title="Remove Hotel Allocation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {dayHotel && (
                        <button
                          type="button"
                          onClick={() => setSelectedHotelForModal(dayHotel)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>View Amenities</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Activities for This Day */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Day Activities ({day.activities.length})
                  </span>
                  <button
                    onClick={() => setActiveDayIdForNewActivity(day.id)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Activity to Day {day.dayNumber}</span>
                  </button>
                </div>

                {day.activities.length === 0 ? (
                  <div className="p-4 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                    No activities planned for this day yet. Click &ldquo;Add Activity&rdquo; above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {day.activities.map((act) => {
                      const supplier = suppliers.find((s) => s.id === act.supplierId);
                      const assignedStaff = staff.find((s) => s.id === act.assignedBookingStaffId);
                      const normStatus = (act.bookingStatus || 'to be booked').toLowerCase();
                      const isConfirmed = normStatus === 'confirmed' || normStatus === 'booked';
                      const isRequested = normStatus === 'booking requested' || normStatus === 'requested';
                      const isToBeBooked = !isConfirmed && !isRequested;

                      // Color coding: yellow for to be booked, blue for booking requested, green for confirmed
                      const cardColorClass = isConfirmed
                        ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300'
                        : isRequested
                        ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-300'
                        : 'bg-yellow-50/80 border-yellow-300 ring-1 ring-yellow-300';

                      return (
                        <div
                          key={act.id}
                          onClick={() => setEditingActivity({ dayId: day.id, activity: act })}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md space-y-2.5 ${cardColorClass}`}
                        >
                          <div className="flex items-start justify-between gap-3 text-xs">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-slate-800 flex items-center gap-1 font-mono">
                                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                                  {act.startTime} &mdash; {act.endTime}
                                </span>
                                <span className="font-extrabold text-slate-900 text-sm">
                                  {act.title}
                                </span>
                                {act.category && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 border border-slate-200 text-slate-700">
                                    {act.category}
                                  </span>
                                )}

                                {/* Status Color Indicator Badge */}
                                {isConfirmed && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-white shadow-2xs">
                                    🟢 Confirmed
                                  </span>
                                )}
                                {isRequested && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500 text-white shadow-2xs">
                                    🔵 Booking Requested
                                  </span>
                                )}
                                {isToBeBooked && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-yellow-400 text-slate-950 font-black shadow-2xs">
                                    🟡 To Be Booked
                                  </span>
                                )}

                                {supplier?.isLoneProvider && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                                    ★ Lone Provider: {supplier.name}
                                  </span>
                                )}
                              </div>

                              <p className="text-slate-700 text-xs leading-relaxed">
                                {act.description}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 text-slate-500 pt-0.5 text-[11px]">
                                {act.location && (
                                  <span>Loc: <strong className="text-slate-800">{act.location}</strong></span>
                                )}
                                {supplier && (
                                  <span>Supplier: <strong className="text-slate-800">{supplier.name}</strong></span>
                                )}
                                {hasFullFinancialView && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuickCostModalActivity({
                                        dayId: day.id,
                                        activity: act,
                                        cost: act.costEstimate ?? 0,
                                      });
                                    }}
                                    className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer border ${
                                      (act.costEstimate ?? 0) === 0
                                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs'
                                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                                    }`}
                                    title="Click to change or edit cost to agency for this activity"
                                  >
                                    <DollarSign className="w-3 h-3 text-amber-600" />
                                    <span>
                                      Cost to Me: {(act.costEstimate ?? 0) === 0 ? '$0 (No Cost / Free)' : `$${act.costEstimate}`}
                                    </span>
                                    <Edit2 className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingActivity({ dayId: day.id, activity: act });
                                }}
                                className="p-1.5 text-slate-500 hover:text-slate-900 bg-white/70 hover:bg-white rounded-lg border border-slate-200 transition-colors shadow-2xs"
                                title="Edit Activity & Booking Status"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteActivityFromDay(trip.id, day.id, act.id);
                                }}
                                className="p-1.5 text-slate-500 hover:text-red-600 bg-white/70 hover:bg-white rounded-lg border border-slate-200 transition-colors shadow-2xs"
                                title="Delete Activity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Internal Working Marker Strip with Quick Status Change */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <InternalBookingMarker
                              status={act.bookingStatus || 'to be booked'}
                              assignedStaff={assignedStaff}
                              deadline={act.bookingDeadline}
                              supplier={supplier}
                              onStatusChange={(newStatus) =>
                                updateActivityBookingStatus(trip.id, day.id, act.id, newStatus)
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Form to Add Activity - Compact Modal with Sticky Footer */}
                {activeDayIdForNewActivity === day.id && (
                  <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden animate-scale-in">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white shrink-0">
                        <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                          <div className="p-1 bg-amber-100 text-amber-700 rounded-lg">
                            <Plus className="w-4 h-4" />
                          </div>
                          <span>Add Activity to Day {day.dayNumber}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveDayIdForNewActivity(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-lg leading-none"
                        >
                          &times;
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {/* SOURCE MODE SWITCHER: LIBRARY DROPDOWN VS CUSTOM ACTIVITY */}
                    <div className="flex items-center p-1 bg-white rounded-2xl gap-1 border border-amber-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          setNewActivitySourceMode('library');
                          if (activityCatalog.length > 0 && !newActivitySelectedLibraryId) {
                            handleSelectLibraryItemInBuilder(activityCatalog[0].id);
                          }
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          newActivitySourceMode === 'library'
                            ? 'bg-amber-500 text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Choose from Activity Library ({activityCatalog.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewActivitySourceMode('custom');
                          setNewActivitySelectedLibraryId('');
                          setNewActivityData((prev) => ({
                            ...prev,
                            title: '',
                            description: '',
                          }));
                        }}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          newActivitySourceMode === 'custom'
                            ? 'bg-amber-500 text-slate-950 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Create New Custom Activity</span>
                      </button>
                    </div>

                    {/* MODE 1: CHOOSE FROM ACTIVITY LIBRARY DROPDOWN */}
                    {newActivitySourceMode === 'library' && (
                      <div className="p-3 bg-white rounded-2xl border-2 border-amber-300 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-extrabold text-amber-950 uppercase flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                            <span>Select Activity from Library Dropdown *</span>
                          </label>
                          <span className="text-[10px] text-amber-800 font-semibold">Autofills details &amp; duration</span>
                        </div>
                        <select
                          value={newActivitySelectedLibraryId}
                          onChange={(e) => handleSelectLibraryItemInBuilder(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold bg-white border-2 border-amber-400 rounded-xl text-slate-900 outline-none shadow-2xs"
                        >
                          <option value="">-- Choose an activity from library --</option>
                          {activityCatalog.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.durationHours}h{item.category ? ` • ${item.category}` : ''}{item.keyword ? ` • Shift+"${item.keyword}"` : ''})
                            </option>
                          ))}
                        </select>

                        {newActivitySelectedLibraryId && (
                          <div className="text-[11px] text-amber-950 bg-amber-50 p-2.5 rounded-xl border border-amber-200 space-y-1">
                            <div className="font-bold flex items-center justify-between">
                              <span>Selected: {newActivityData.title}</span>
                              <span className="font-mono text-[10px] bg-amber-200 px-1.5 py-0.2 rounded font-black text-amber-950">
                                {newActivityData.startTime} - {newActivityData.endTime}
                              </span>
                            </div>
                            {newActivityData.description && (
                              <p className="line-clamp-2 text-slate-600">{newActivityData.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* MODE 2: CREATE NEW CUSTOM ACTIVITY */}
                    {newActivitySourceMode === 'custom' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase">Custom Activity Title *</label>
                          <input
                            type="text"
                            required
                            autoFocus
                            placeholder="e.g. Private Helicopter Flight over Dead Sea..."
                            value={newActivityData.title || ''}
                            onChange={(e) => setNewActivityData({ ...newActivityData, title: e.target.value })}
                            className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                          />
                        </div>

                        {/* AUTOMATICALLY ADD TO ACTIVITY LIBRARY CHECKBOX */}
                        <div className="p-3 bg-white rounded-2xl border-2 border-amber-300 space-y-2">
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={saveCustomToLibrary}
                              onChange={(e) => setSaveCustomToLibrary(e.target.checked)}
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
                                Saves this custom activity into your Master Activity Library so it can be reused in future itineraries and triggered with Shift-typing!
                              </div>
                            </div>
                          </label>

                          {saveCustomToLibrary && (
                            <div className="pt-2 border-t border-amber-200 flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">Link Keyword (optional):</span>
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-700">
                                  Shift +
                                </span>
                                <input
                                  type="text"
                                  placeholder="e.g. chopper"
                                  value={customLibraryKeyword}
                                  onChange={(e) => setCustomLibraryKeyword(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                                  className="w-full pl-14 pr-2.5 py-1 text-xs font-mono font-bold bg-white border border-amber-300 rounded-lg outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Activity Name / Display Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Western Wall Tunnels Private Walk"
                          value={newActivityData.title}
                          onChange={(e) => setNewActivityData({ ...newActivityData, title: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Start & End Time</label>
                        <div className="flex items-center space-x-1 mt-1">
                          <input
                            type="time"
                            value={newActivityData.startTime}
                            onChange={(e) => setNewActivityData({ ...newActivityData, startTime: e.target.value })}
                            className="w-1/2 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                          />
                          <span className="text-xs text-slate-400">-</span>
                          <input
                            type="time"
                            value={newActivityData.endTime}
                            onChange={(e) => setNewActivityData({ ...newActivityData, endTime: e.target.value })}
                            className="w-1/2 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Category / Type (Optional)</label>
                        <select
                          value={newActivityData.category || ''}
                          onChange={(e) => setNewActivityData({ ...newActivityData, category: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase">Location</label>
                        <input
                          type="text"
                          placeholder="Location name or address"
                          value={newActivityData.location}
                          onChange={(e) => setNewActivityData({ ...newActivityData, location: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase">
                          Assign Supplier (Marks Lone Providers)
                        </label>
                        <select
                          value={newActivityData.supplierId || ''}
                          onChange={(e) => setNewActivityData({ ...newActivityData, supplierId: e.target.value })}
                          className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
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

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Description / Notes</label>
                      <textarea
                        rows={2}
                        placeholder="Details for client view and operational staff..."
                        value={newActivityData.description}
                        onChange={(e) => setNewActivityData({ ...newActivityData, description: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>

                    {/* Projected Item Cost: Full Financial View Members Only */}
                    {hasFullFinancialView ? (
                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-amber-950 uppercase flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                            <span>Cost of Activity to Me ({trip.currency}) &bull; Agency Cost</span>
                          </label>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                            Full Financial View Only
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={newActivityData.costEstimate ?? 0}
                            onChange={(e) =>
                              setNewActivityData({
                                ...newActivityData,
                                costEstimate: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setNewActivityData({
                                ...newActivityData,
                                costEstimate: 0,
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
                              (newActivityData.costEstimate ?? 0) === 0
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300'
                            }`}
                            title="Set activity cost as $0 (No cost to me / Complimentary)"
                          >
                            ✓ No Cost to Me ($0)
                          </button>
                        </div>

                        <p className="text-[10px] text-slate-500">
                          {(newActivityData.costEstimate ?? 0) === 0
                            ? '🟢 Marked as $0: Does not add any cost to the agency quotation.'
                            : `Projected cost of ${newActivityData.costEstimate} ${trip.currency} factored into tour gross margin.`}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-400 flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Projected item cost estimation is restricted to Full Financial View members.</span>
                      </div>
                    )}

                    {/* AUTOMATIC BOOKING STATUS & STAFF ASSIGNMENT MARKER SECTION */}
                    <div className="p-3 bg-white rounded-xl border border-amber-300/80 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <span>Internal Working Booking Marker &amp; Staff Assignment</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Color-coded across itinerary</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                            Booking Status *
                          </label>
                          <select
                            value={newActivityData.bookingStatus || 'to be booked'}
                            onChange={(e) =>
                              setNewActivityData({
                                ...newActivityData,
                                bookingStatus: e.target.value as any,
                              })
                            }
                            className={`w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border outline-none ${
                              newActivityData.bookingStatus === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-950 border-emerald-400'
                                : newActivityData.bookingStatus === 'booking requested'
                                ? 'bg-blue-50 text-blue-950 border-blue-400'
                                : 'bg-yellow-50 text-yellow-950 border-yellow-400'
                            }`}
                          >
                            <option value="to be booked">🟡 To Be Booked (Yellow)</option>
                            <option value="booking requested">🔵 Booking Requested (Blue)</option>
                            <option value="confirmed">🟢 Confirmed / Booked (Green)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                            Assign Booking To Staff Member
                          </label>
                          <select
                            value={newActivityData.assignedBookingStaffId || ''}
                            onChange={(e) =>
                              setNewActivityData({
                                ...newActivityData,
                                assignedBookingStaffId: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg outline-none"
                          >
                            <option value="">-- Select Staff Member --</option>
                            {staff.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.department.split(' ')[0]})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          {newActivityData.bookingStatus === 'to be booked' && (
                            <div>
                              <label className="text-[10px] font-bold text-yellow-900 uppercase block mb-1">
                                Timeframe / Deadline to Book
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="date"
                                  value={newActivityData.bookingDeadline || ''}
                                  onChange={(e) =>
                                    setNewActivityData({
                                      ...newActivityData,
                                      bookingDeadline: e.target.value,
                                    })
                                  }
                                  className="w-1/2 px-2 py-1.5 text-xs font-semibold bg-white border border-yellow-300 rounded-lg outline-none"
                                />
                                <select
                                  value={newActivityData.bookingTimeframe || 'Within 48 hours'}
                                  onChange={(e) =>
                                    setNewActivityData({
                                      ...newActivityData,
                                      bookingTimeframe: e.target.value,
                                    })
                                  }
                                  className="w-1/2 px-1.5 py-1.5 text-[11px] font-bold bg-white border border-yellow-300 rounded-lg outline-none text-yellow-950"
                                >
                                  <option value="Within 24 hours">24 Hours</option>
                                  <option value="Within 48 hours">48 Hours</option>
                                  <option value="Within 7 days">7 Days</option>
                                  <option value="Urgent">Urgent</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {newActivityData.bookingStatus === 'booking requested' && (
                            <div>
                              <label className="text-[10px] font-bold text-blue-900 uppercase block mb-1">
                                Follow-up Date *
                              </label>
                              <input
                                type="date"
                                value={newActivityData.followUpDate || ''}
                                onChange={(e) =>
                                  setNewActivityData({
                                    ...newActivityData,
                                    followUpDate: e.target.value,
                                  })
                                }
                                className="w-full px-2.5 py-1.5 text-xs font-bold text-blue-950 bg-white border border-blue-400 rounded-lg outline-none"
                              />
                            </div>
                          )}

                          {newActivityData.bookingStatus === 'confirmed' && (
                            <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 font-medium">
                              ✓ Confirmed. No booking tasks required.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                      </div>

                      {/* Sticky Footer: Always visible on screen, never off-screen */}
                      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0 z-10 sticky bottom-0">
                        <button
                          type="button"
                          onClick={() => setActiveDayIdForNewActivity(null)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateActivity(day.id)}
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Save Activity</span>
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
      )}

      {/* Edit Activity Modal */}
      {editingActivity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white shrink-0">
              <h3 className="text-sm font-extrabold text-slate-900">Edit Activity Details</h3>
              <button
                type="button"
                onClick={() => setEditingActivity(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateActivitySubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Title</label>
                <input
                  type="text"
                  required
                  value={editingActivity.activity.title}
                  onChange={(e) =>
                    setEditingActivity({
                      ...editingActivity,
                      activity: { ...editingActivity.activity, title: e.target.value },
                    })
                  }
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Start Time</label>
                  <input
                    type="time"
                    required
                    value={editingActivity.activity.startTime}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        activity: { ...editingActivity.activity, startTime: e.target.value },
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
                    value={editingActivity.activity.endTime}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        activity: { ...editingActivity.activity, endTime: e.target.value },
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
                    value={editingActivity.activity.category || ''}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        activity: { ...editingActivity.activity, category: e.target.value || undefined },
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
                    value={editingActivity.activity.supplierId || ''}
                    onChange={(e) =>
                      setEditingActivity({
                        ...editingActivity,
                        activity: { ...editingActivity.activity, supplierId: e.target.value || undefined },
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

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Location</label>
                <input
                  type="text"
                  value={editingActivity.activity.location}
                  onChange={(e) =>
                    setEditingActivity({
                      ...editingActivity,
                      activity: { ...editingActivity.activity, location: e.target.value },
                    })
                  }
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Description</label>
                <textarea
                  rows={2}
                  value={editingActivity.activity.description}
                  onChange={(e) =>
                    setEditingActivity({
                      ...editingActivity,
                      activity: { ...editingActivity.activity, description: e.target.value },
                    })
                  }
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              {/* Cost of Activity to Me (Full Financial View Members) */}
              {hasFullFinancialView ? (
                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-950 uppercase flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                      <span>Cost of Activity to Me (Agency Cost)</span>
                    </label>
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                      Quotation &amp; Margin
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        {editingActivity.activity.currency || trip.currency}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={editingActivity.activity.costEstimate ?? 0}
                        onChange={(e) =>
                          setEditingActivity({
                            ...editingActivity,
                            activity: {
                              ...editingActivity.activity,
                              costEstimate: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full pl-12 pr-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingActivity({
                          ...editingActivity,
                          activity: {
                            ...editingActivity.activity,
                            costEstimate: 0,
                          },
                        })
                      }
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
                        (editingActivity.activity.costEstimate ?? 0) === 0
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                      title="Set activity cost as $0 (No Cost to Me / Free)"
                    >
                      ✓ No Cost to Me ($0)
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    {(editingActivity.activity.costEstimate ?? 0) === 0
                      ? '🟢 Marked as $0 (No Cost to Agency / Complimentary or covered under general guide/driver hire).'
                      : `Agency cost of ${editingActivity.activity.costEstimate} ${editingActivity.activity.currency || trip.currency} calculated into this tour's projected gross profit.`}
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Cost to Agency is restricted to Full Financial View members.</span>
                </div>
              )}

              {/* BOOKING STATUS & WORKER ASSIGNMENT */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 block">
                  Internal Working Marker &amp; Staff Assignment
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Booking Status *
                    </label>
                    <select
                      value={editingActivity.activity.bookingStatus || 'to be booked'}
                      onChange={(e) =>
                        setEditingActivity({
                          ...editingActivity,
                          activity: {
                            ...editingActivity.activity,
                            bookingStatus: e.target.value as any,
                          },
                        })
                      }
                      className={`w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border outline-none ${
                        editingActivity.activity.bookingStatus === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-950 border-emerald-400'
                          : editingActivity.activity.bookingStatus === 'booking requested'
                          ? 'bg-blue-50 text-blue-950 border-blue-400'
                          : 'bg-yellow-50 text-yellow-950 border-yellow-400'
                      }`}
                    >
                      <option value="to be booked">🟡 To Be Booked (Yellow)</option>
                      <option value="booking requested">🔵 Booking Requested (Blue)</option>
                      <option value="confirmed">🟢 Confirmed / Booked (Green)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Assign Booking To Staff
                    </label>
                    <select
                      value={editingActivity.activity.assignedBookingStaffId || ''}
                      onChange={(e) =>
                        setEditingActivity({
                          ...editingActivity,
                          activity: {
                            ...editingActivity.activity,
                            assignedBookingStaffId: e.target.value || undefined,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg outline-none"
                    >
                      <option value="">-- Unassigned --</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.department.split(' ')[0]})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    {editingActivity.activity.bookingStatus === 'to be booked' && (
                      <div>
                        <label className="text-[10px] font-bold text-yellow-900 uppercase block mb-1">
                          Booking Timeframe / Deadline
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={editingActivity.activity.bookingDeadline || ''}
                            onChange={(e) =>
                              setEditingActivity({
                                ...editingActivity,
                                activity: {
                                  ...editingActivity.activity,
                                  bookingDeadline: e.target.value || undefined,
                                },
                              })
                            }
                            className="w-1/2 px-2 py-1.5 text-xs font-semibold bg-white border border-yellow-300 rounded-lg outline-none"
                          />
                          <select
                            value={editingActivity.activity.bookingTimeframe || 'Within 48 hours'}
                            onChange={(e) =>
                              setEditingActivity({
                                ...editingActivity,
                                activity: {
                                  ...editingActivity.activity,
                                  bookingTimeframe: e.target.value,
                                },
                              })
                            }
                            className="w-1/2 px-1.5 py-1.5 text-[11px] font-bold bg-white border border-yellow-300 rounded-lg outline-none text-yellow-950"
                          >
                            <option value="Within 24 hours">24 Hours</option>
                            <option value="Within 48 hours">48 Hours</option>
                            <option value="Within 7 days">7 Days</option>
                            <option value="Urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {editingActivity.activity.bookingStatus === 'booking requested' && (
                      <div>
                        <label className="text-[10px] font-bold text-blue-900 uppercase block mb-1">
                          Supplier Follow-up Date *
                        </label>
                        <input
                          type="date"
                          value={editingActivity.activity.followUpDate || ''}
                          onChange={(e) =>
                            setEditingActivity({
                              ...editingActivity,
                              activity: {
                                ...editingActivity.activity,
                                followUpDate: e.target.value || undefined,
                              },
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-bold text-blue-950 bg-white border border-blue-400 rounded-lg outline-none"
                        />
                      </div>
                    )}

                    {editingActivity.activity.bookingStatus === 'confirmed' && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 font-medium">
                        ✓ Confirmed. Prior booking tasks are removed from employee tasks.
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

      {/* Add Partner Hotel Modal */}
      {isAddHotelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Partner Luxury Hotel</h3>

            <form onSubmit={handleSaveNewHotel} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Hotel Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The American Colony Hotel"
                  value={newHotel.name}
                  onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">City</label>
                  <input
                    type="text"
                    required
                    value={newHotel.city}
                    onChange={(e) => setNewHotel({ ...newHotel, city: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Board Basis</label>
                  <select
                    value={newHotel.boardBasis}
                    onChange={(e) => setNewHotel({ ...newHotel, boardBasis: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="Bed & Breakfast">Bed & Breakfast</option>
                    <option value="Half Board">Half Board</option>
                    <option value="Full Board">Full Board</option>
                    <option value="Room Only">Room Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Hotel Description</label>
                <textarea
                  rows={2}
                  placeholder="Atmosphere, heritage, grounds, concierge notes..."
                  value={newHotel.description}
                  onChange={(e) => setNewHotel({ ...newHotel, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddHotelModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Add Hotel to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hotel Detail Modal */}
      <HotelDetailModal
        hotel={selectedHotelForModal}
        onClose={() => setSelectedHotelForModal(null)}
      />

      {/* Ctrl + Type Activity Name Auto-Inserter Modal */}
      <CtrlActivityAutoInserterModal
        trip={trip}
        isOpen={isCtrlInserterOpen}
        onClose={() => setIsCtrlInserterOpen(false)}
        initialQuery={ctrlInserterQuery}
        defaultDayId={ctrlInserterDayId}
      />

      {/* Shift + Type Keyword Auto-Inserter Listener & HUD (Active in Visual Timeline & Classic List views) */}
      {plannerMode !== 'large_table' && (
        <ShiftKeywordListener
          trip={trip}
          activeDayId={selectedLargeTableDayId || trip.days[0]?.id}
        />
      )}

      {/* Generate Live Client Link Modal */}
      <GenerateClientLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tripId={trip.id}
      />

      {/* Place Particular Logo on Itinerary Modal */}
      {isItineraryLogoModalOpen && (
        <ItineraryLogoModal
          isOpen={isItineraryLogoModalOpen}
          onClose={() => setIsItineraryLogoModalOpen(false)}
          itinerary={trip}
        />
      )}

      {/* Change / Upload Hero Photo on Itinerary Modal */}
      {isHeroPhotoModalOpen && (
        <ItineraryHeroPhotoModal
          isOpen={isHeroPhotoModalOpen}
          onClose={() => setIsHeroPhotoModalOpen(false)}
          itinerary={trip}
        />
      )}

      {/* Change Hotel at which Client is Staying Modal */}
      {isChangeHotelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Change Client Hotel Stay
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update hotel property accommodations for {trip.title} ({trip.days.length} Nights)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangeHotelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Enter Hotel Name *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-amber-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={targetHotelCustomName}
                    onChange={(e) => {
                      setTargetHotelCustomName(e.target.value);
                      const match = hotels.find(
                        (h) => h.name.toLowerCase() === e.target.value.trim().toLowerCase()
                      );
                      setTargetHotelId(match ? match.id : '');
                    }}
                    placeholder="Type hotel name (e.g. King David Hotel, The Norman, Waldorf Astoria)..."
                    className="w-full pl-10 pr-3 py-2.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {hotels.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Or select from previous hotel entries ({hotels.length}):
                  </label>
                  <select
                    value={targetHotelId}
                    onChange={(e) => {
                      setTargetHotelId(e.target.value);
                      const sel = hotels.find((h) => h.id === e.target.value);
                      if (sel) setTargetHotelCustomName(sel.name);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl cursor-pointer"
                  >
                    <option value="">-- Choose from existing hotels --</option>
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} &bull; {h.city}, {h.country} ({h.starRating}★){hasFullFinancialView ? ` - $${h.pricePerNight} ${h.currency}/night` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selected Hotel Preview Card */}
              {(() => {
                const sel = hotels.find((h) => h.id === targetHotelId);
                if (!sel) return null;
                return (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-slate-900 text-sm">{sel.name}</div>
                      <div className="flex items-center text-amber-500 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="ml-1">{sel.starRating} Stars &bull; {sel.city}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{sel.address || `${sel.city}, ${sel.country}`}</span>
                    </div>
                    {sel.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{sel.description}</p>
                    )}
                    {sel.amenities && sel.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {sel.amenities.slice(0, 5).map((a, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] text-slate-600">
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Assignment Scope */}
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  Stay Duration &amp; Night Allocation
                </div>

                <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-900">
                  <input
                    type="checkbox"
                    checked={applyToAllNights}
                    onChange={(e) => setApplyToAllNights(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <span>Apply to all {trip.days.length} nights of this tour</span>
                </label>

                {!applyToAllNights && (
                  <div className="pt-2 border-t border-amber-200/60 space-y-2">
                    <div className="text-[11px] font-bold text-slate-600">Select specific nights:</div>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {trip.days.map((d) => (
                        <label
                          key={d.id}
                          className="flex items-center space-x-2 text-xs bg-white p-2 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDayIdsForHotel.includes(d.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDayIdsForHotel([...selectedDayIdsForHotel, d.id]);
                              } else {
                                setSelectedDayIdsForHotel(selectedDayIdsForHotel.filter((id) => id !== d.id));
                              }
                            }}
                            className="w-3.5 h-3.5 text-amber-600 rounded"
                          />
                          <span className="truncate">
                            Day {d.dayNumber}: {d.title || d.date}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsChangeHotelModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyHotelChange}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Hotel Accommodation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
