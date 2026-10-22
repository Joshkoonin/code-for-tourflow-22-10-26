import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Building,
  Phone,
  Mail,
  Share2,
  Printer,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Wifi,
  ExternalLink,
  ShieldCheck,
  Compass,
  Radio,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HotelDetailModal } from './HotelDetailModal';
import { GenerateClientLinkModal } from './GenerateClientLinkModal';
import { HotelInfo } from '../../types';

interface LiveClientViewProps {
  tripId?: string;
  onBackToConsole?: () => void;
}

export const LiveClientView: React.FC<LiveClientViewProps> = ({ tripId, onBackToConsole }) => {
  const {
    itineraries,
    hotels,
    clients,
    staff,
    formatMoney,
    clientPortalTripId,
    setActiveView,
    lastLiveSyncTime,
    companyLogo,
  } = useApp();

  const urlParams = new URLSearchParams(window.location.search);
  const activeTripId = tripId || clientPortalTripId || urlParams.get('trip') || itineraries[0]?.id;
  const trip = itineraries.find((t) => t.id === activeTripId) || itineraries[0];
  const client = clients.find((c) => c.id === trip?.clientId);
  const leadStaff = staff.find((s) => s.id === trip?.leadStaffId) || staff[0];

  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  const [selectedHotelForModal, setSelectedHotelForModal] = useState<HotelInfo | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSyncToast, setShowSyncToast] = useState(false);

  // Check URL query params for initial day jump (e.g. ?day=3)
  useEffect(() => {
    const dayParam = urlParams.get('day');
    if (dayParam && !isNaN(Number(dayParam)) && trip?.days) {
      const idx = Math.max(0, Math.min(Number(dayParam) - 1, trip.days.length - 1));
      setActiveDayIndex(idx);
    }
  }, [trip?.id]);

  // Trigger brief visual pulse when an external live sync occurs
  useEffect(() => {
    setShowSyncToast(true);
    const timer = setTimeout(() => setShowSyncToast(false), 3500);
    return () => clearTimeout(timer);
  }, [lastLiveSyncTime]);

  if (!trip) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-500">No itinerary selected.</p>
        {onBackToConsole && (
          <button
            onClick={onBackToConsole}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs"
          >
            Back to Operator Console
          </button>
        )}
      </div>
    );
  }

  const currentDay = trip.days[activeDayIndex] || trip.days[0];
  const foundHotel = currentDay?.hotelId
    ? hotels.find((h) => h.id === currentDay.hotelId)
    : null;
  const currentDayHotel: HotelInfo | null =
    foundHotel ||
    (currentDay?.hotelName
      ? {
          id: currentDay.hotelId || `hotel-client-${currentDay.id}`,
          name: currentDay.hotelName,
          city: trip.destination.split(',')[0]?.trim() || 'Local Area',
          country: trip.destination.split(',')[1]?.trim() || '',
          address: `${currentDay.hotelName}, ${trip.destination}`,
          starRating: 5,
          imageUrl:
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
          galleryUrls: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
          ],
          description: `Curated luxury accommodations at ${currentDay.hotelName}.`,
          roomType: 'Deluxe Suite',
          boardBasis: 'Bed & Breakfast',
          amenities: ['Concierge Service', 'Luxury Suite', 'Breakfast Included'],
          checkInTime: '15:00',
          checkOutTime: '11:00',
          contactPhone: '+972 2-555-0100',
          pricePerNight: 450,
          currency: trip.currency,
        }
      : null);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?view=client&trip=${trip.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedSyncTime = new Date(lastLiveSyncTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Top Floating Client Header Bar (Hidden in Print) */}
      <div className="no-print bg-slate-950 text-white sticky top-0 z-40 px-4 sm:px-8 py-3 border-b border-slate-800 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            {onBackToConsole && (
              <button
                onClick={onBackToConsole}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Operator Console</span>
              </button>
            )}
            {companyLogo && (
              <div className="h-8 max-w-[130px] px-2 py-0.5 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                <img src={companyLogo} alt="Company Logo" className="max-h-7 max-w-[110px] object-contain" />
              </div>
            )}
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                Live Client Portal
              </span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <div className="hidden sm:flex items-center space-x-1.5 text-slate-300 text-xs bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Live Sync Active</span>
                <span className="text-slate-500 font-mono text-[10px]">({formattedSyncTime})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center space-x-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
              title="Generate and copy live share link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Live Link</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Sync Toast Notification */}
      {showSyncToast && (
        <div className="no-print bg-emerald-600 text-white px-4 py-2 text-center text-xs font-bold tracking-wide flex items-center justify-center space-x-2 shadow-md animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>Itinerary Updated Live: Concierge modifications synchronized across your session.</span>
        </div>
      )}

      {/* Main Luxury Hero Banner */}
      <div className="relative h-96 sm:h-[460px] w-full bg-slate-900 text-white overflow-hidden">
        <img
          src={trip.heroImage?.trim() || 'https://images.unsplash.com/photo-1544971587-b842c27f8e14?w=1200&auto=format&fit=crop&q=80'}
          alt={trip.title}
          className="w-full h-full object-cover object-center filter brightness-90 transform scale-102 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/20" />

        <div className="absolute bottom-8 left-0 right-0 max-w-6xl mx-auto px-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-slate-950 shadow-sm">
                Private Tour Dossier
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-md text-white">
                {trip.code}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                Status: {trip.status}
              </span>
            </div>

            {/* Custom Logo Placed on this Itinerary */}
            {trip.logoUrl && (
              <div className="h-12 max-w-[160px] px-3 py-1 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center border border-white/50">
                <img
                  src={trip.logoUrl}
                  alt="Particular Itinerary Logo"
                  className="max-h-10 max-w-[140px] object-contain"
                />
              </div>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-serif-display tracking-tight text-white max-w-3xl leading-tight">
            {trip.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-200 mt-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>{trip.destination}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>
                {trip.startDate} &mdash; {trip.endDate} ({trip.days.length} Days)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 font-bold">Party of {trip.partySize}</span>
              {client && <span className="text-slate-300">&bull; Prepared for {client.name}</span>}
            </div>
            {trip.guideName && (
              <div className="flex items-center space-x-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Guide: {trip.guideName}</span>
              </div>
            )}
            {trip.driverName && (
              <div className="flex items-center space-x-1.5 bg-white/10 text-slate-200 border border-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
                <Building className="w-3.5 h-3.5 text-slate-300" />
                <span>Driver: {trip.driverName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Day Navigator & Schedule Detail (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Overview Statement */}
          {(trip.overview?.trim() || (trip.highlights && trip.highlights.length > 0) || trip.guideName || trip.driverName) && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200">
              {trip.overview?.trim() && (
                <>
                  <h2 className="text-xl font-bold font-serif-display text-slate-900 mb-3">
                    Journey Overview
                  </h2>
                  <p className="text-slate-700 text-sm leading-relaxed">{trip.overview}</p>
                </>
              )}



            {(trip.guideName || trip.driverName) && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Dedicated Private Escort &amp; Operations Crew
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trip.guideName && (
                    <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-xs">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Dedicated Private Tour Guide
                        </div>
                        <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                          {trip.guideName}
                        </div>
                      </div>
                    </div>
                  )}

                  {trip.driverName && (
                    <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 font-black flex items-center justify-center shrink-0 shadow-xs">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Dedicated Executive Chauffeur
                        </div>
                        <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                          {trip.driverName}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Interactive Day Tabs / Switcher */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-serif-display text-slate-900">
                Daily Itinerary Timeline
              </h2>
              <span className="text-xs text-slate-500">
                Click a day to view its activities &amp; hotel
              </span>
            </div>

            <div className="no-print flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
              {trip.days.map((day, idx) => {
                const isActive = activeDayIndex === idx;
                return (
                  <button
                    key={day.id}
                    onClick={() => setActiveDayIndex(idx)}
                    className={`px-4 py-3 rounded-2xl text-left shrink-0 transition-all border ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-500/30'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Day {day.dayNumber}
                    </div>
                    <div className="text-xs font-bold truncate max-w-[130px]">{day.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{day.date}</div>
                  </button>
                );
              })}
            </div>

            {/* Current Day Schedule Card */}
            {currentDay && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                      Day {currentDay.dayNumber} &bull; {currentDay.date}
                    </span>
                    <h3 className="text-2xl font-bold font-serif-display text-slate-900 mt-1.5">
                      {currentDay.title}
                    </h3>
                  </div>
                </div>



                {/* Day's Activities Timeline */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Curated Schedule &amp; Engagements ({currentDay.activities.length})
                  </h4>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {currentDay.activities.map((act) => (
                      <div key={act.id} className="relative group">
                        {/* Timeline dot */}
                        <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-white shadow-xs" />

                        <div className="bg-slate-50 hover:bg-amber-50/30 rounded-2xl p-4 border border-slate-200 transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {act.timeSlot || `${act.startTime} - ${act.endTime}`}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                              {act.category}
                            </span>
                          </div>

                          <h5 className="text-base font-bold text-slate-900">{act.title}</h5>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {act.description}
                          </p>

                          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200/60">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{act.location}</span>
                            {act.included && (
                              <span className="ml-auto text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                Included in Tour
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day's Featured Accommodation / Hotel Card */}
                {currentDayHotel && (
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-amber-600" />
                        <span>Featured Nightly Accommodation</span>
                      </h4>
                      <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                        Confirmed &bull; {currentDayHotel.boardBasis}
                      </span>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl overflow-hidden shadow-md border border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-3">
                        <div className="sm:col-span-1 h-44 sm:h-auto relative">
                          <img
                            src={currentDayHotel.imageUrl?.trim() || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'}
                            alt={currentDayHotel.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 flex text-amber-400 bg-black/60 px-2 py-1 rounded-md backdrop-blur-xs">
                            {Array.from({ length: currentDayHotel.starRating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400" />
                            ))}
                          </div>
                        </div>
                        <div className="sm:col-span-2 p-5 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="text-xs text-amber-400 font-semibold">
                              {currentDayHotel.roomType}
                            </div>
                            <h5 className="text-lg font-bold font-serif-display text-white mt-0.5">
                              {currentDayHotel.name}
                            </h5>
                            <div className="flex items-center text-xs text-slate-300 mt-1">
                              <MapPin className="w-3 h-3 text-amber-400 mr-1" />
                              <span>{currentDayHotel.address}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                              {currentDayHotel.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                            <div className="flex items-center space-x-3 text-xs text-slate-300">
                              <span>Check-in: <strong>{currentDayHotel.checkInTime}</strong></span>
                              <span>Ref: <strong>{currentDayHotel.confirmationRef}</strong></span>
                            </div>
                            <button
                              onClick={() => setSelectedHotelForModal(currentDayHotel)}
                              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <span>Explore Hotel &amp; Amenities</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Hotel Directory, Concierge Support, Inclusions (1 col) */}
        <div className="space-y-6">
          {/* Tour Director & 24/7 VIP Concierge Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Dedicated Tour Director & Concierge</span>
            </h3>

            <div className="flex items-center space-x-3 mb-4">
              {leadStaff.avatar && leadStaff.avatar.trim() ? (
                <img
                  src={leadStaff.avatar}
                  alt={leadStaff.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/20"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-lg flex items-center justify-center uppercase shadow-sm">
                  {leadStaff.name ? leadStaff.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'TD'}
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold text-slate-900">{leadStaff.name}</h4>
                <div className="text-xs text-slate-500">{leadStaff.role}</div>
                <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                  Assigned 24/7 to your party
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center space-x-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-medium">{leadStaff.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-medium">{leadStaff.email}</span>
              </div>
            </div>
          </div>

          {/* Tour Inclusions & Peace of Mind */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Included In Your Private Package
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-700">
              {trip.inclusions.map((inc, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Selected Hotels Reference List */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Hotels on this Itinerary
            </h3>
            <div className="space-y-3">
              {(() => {
                const dayHotelsList: HotelInfo[] = [];
                trip.days.forEach((d) => {
                  if (d.hotelId && hotels.some((h) => h.id === d.hotelId)) {
                    const h = hotels.find((x) => x.id === d.hotelId)!;
                    if (!dayHotelsList.some((existing) => existing.id === h.id)) {
                      dayHotelsList.push(h);
                    }
                  } else if (d.hotelName && d.hotelName.trim()) {
                    if (
                      !dayHotelsList.some(
                        (existing) =>
                          existing.name.toLowerCase() === d.hotelName!.toLowerCase()
                      )
                    ) {
                      dayHotelsList.push({
                        id: d.hotelId || `hotel-name-${d.id}`,
                        name: d.hotelName,
                        city: trip.destination.split(',')[0]?.trim() || 'Local Area',
                        country: trip.destination.split(',')[1]?.trim() || '',
                        address: `${d.hotelName}, ${trip.destination}`,
                        starRating: 5,
                        imageUrl:
                          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
                        galleryUrls: [
                          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
                        ],
                        description: `Accommodations at ${d.hotelName}.`,
                        roomType: 'Deluxe Suite',
                        boardBasis: 'Bed & Breakfast',
                        amenities: ['Concierge Service', 'Breakfast Included'],
                        checkInTime: '15:00',
                        checkOutTime: '11:00',
                        contactPhone: '+972 2-555-0100',
                        pricePerNight: 450,
                        currency: trip.currency,
                      });
                    }
                  }
                });

                if (dayHotelsList.length === 0) {
                  return (
                    <div className="p-3 text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                      No hotels assigned to this itinerary yet.
                    </div>
                  );
                }

                return dayHotelsList.map((hotel) => (
                  <div
                    key={hotel.id}
                    onClick={() => setSelectedHotelForModal(hotel)}
                    className="p-3 bg-slate-50 hover:bg-amber-50/50 rounded-2xl border border-slate-200 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          hotel.imageUrl?.trim() ||
                          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'
                        }
                        alt={hotel.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-slate-900 line-clamp-1">
                          {hotel.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{hotel.city}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Hotel Detail Modal */}
      <HotelDetailModal
        hotel={selectedHotelForModal}
        onClose={() => setSelectedHotelForModal(null)}
      />

      {/* Share / Generate Live Client Link Modal */}
      <GenerateClientLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tripId={trip.id}
      />
    </div>
  );
};
