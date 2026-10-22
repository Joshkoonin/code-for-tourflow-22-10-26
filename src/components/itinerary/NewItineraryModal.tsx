import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  X,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Upload,
  Image as ImageIcon,
  Camera,
  Check,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Building,
  Building2,
  Compass,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CurrencyCode, Itinerary } from '../../types';
import { CURATED_HERO_PRESETS } from './ItineraryHeroPhotoModal';
import { compressImageToWebBanner } from '../../utils/imageUtils';

interface NewItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (tripId: string) => void;
  initialDate?: string;
}

export const NewItineraryModal: React.FC<NewItineraryModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialDate,
}) => {
  const { addClient, clients, addItinerary, staff } = useApp();

  // Wizard Step: 'ask_hero' (Hero Photo Step) | 'details' (Tour dossier details)
  const [currentStep, setCurrentStep] = useState<'ask_hero' | 'details'>('ask_hero');
  const [activeUploadTab, setActiveUploadTab] = useState<'upload' | 'presets' | 'url'>('upload');

  // Hero Image states
  const [heroImage, setHeroImage] = useState<string>(CURATED_HERO_PRESETS[0].url);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const step2FileInputRef = useRef<HTMLInputElement | null>(null);

  // Tour metadata fields
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(
    initialDate || new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]
  );
  const [partySize, setPartySize] = useState(2);
  const [totalPrice, setTotalPrice] = useState(18500);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [isQuickAddClientOpen, setIsQuickAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [leadStaffId, setLeadStaffId] = useState(staff[0]?.id || '');
  const [daysCount, setDaysCount] = useState(5);
  const [guideName, setGuideName] = useState('Dr. Avi Ron');
  const [driverName, setDriverName] = useState('Ehud Luxury Chauffeur Fleet');
  const [overview, setOverview] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [newInclusionInput, setNewInclusionInput] = useState('');
  const [newHighlightInput, setNewHighlightInput] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Reset state when modal is opened afresh
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('ask_hero');
      setActiveUploadTab('upload');
      setUploadError(null);
      if (initialDate) {
        setStartDate(initialDate);
      }
    }
  }, [isOpen, initialDate]);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP, AVIF, GIF).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Image size exceeds 25MB limit. Please choose a smaller photo.');
      return;
    }
    setUploadError(null);
    setIsCompressing(true);

    try {
      // Compress and resize client-side to ensure sharp banner without exceeding Firestore 1MB doc limit
      const compressedDataUrl = await compressImageToWebBanner(file, 1600, 900, 0.85);
      setHeroImage(compressedDataUrl);
      setUploadedFileName(file.name);
      setUploadedFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      setIsCompressing(false);
    } catch (err) {
      console.error('Error compressing image:', err);
      // Fallback to raw FileReader
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
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleQuickAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    const newId = `client-${Date.now()}`;
    const newClient = {
      id: newId,
      name: newClientName.trim(),
      email: newClientEmail.trim() || 'guest@vip-travel.com',
      phone: newClientPhone.trim() || '+1 555-0199',
      nationality: 'International',
      dietaryRestrictions: [],
      preferences: ['Luxury Suite', 'Private Transport'],
      emergencyContact: {
        name: 'Family Contact',
        phone: newClientPhone.trim() || '+1 555-0199',
        relationship: 'Primary Contact',
      },
      notes: 'Added during Tour Itinerary creation',
      createdAt: new Date().toISOString().split('T')[0],
      vipTier: 'Gold VIP',
    };
    addClient(newClient);
    setClientId(newId);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setIsQuickAddClientOpen(false);
  };

  const handleAddHighlight = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newHighlightInput.trim();
    if (!trimmed) return;
    if (!highlights.includes(trimmed)) {
      setHighlights([...highlights, trimmed]);
    }
    setNewHighlightInput('');
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const handleAddInclusion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newInclusionInput.trim();
    if (!trimmed) return;
    if (!inclusions.includes(trimmed)) {
      setInclusions([...inclusions, trimmed]);
    }
    setNewInclusionInput('');
  };

  const handleRemoveInclusion = (index: number) => {
    setInclusions(inclusions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim()) {
      alert('Please provide both Tour Name and Destination.');
      return;
    }

    // Generate initial days
    const days = [];
    const start = new Date(startDate);

    for (let i = 1; i <= daysCount; i++) {
      const curDate = new Date(start);
      curDate.setDate(curDate.getDate() + (i - 1));
      const dateStr = curDate.toISOString().split('T')[0];

      days.push({
        id: `day-${Date.now()}-${i}`,
        dayNumber: i,
        date: dateStr,
        title: `Day ${i}: Highlights & Exploration`,
        summary: '',
        hotelId: undefined,
        hotelName: undefined,
        activities: [
          {
            id: `act-${Date.now()}-${i}-1`,
            timeSlot: '09:30 - 12:30',
            startTime: '09:30',
            endTime: '12:30',
            title: 'Curated Morning Walking & Cultural Seminar',
            description: 'Private escorted visit with priority fast-track access.',
            location: destination.trim(),
            included: true,
            costEstimate: 350,
            currency,
            category: 'Sightseeing' as const,
          },
        ],
      });
    }

    const endD = new Date(start);
    endD.setDate(endD.getDate() + (daysCount - 1));

    const newTrip: Itinerary = {
      id: `trip-${Date.now()}`,
      code: `TO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      title: title.trim(),
      tourName: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate: endD.toISOString().split('T')[0],
      clientId,
      leadStaffId: leadStaffId || staff[0]?.id || '',
      partySize: Number(partySize),
      currency,
      totalClientPrice: Number(totalPrice),
      depositRequired: Math.round(Number(totalPrice) * 0.4),
      heroImage: heroImage.trim() || CURATED_HERO_PRESETS[0].url,
      logoUrl: logoUrl.trim() || undefined,
      guideName: guideName.trim() || undefined,
      driverName: driverName.trim() || undefined,
      status: 'Proposed',
      overview: overview.trim(),
      highlights: highlights,
      inclusions: inclusions,
      exclusions: ['International business class flights', 'Discretionary gratuities'],
      days,
      generalProjectedCosts: [],
      lastUpdated: new Date().toISOString(),
    };

    addItinerary(newTrip);
    onCreated(newTrip.id);
    onClose();
  };

  const selectedClient = clients.find((c) => c.id === clientId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-scale-in">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                New Journey Dossier
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Step {currentStep === 'ask_hero' ? '1' : '2'} of 2
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              {currentStep === 'ask_hero' ? 'Start Creating New Itinerary' : 'Tour Details & Configuration'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Tracker with working Hero Banner Photo button */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setCurrentStep('ask_hero');
              setActiveUploadTab('upload');
            }}
            className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
              currentStep === 'ask_hero'
                ? 'bg-amber-500/15 border-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-400/30'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Click to manage or upload hero banner photo"
          >
            <Camera className="w-4 h-4 text-amber-600" />
            <span>1. Hero Banner Photo</span>
            {uploadedFileName && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Photo Uploaded" />
            )}
          </button>
          <div className="text-slate-300 font-bold">&rarr;</div>
          <button
            type="button"
            onClick={() => setCurrentStep('details')}
            className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
              currentStep === 'details'
                ? 'bg-amber-500/15 border-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-400/30'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>2. Tour Info &amp; Financials</span>
          </button>
        </div>

        {/* Global Hidden File Input for Hero Banner Photo */}
        <input
          id="new-itinerary-hero-file-input"
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        {/* STEP 1: Ask if user would like to upload a photo to serve as hero image */}
        {currentStep === 'ask_hero' && (
          <div className="space-y-4 animate-fade-in">
            {/* The Dedicated Question Box */}
            <div className="p-4 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-slate-50 border border-amber-200/90 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0 mt-0.5">
                  <Camera className="w-5 h-5 text-slate-950" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                    Hero Photo Setup
                  </span>
                  <h4 className="text-base font-black text-slate-900 leading-snug">
                    Would you like to upload a photo to serve as the hero image at the top of the itinerary?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The hero image is the premier panoramic visual banner displayed at the very top of the live client portal, mobile viewer, and printed journey dossier.
                  </p>
                </div>
              </div>

              {/* Action Buttons to answer the question */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <label
                  htmlFor="new-itinerary-hero-file-input"
                  onClick={() => setActiveUploadTab('upload')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    activeUploadTab === 'upload'
                      ? 'bg-white border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                      : 'bg-white/80 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Yes, Upload Photo from Computer</span>
                      {uploadedFileName && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Click to browse or drop file (JPG, PNG, WebP)
                    </div>
                  </div>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('details');
                  }}
                  className="p-3 rounded-xl border border-slate-200 bg-white/80 hover:bg-white hover:border-slate-300 text-left transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-amber-100 group-hover:text-amber-800">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <span>No, proceed with default photo</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Use standard scenic photo &amp; enter tour details
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Means to Upload: File Upload, Presets, or Web URL */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3.5">
              {/* Tabs for choosing means */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveUploadTab('upload')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
                      activeUploadTab === 'upload'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Local Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveUploadTab('presets')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
                      activeUploadTab === 'presets'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Curated Luxury Presets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveUploadTab('url')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
                      activeUploadTab === 'url'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Paste Image URL</span>
                  </button>
                </div>

                {uploadedFileName && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Photo Uploaded
                  </span>
                )}
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Upload Tab */}
              {activeUploadTab === 'upload' && (
                <div className="space-y-3">
                  <label
                    htmlFor="new-itinerary-hero-file-input"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all block ${
                      isDragging
                        ? 'border-amber-500 bg-amber-50 scale-[1.01]'
                        : 'border-slate-300 hover:border-amber-400 hover:bg-amber-50/40 bg-slate-50/60'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2 shadow-xs mx-auto">
                      <Camera className="w-6 h-6 text-amber-700" />
                    </div>
                    <p className="text-xs font-black text-slate-900">
                      {isCompressing ? 'Optimizing photo for web banner...' : 'Click to choose photo or drag & drop file here'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                      Supports JPG, PNG, WebP, AVIF up to 25MB. Automatically formatted as the wide panoramic hero banner at the top of your itinerary.
                    </p>
                    <div className="mt-3.5 flex items-center justify-center gap-2">
                      <span className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Select Photo from Computer</span>
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {/* Presets Tab */}
              {activeUploadTab === 'presets' && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-500">
                    Select one of our curated high-resolution destination banners:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto p-1">
                    {CURATED_HERO_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setHeroImage(p.url);
                          setUploadedFileName(null);
                          setUploadError(null);
                          if (!destination.trim()) {
                            setDestination(p.destination);
                          }
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

              {/* URL Tab */}
              {activeUploadTab === 'url' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase block">
                    Direct Image Web Link
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
                    Paste any direct image link from Unsplash, agency photo library, or CDN.
                  </p>
                </div>
              )}

              {/* Live Preview of the Selected / Uploaded Hero Image */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="uppercase text-[10px] tracking-wider text-slate-400">
                    Live Preview &bull; Top of Itinerary Header Banner
                  </span>
                  {uploadedFileName ? (
                    <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Uploaded: {uploadedFileName} ({uploadedFileSize})
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">Standard / Preset Photo</span>
                  )}
                </div>

                <div className="relative h-36 sm:h-44 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner group">
                  <img
                    src={heroImage}
                    alt="Hero Banner Preview"
                    className="w-full h-full object-cover object-center filter brightness-90 group-hover:scale-102 transition-transform duration-700"
                    onError={() => setUploadError('Image link could not be loaded. Please choose another.')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent flex flex-col justify-end p-3.5 text-white">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md inline-block w-max">
                      Top of Itinerary Hero Banner
                    </span>
                    <h5 className="text-sm sm:text-base font-black text-white mt-1 drop-shadow-md truncate">
                      {title.trim() || 'Your Tour Name Will Appear Here'}
                    </h5>
                    <p className="text-[10px] text-slate-300 font-medium truncate">
                      {destination.trim() || 'Curated VIP Destination'} &bull; Displayed at top of live client view &amp; dossier
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('details')}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Tour Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Tour Details & Configuration */}
        {currentStep === 'details' && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            {/* Top Compact Hero Banner Status Bar */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-16 h-11 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-300 shadow-xs">
                  <img
                    src={heroImage}
                    alt="Hero Thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Hero Image (Top of Itinerary)
                  </div>
                  <div className="text-xs font-black text-slate-900 truncate flex items-center gap-1.5">
                    {uploadedFileName ? (
                      <>
                        <span className="text-emerald-700">Custom Photo:</span>
                        <span className="truncate">{uploadedFileName}</span>
                      </>
                    ) : (
                      <span>Curated Luxury Destination Photo</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  id="step2-hero-file-input"
                  type="file"
                  ref={step2FileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="step2-hero-file-input"
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-600" />
                  <span>Upload Photo</span>
                </label>
                <button
                  type="button"
                  onClick={() => setCurrentStep('ask_hero')}
                  className="px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
                >
                  Change Photo
                </button>
              </div>
            </div>

            {/* Tour Name Field */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Tour Name *
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Unique title for this tour</span>
              </div>
              <input
                type="text"
                required
                placeholder="e.g. 7-Day Swiss Alps Grand Retreat & Helitour"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Client Assignment Section */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  <span>Assign to Client *</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickAddClientOpen(!isQuickAddClientOpen)}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isQuickAddClientOpen ? 'Cancel' : 'Quick Add New Client'}</span>
                </button>
              </div>

              {isQuickAddClientOpen ? (
                <div className="p-3 bg-white border border-amber-300 rounded-xl space-y-2 animate-fadeIn">
                  <div className="text-[11px] font-bold text-amber-900">Create &amp; Assign New Client:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Full Name *"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsQuickAddClientOpen(false)}
                      className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAddClient}
                      disabled={!newClientName.trim()}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Save &amp; Select Client
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                  >
                    {clients.length === 0 ? (
                      <option value="">-- No clients registered (Click Quick Add) --</option>
                    ) : (
                      clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} &mdash; {c.email} ({c.vipTier || 'VIP'})
                        </option>
                      ))
                    )}
                  </select>
                  {selectedClient && (
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 px-1">
                      <span>
                        Contact: <strong className="text-slate-800">{selectedClient.phone || 'No phone'}</strong> &bull; {selectedClient.email}
                      </span>
                      <span className="text-amber-700 font-semibold">{selectedClient.vipTier || 'VIP'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Destination *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Andermatt & Zurich (Switzerland)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">
                Dedicated Tour Concierge
              </label>
              <select
                value={leadStaffId}
                onChange={(e) => setLeadStaffId(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium cursor-pointer"
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} &bull; {s.role} ({s.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600 uppercase">
                  Journey Overview (Bespoke Client Narrative)
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Custom text for VIP proposal</span>
              </div>
              <textarea
                rows={2}
                placeholder="Write your bespoke journey overview for the client rather than pre-populating generic themes..."
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-600 uppercase">
                  Included in your private package (Inclusions) *
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Add all items included in the journey price</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type inclusion and click Add..."
                  value={newInclusionInput}
                  onChange={(e) => setNewInclusionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddInclusion();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-amber-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddInclusion()}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
              {highlights.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {highlights.map((h, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-950 text-xs rounded-lg"
                    >
                      <span>{h}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(i)}
                        className="text-amber-700 hover:text-red-600 font-bold ml-1 cursor-pointer"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic mt-1">
                  No signature highlights added. The client view will show a clean layout without forced themes.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Days Duration</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={daysCount}
                  onChange={(e) => setDaysCount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Party Size</label>
                <input
                  type="number"
                  min={1}
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            {/* Guide & Driver Assignment Section */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2.5">
              <div className="flex items-center space-x-1.5 text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                <span>Tour Operations Crew: Guide &amp; Chauffeur</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase">Dedicated Tour Guide</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Avi Ron"
                    value={guideName}
                    onChange={(e) => setGuideName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase">Dedicated Chauffeur / Driver</label>
                  <input
                    type="text"
                    placeholder="e.g. Ehud Luxury Fleet"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Package Price</label>
                <input
                  type="number"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Billing Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="ILS">ILS (₪)</option>
                  <option value="CHF">CHF (Fr)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">
                Particular Itinerary Logo URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com/client-or-partner-logo.png (leave blank if none)"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            {/* Modal Bottom Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep('ask_hero')}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Hero Photo</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Create Tour Itinerary &amp; Open Designer</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
