import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Trash2,
  Sparkles,
  Camera,
  RefreshCw,
  MapPin,
  ExternalLink,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Itinerary } from '../../types';
import { compressImageToWebBanner } from '../../utils/imageUtils';

interface ItineraryHeroPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: Itinerary;
}

export const CURATED_HERO_PRESETS = [
  {
    name: 'Swiss Alpine Luxury Panorama',
    destination: 'Swiss Alps & Zermatt',
    url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1600&auto=format&fit=crop&q=80',
    tag: 'Mountain Vista',
  },
  {
    name: 'Amalfi Coast Azure Waters',
    destination: 'Amalfi Coast & Positano, Italy',
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1600&auto=format&fit=crop&q=80',
    tag: 'Coastal Luxury',
  },
  {
    name: 'Kyoto Zen Garden & Bamboo Grove',
    destination: 'Kyoto & Arashiyama, Japan',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1600&auto=format&fit=crop&q=80',
    tag: 'Cultural Heritage',
  },
  {
    name: 'Serengeti Golden Sunset Safari',
    destination: 'Serengeti & Ngorongoro, Tanzania',
    url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600&auto=format&fit=crop&q=80',
    tag: 'Wilderness & Safari',
  },
  {
    name: 'French Riviera & Monaco Yacht Port',
    destination: 'French Riviera & Nice, France',
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1600&auto=format&fit=crop&q=80',
    tag: 'Mediterranean VIP',
  },
  {
    name: 'Santorini Sunset Caldera',
    destination: 'Oia & Santorini, Greece',
    url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&auto=format&fit=crop&q=80',
    tag: 'Aegean Sunset',
  },
  {
    name: 'Jerusalem Golden Citadel & Old City',
    destination: 'Jerusalem & Judean Hills',
    url: 'https://images.unsplash.com/photo-1544971587-b842c27f8e14?w=1600&auto=format&fit=crop&q=80',
    tag: 'Historic Citadel',
  },
  {
    name: 'Norwegian Majestic Fjords',
    destination: 'Geiranger & Flåm, Norway',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80',
    tag: 'Nordic Wonder',
  },
];

export const ItineraryHeroPhotoModal: React.FC<ItineraryHeroPhotoModalProps> = ({
  isOpen,
  onClose,
  itinerary,
}) => {
  const { updateItinerary } = useApp();

  const [heroImage, setHeroImage] = useState<string>(
    itinerary?.heroImage || CURATED_HERO_PRESETS[0].url
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state whenever modal opens or itinerary updates
  useEffect(() => {
    if (isOpen && itinerary) {
      setHeroImage(itinerary.heroImage || CURATED_HERO_PRESETS[0].url);
      setUploadedFileName(null);
      setUploadedFileSize(null);
      setUploadError(null);
      setSuccessToast(null);
      setActiveTab('upload');
    }
  }, [isOpen, itinerary?.id, itinerary?.heroImage]);

  if (!isOpen || !itinerary) return null;

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP, AVIF, GIF).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Image file is too large (max 25MB).');
      return;
    }
    setUploadError(null);
    setIsCompressing(true);

    try {
      const compressedDataUrl = await compressImageToWebBanner(file, 1600, 900, 0.85);
      setHeroImage(compressedDataUrl);
      setUploadedFileName(file.name);
      setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      setIsCompressing(false);
    } catch (err) {
      console.error('Error compressing image:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setHeroImage(result);
          setUploadedFileName(file.name);
          setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
        }
        setIsCompressing(false);
      };
      reader.onerror = () => {
        setUploadError('Failed to read image file. Please try again.');
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!heroImage || !heroImage.trim()) {
      setUploadError('Please select or upload an image.');
      return;
    }

    try {
      await updateItinerary({
        ...itinerary,
        heroImage: heroImage.trim(),
        lastUpdated: new Date().toISOString(),
      });
      setSuccessToast(`Hero photo updated for "${itinerary.title}"!`);
      setTimeout(() => {
        setSuccessToast(null);
        onClose();
      }, 500);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to update hero photo.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-black">
              <Camera className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900">
                  {itinerary.code}
                </span>
                <span className="text-xs text-slate-400 font-medium">Hero Image at Top of Itinerary</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                Change Hero Banner Photo
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Hero Banner Preview Mockup */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase">
            <span>Live Preview &bull; Top of Itinerary Banner</span>
            {uploadedFileName && (
              <span className="text-[11px] text-emerald-700 font-semibold normal-case flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Uploaded: {uploadedFileName} ({uploadedFileSize})
              </span>
            )}
          </div>
          <div className="relative h-44 sm:h-52 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-300 shadow-inner group">
            <img
              src={heroImage}
              alt="Hero Preview"
              className="w-full h-full object-cover object-center filter brightness-90 group-hover:scale-102 transition-transform duration-700"
              onError={() => setUploadError('Unable to render image from this source. Please choose another.')}
            />
            {/* Overlay simulation */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex flex-col justify-end p-4 text-white">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md inline-block w-max">
                {itinerary.code} &bull; {itinerary.destination}
              </span>
              <h4 className="text-base sm:text-lg font-black text-white mt-1 drop-shadow-md truncate">
                {itinerary.tourName || itinerary.title}
              </h4>
              <p className="text-[11px] text-slate-300 font-medium line-clamp-1">
                Top of itinerary header presentation for client portal &amp; print dossier
              </p>
            </div>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-200 gap-4 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'border-amber-600 text-amber-950'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo from Computer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'presets'
                ? 'border-amber-600 text-amber-950'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Luxury Presets</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`pb-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'url'
                ? 'border-amber-600 text-amber-950'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Web Image Link (URL)</span>
          </button>
        </div>

        {uploadError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {successToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <input
              id="itinerary-hero-file-input"
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <label
              htmlFor="itinerary-hero-file-input"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all block ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/80 scale-[1.01]'
                  : 'border-slate-300 hover:border-amber-400 hover:bg-slate-50 bg-slate-50/50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2 shadow-xs mx-auto">
                <Upload className="w-6 h-6 text-amber-700" />
              </div>
              <p className="text-xs font-bold text-slate-900">
                {isCompressing ? 'Optimizing photo for web banner...' : 'Click to browse or drag and drop your photo here'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports PNG, JPG, WebP, AVIF up to 25MB. Automatically formatted to panoramic hero aspect ratio.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer mx-auto">
                <Camera className="w-4 h-4 text-slate-950" />
                Browse Photo from Device
              </span>
            </label>
          </div>
        )}

        {activeTab === 'presets' && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-600">
              Select one of our high-definition luxury destination hero images:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
              {CURATED_HERO_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setHeroImage(p.url);
                    setUploadedFileName(null);
                    setUploadError(null);
                  }}
                  className={`group relative rounded-xl overflow-hidden border text-left cursor-pointer transition-all ${
                    heroImage === p.url
                      ? 'ring-2 ring-amber-500 border-amber-500 scale-[1.02]'
                      : 'border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <div className="h-16 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={p.url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-1.5 bg-white">
                    <p className="text-[10px] font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[9px] text-slate-500 truncate">{p.tag}</p>
                  </div>
                  {heroImage === p.url && (
                    <div className="absolute top-1 right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'url' && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase block">
              Image Web Address (URL)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={heroImage}
              onChange={(e) => {
                setHeroImage(e.target.value);
                setUploadedFileName(null);
                setUploadError(null);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Paste any secure image URL (Unsplash, company CDN, Dropbox direct link, etc.)
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4 text-amber-400" />
            <span>Apply Hero Photo to Itinerary</span>
          </button>
        </div>
      </div>
    </div>
  );
};
