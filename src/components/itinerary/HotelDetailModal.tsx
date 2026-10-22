import React from 'react';
import {
  X,
  Star,
  MapPin,
  Clock,
  Phone,
  Wifi,
  Sparkles,
  ShieldCheck,
  Building,
  Check,
  ExternalLink,
} from 'lucide-react';
import { HotelInfo } from '../../types';
import { useApp } from '../../context/AppContext';

interface HotelDetailModalProps {
  hotel: HotelInfo | null;
  onClose: () => void;
}

export const HotelDetailModal: React.FC<HotelDetailModalProps> = ({ hotel, onClose }) => {
  const { hasFullFinancialView } = useApp();
  if (!hotel) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
        {/* Hero Gallery Banner */}
        <div className="relative h-72 w-full bg-slate-800">
          {(hotel.imageUrl && hotel.imageUrl.trim()) ? (
            <img
              src={hotel.imageUrl.trim()}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <span className="text-slate-400 font-bold text-lg">{hotel.name}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Hotel Title Over Hero */}
          <div className="absolute bottom-5 left-6 right-6 text-white">
            <div className="flex items-center space-x-2 mb-1.5">
              <div className="flex text-amber-400">
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-xs bg-amber-500/30 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {hotel.boardBasis}
              </span>
            </div>
            <h2 className="text-2xl font-bold font-serif-display drop-shadow-xs">
              {hotel.name}
            </h2>
            <div className="flex items-center text-xs text-slate-300 mt-1 space-x-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{hotel.address}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[calc(85vh-18rem)] overflow-y-auto">
          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Room Category
              </div>
              <div className="text-xs font-bold text-slate-900 mt-1 truncate">
                {hotel.roomType}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Check-in / Out
              </div>
              <div className="text-xs font-bold text-slate-900 mt-1">
                {hotel.checkInTime} / {hotel.checkOutTime}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Booking Reference
              </div>
              <div className="text-xs font-mono font-bold text-amber-700 mt-1">
                {hotel.confirmationRef || 'TO-DIRECT-CONFIRM'}
              </div>
            </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Star Rating
              </div>
              <div className="text-xs font-bold text-slate-900 mt-1">
                {hotel.starRating} ★ Luxury Rating
              </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Property Overview & Character
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">{hotel.description}</p>
          </div>

          {/* Amenities & Hotel Highlights */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Complimentary VIP Amenities & Inclusions</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {hotel.amenities.map((amenity, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 text-xs text-slate-800 bg-amber-50/50 border border-amber-100 px-3 py-2 rounded-lg"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Concierge Notes & Guest Arrival Briefing */}
          {hotel.conciergeNotes && (
            <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl border border-slate-800">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Concierge Protocol & Room Directives</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                {hotel.conciergeNotes}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Front Desk & Concierge Direct:</span>
                <span className="font-mono text-amber-300">{hotel.contactPhone}</span>
              </div>
            </div>
          )}

          {/* Gallery Thumbnails */}
          {hotel.galleryUrls && hotel.galleryUrls.filter(img => img && img.trim()).length > 1 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Property Gallery
              </div>
              <div className="grid grid-cols-3 gap-3">
                {hotel.galleryUrls.filter(img => img && img.trim()).map((img, i) => (
                  <img
                    key={i}
                    src={img.trim()}
                    alt={`${hotel.name} ${i + 1}`}
                    className="h-24 w-full object-cover rounded-xl border border-slate-200 shadow-2xs hover:opacity-90 transition-opacity"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-8 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Hotel verification status: <strong className="text-emerald-700">Contracted VIP Partner</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
