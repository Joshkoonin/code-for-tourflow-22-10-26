import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Trash2,
  Sparkles,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Itinerary } from '../../types';

interface ItineraryLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: Itinerary;
}

// Curated luxury partner / sponsor / agency logos for quick testing on itineraries
const PRESET_ITINERARY_LOGOS = [
  {
    name: 'Pizazz Israel Signature VIP',
    url: 'https://images.unsplash.com/photo-1544971587-b842c27f8e14?w=300&auto=format&fit=crop&q=80',
    tag: 'Gold Crest',
  },
  {
    name: 'Sterling Family Foundation Emblem',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80',
    tag: 'Private Family Seal',
  },
  {
    name: 'Swiss Alpine Luxury Voyages',
    url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300&auto=format&fit=crop&q=80',
    tag: 'Mountain Crest',
  },
  {
    name: 'Amalfi Executive Yacht Club',
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&auto=format&fit=crop&q=80',
    tag: 'Maritime Insignia',
  },
];

export const ItineraryLogoModal: React.FC<ItineraryLogoModalProps> = ({
  isOpen,
  onClose,
  itinerary,
}) => {
  const { updateItinerary } = useApp();

  const [inputUrl, setInputUrl] = useState(itinerary.logoUrl || '');
  const [previewError, setPreviewError] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setInputUrl(result);
      setPreviewError(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const logo = inputUrl.trim() || undefined;
    updateItinerary({
      ...itinerary,
      logoUrl: logo,
      lastUpdated: new Date().toISOString(),
    });
    setSuccessToast(`Custom logo updated for itinerary "${itinerary.title}"!`);
    setTimeout(() => {
      setSuccessToast(null);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setInputUrl('');
    updateItinerary({
      ...itinerary,
      logoUrl: undefined,
      lastUpdated: new Date().toISOString(),
    });
    setSuccessToast('Logo removed from this itinerary.');
    setTimeout(() => {
      setSuccessToast(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-black">
              <Compass className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900">
                  {itinerary.code}
                </span>
                <span className="text-xs text-slate-400 font-medium">Itinerary Branding</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                Place Logo on This Itinerary
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Place a dedicated or particular client logo, corporate badge, or partner insignia on <strong>{itinerary.title}</strong>. This logo is displayed in the Itinerary Design Studio, on the trips overview card, in the Live Client Portal, and on print/PDF dossiers.
        </p>

        {/* Live Preview */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs p-1">
              {inputUrl && !previewError ? (
                <img
                  src={inputUrl}
                  alt="Itinerary Logo Preview"
                  className="w-full h-full object-contain"
                  onError={() => setPreviewError(true)}
                />
              ) : (
                <div className="text-center p-1">
                  <ImageIcon className="w-6 h-6 text-slate-300 mx-auto" />
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">No Logo</span>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Logo Status</div>
              <div className="font-extrabold text-xs text-slate-900 truncate">
                {inputUrl ? 'Particular Logo Assigned' : 'No Specific Logo (Standard)'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Appears on hero header &amp; client dossier
              </div>
            </div>
          </div>

          {inputUrl && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Logo</span>
            </button>
          )}
        </div>

        {successToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* File Upload Option */}
          <div>
            <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
              Upload Logo File (From Computer)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-amber-950 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-amber-600" />
              <span>Click to Upload Logo File (PNG, SVG, JPG, WebP)</span>
            </button>
          </div>

          {/* Or Paste URL Option */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase">
                Or Enter / Paste Logo Web URL
              </label>
              {inputUrl && (
                <button
                  type="button"
                  onClick={() => setPreviewError(false)}
                  className="text-[10px] text-amber-700 hover:underline flex items-center gap-0.5"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh Preview
                </button>
              )}
            </div>
            <input
              type="url"
              placeholder="https://example.com/client-logo.png"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setPreviewError(false);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
            />
          </div>

          {/* Preset Samples */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Or Pick a Preset Client / Partner Badge:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_ITINERARY_LOGOS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputUrl(preset.url);
                    setPreviewError(false);
                  }}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    inputUrl === preset.url
                      ? 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-400'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-7 h-7 rounded-lg object-cover shrink-0 ring-1 ring-slate-200"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold text-slate-800 truncate">
                      {preset.name}
                    </div>
                    <div className="text-[9px] text-slate-500">{preset.tag}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Itinerary Logo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
