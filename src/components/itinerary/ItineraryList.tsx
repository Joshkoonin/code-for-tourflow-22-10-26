import React, { useState } from 'react';
import {
  Calendar,
  Compass,
  MapPin,
  Plus,
  Users,
  ExternalLink,
  Edit,
  DollarSign,
  Receipt,
  Trash2,
  Copy,
  Sparkles,
  Share2,
  Briefcase,
  Camera,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Itinerary, TripStatus } from '../../types';
import { GenerateClientLinkModal } from './GenerateClientLinkModal';
import { ItineraryLogoModal } from './ItineraryLogoModal';
import { ItineraryHeroPhotoModal } from './ItineraryHeroPhotoModal';
import { Image as ImageIcon } from 'lucide-react';

interface ItineraryListProps {
  onOpenBuilder: (tripId: string) => void;
  onNewTrip: () => void;
}

export const ItineraryList: React.FC<ItineraryListProps> = ({ onOpenBuilder, onNewTrip }) => {
  const {
    itineraries,
    deleteItinerary,
    addItinerary,
    openClientPortal,
    clients,
    generateInvoiceFromItinerary,
    setActiveView,
    setSelectedTripId,
    hasFullFinancialView,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedTripForLink, setSelectedTripForLink] = useState<string | undefined>(undefined);
  const [selectedTripForLogo, setSelectedTripForLogo] = useState<Itinerary | null>(null);
  const [selectedTripForHero, setSelectedTripForHero] = useState<Itinerary | null>(null);

  const filteredTrips = itineraries.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  const handleDuplicate = (trip: Itinerary) => {
    const duplicated: Itinerary = {
      ...trip,
      id: `trip-${Date.now()}`,
      code: `TO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      title: `${trip.title} (Copy)`,
      status: 'Draft',
      lastUpdated: new Date().toISOString(),
    };
    addItinerary(duplicated);
  };

  const handleQuickInvoice = (tripId: string) => {
    generateInvoiceFromItinerary(tripId);
    setActiveView('invoicing');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Module 1: Itinerary OS
            </span>
            <span className="text-xs text-slate-500 font-medium">Live Synced Client Dossiers</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Tour Itineraries &amp; Projects
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Design multi-day luxury itineraries, allocate verified hotels, and share live-updating links with clients.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setSelectedTripForLink(undefined);
              setIsLinkModalOpen(true);
            }}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
            title="Generate live sharable link with real-time sync for any itinerary"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Generate Client Link</span>
          </button>
          <button
            onClick={onNewTrip}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Create New Itinerary</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        {['ALL', 'Confirmed', 'In Progress', 'Proposed', 'Draft', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === tab
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrips.map((trip) => {
          const client = clients.find((c) => c.id === trip.clientId);

          return (
            <div
              key={trip.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
            >
              <div>
                {/* Image Banner */}
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={trip.heroImage?.trim() || 'https://images.unsplash.com/photo-1544971587-b842c27f8e14?w=1200&auto=format&fit=crop&q=80'}
                    alt={trip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                  <div className="absolute top-3 left-3 flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/70 text-amber-300 backdrop-blur-xs">
                      {trip.code}
                    </span>
                    {trip.logoUrl && (
                      <span className="h-6 max-w-[80px] px-1.5 py-0.5 bg-white/95 rounded-md shadow-xs flex items-center justify-center backdrop-blur-xs" title="Custom Logo on Itinerary">
                        <img src={trip.logoUrl} alt="Itinerary Logo" className="max-h-5 max-w-[70px] object-contain" />
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-xs ${
                        trip.status === 'Confirmed'
                          ? 'bg-emerald-500/80 text-white'
                          : trip.status === 'In Progress'
                          ? 'bg-blue-500/80 text-white'
                          : 'bg-amber-500/80 text-slate-950'
                      }`}
                    >
                      {trip.status}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white flex items-end justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center text-xs text-slate-300 mb-0.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 mr-1 shrink-0" />
                        <span className="truncate">{trip.destination}</span>
                      </div>
                      <h3 className="text-base font-bold font-serif-display text-white line-clamp-1">
                        {trip.tourName || trip.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTripForHero(trip);
                      }}
                      className="px-2.5 py-1 bg-black/70 hover:bg-black/90 text-white text-[10px] font-bold rounded-lg backdrop-blur-xs border border-white/20 transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                      title="Upload or change hero banner photo for this tour"
                    >
                      <Camera className="w-3 h-3 text-amber-400" />
                      <span>Hero Banner</span>
                    </button>
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between text-slate-500 pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{trip.startDate} ({trip.days.length} Days)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{trip.partySize} Guests</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Client Contact
                    </span>
                    <span className="font-semibold text-slate-900 text-xs">
                      {client?.name || 'Private VIP Client'}
                    </span>
                  </div>

                  {hasFullFinancialView && (
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Package Price
                        </span>
                        <span className="text-sm font-extrabold text-emerald-700">
                          ${trip.totalClientPrice.toLocaleString()} {trip.currency}
                        </span>
                      </div>
                      <button
                        onClick={() => handleQuickInvoice(trip.id)}
                        className="text-xs text-amber-700 font-semibold hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Create Invoice</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => {
                      setSelectedTripForLink(trip.id);
                      setIsLinkModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                    title="Generate live sharable link with real-time updates and QR code"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Generate Link</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTripId(trip.id);
                      setActiveView('tour-management');
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs border border-slate-200 cursor-pointer"
                    title="Open specific Tour Management Area (Supplier invoices, income, and running P&L)"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Manage Tour</span>
                  </button>
                  <button
                    onClick={() => openClientPortal(trip.id)}
                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    title="View live client portal for this tour"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Live View</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setSelectedTripForHero(trip)}
                    className="p-1.5 hover:bg-amber-100 text-amber-800 rounded-lg transition-colors cursor-pointer"
                    title="Change or Upload Hero Photo for this Itinerary"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-700" />
                  </button>
                  <button
                    onClick={() => setSelectedTripForLogo(trip)}
                    className="p-1.5 hover:bg-amber-100 text-amber-800 rounded-lg transition-colors cursor-pointer"
                    title={trip.logoUrl ? "Change Itinerary Logo" : "Place Particular Logo on this Itinerary"}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenBuilder(trip.id)}
                    className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    title="Edit Itinerary"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(trip)}
                    className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    title="Duplicate Itinerary"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteItinerary(trip.id)}
                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                    title="Delete Itinerary"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generate Live Client Link Modal */}
      <GenerateClientLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        tripId={selectedTripForLink}
      />

      {/* Place Particular Logo on Itinerary Modal */}
      {selectedTripForLogo && (
        <ItineraryLogoModal
          isOpen={Boolean(selectedTripForLogo)}
          onClose={() => setSelectedTripForLogo(null)}
          itinerary={selectedTripForLogo}
        />
      )}

      {/* Change / Upload Hero Photo on Itinerary Modal */}
      {selectedTripForHero && (
        <ItineraryHeroPhotoModal
          isOpen={Boolean(selectedTripForHero)}
          onClose={() => setSelectedTripForHero(null)}
          itinerary={selectedTripForHero}
        />
      )}
    </div>
  );
};
