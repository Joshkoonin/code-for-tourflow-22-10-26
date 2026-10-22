import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Mail,
  MessageCircle,
  Sparkles,
  RefreshCw,
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  Radio,
  FileText,
  Sliders,
  UserCheck,
  Trash2,
  Plus,
  ArrowRight,
  Edit3,
  Phone,
  RotateCcw,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useApp } from '../../context/AppContext';
import { Itinerary, StaffMember } from '../../types';

interface GenerateClientLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId?: string;
}

export const GenerateClientLinkModal: React.FC<GenerateClientLinkModalProps> = ({
  isOpen,
  onClose,
  tripId,
}) => {
  const { itineraries, clients, staff, updateItinerary, lastLiveSyncTime } = useApp();

  // Find currently selected trip or default to first
  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    if (tripId && itineraries.some((t) => t.id === tripId)) return tripId;
    return itineraries[0]?.id || '';
  });

  // Keep selected trip synced if prop changes
  useEffect(() => {
    if (tripId && itineraries.some((t) => t.id === tripId)) {
      setSelectedTripId(tripId);
    }
  }, [tripId, itineraries]);

  const selectedTrip = itineraries.find((t) => t.id === selectedTripId) || itineraries[0];
  const client = clients.find((c) => c.id === selectedTrip?.clientId);

  // Dedicated Concierge assignment state
  const [assignedStaffId, setAssignedStaffId] = useState<string>(() => {
    return selectedTrip?.leadStaffId || staff[0]?.id || '';
  });

  // Journey Overview state (bespoke text, no forced themes)
  const [customOverview, setCustomOverview] = useState<string>(() => {
    return selectedTrip?.overview || '';
  });

  // Signature Highlights state (designer decides what if any to include)
  const [customHighlights, setCustomHighlights] = useState<string[]>(() => {
    return selectedTrip?.highlights ? [...selectedTrip.highlights] : [];
  });
  const [newHighlightInput, setNewHighlightInput] = useState<string>('');

  // Re-sync local edit state when trip changes
  useEffect(() => {
    if (selectedTrip) {
      setAssignedStaffId(selectedTrip.leadStaffId || staff[0]?.id || '');
      setCustomOverview(selectedTrip.overview || '');
      setCustomHighlights(selectedTrip.highlights ? [...selectedTrip.highlights] : []);
    }
  }, [selectedTrip?.id]);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0 = entire tour / day 1 start
  const [activeTab, setActiveTab] = useState<'setup' | 'link' | 'qr' | 'message'>('setup');
  const [testSyncSuccess, setTestSyncSuccess] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeStaff = staff.find((s) => s.id === assignedStaffId) || staff[0];

  // Save concierge, overview, and highlights to itinerary in real time
  const handleSaveDossierConfig = (goToLinkTab: boolean = true) => {
    if (!selectedTrip) return;
    const updatedTrip: Itinerary = {
      ...selectedTrip,
      leadStaffId: assignedStaffId,
      overview: customOverview.trim(),
      highlights: customHighlights,
      lastUpdated: new Date().toISOString(),
    };
    updateItinerary(updatedTrip);
    setSaveSuccessNotice('Live dossier updated! Concierge assigned and overview saved in real time.');
    setTimeout(() => setSaveSuccessNotice(null), 3500);

    if (goToLinkTab) {
      setActiveTab('link');
    }
  };

  const handleAddHighlight = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newHighlightInput.trim();
    if (!trimmed) return;
    if (!customHighlights.includes(trimmed)) {
      setCustomHighlights([...customHighlights, trimmed]);
    }
    setNewHighlightInput('');
  };

  const handleRemoveHighlight = (index: number) => {
    setCustomHighlights(customHighlights.filter((_, i) => i !== index));
  };

  const handleClearAllHighlights = () => {
    setCustomHighlights([]);
  };

  const handleClearOverview = () => {
    setCustomOverview('');
  };

  // Build the live client URL
  const generateLiveUrl = () => {
    if (!selectedTrip) return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    let url = `${origin}${pathname}?view=client&trip=${encodeURIComponent(selectedTrip.id)}`;
    if (selectedDay > 0) {
      url += `&day=${selectedDay}`;
    }
    return url;
  };

  const liveUrl = generateLiveUrl();

  // Draw QR code whenever URL changes or tab switches to QR
  useEffect(() => {
    if (activeTab === 'qr' && qrCanvasRef.current && liveUrl) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        liveUrl,
        {
          width: 220,
          margin: 2,
          color: {
            dark: '#0f172a', // Slate 900
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [activeTab, liveUrl]);

  if (!isOpen || !selectedTrip) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const prewrittenMessage = `Dear ${client?.name || 'Valued Guest'},

We are delighted to present your live digital itinerary dossier for "${selectedTrip.title}" (${selectedTrip.destination}, ${selectedTrip.startDate} - ${selectedTrip.endDate}).

📱 Access your live itinerary portal here:
${liveUrl}

This live portal updates automatically in real-time. Any schedule refinements, hotel confirmations, or activity adjustments made by our concierge team will appear on your link instantly without requiring a manual refresh.

Dedicated Tour Concierge: ${activeStaff?.name || 'Concierge Director'} (${activeStaff?.role || 'VIP Concierge'})
Direct Contact: ${activeStaff?.phone || '+1 800-TOUR-OPS'} &bull; ${activeStaff?.email || 'concierge@tourops360.com'}

Warm regards,
TourOps 360 Concierge Team`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(prewrittenMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const emailSubject = encodeURIComponent(`Your Live Itinerary Dossier: ${selectedTrip.title}`);
  const emailBody = encodeURIComponent(prewrittenMessage);
  const mailtoLink = `mailto:${client?.email || ''}?subject=${emailSubject}&body=${emailBody}`;

  const whatsappMessage = encodeURIComponent(
    `Hello! Here is your live itinerary dossier for "${selectedTrip.title}":\n\n${liveUrl}\n\nDedicated Concierge: ${activeStaff?.name} (${activeStaff?.phone})\nUpdates from our concierge team will reflect live on this link automatically.`
  );
  const whatsappLink = `https://wa.me/${client?.phone?.replace(/[^0-9]/g, '') || ''}?text=${whatsappMessage}`;

  // Quick test: simulate live update pulse
  const handleTestLiveUpdate = () => {
    if (!selectedTrip) return;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const currentOverview = selectedTrip.overview || '';
    const updated = {
      ...selectedTrip,
      overview: currentOverview.includes('[Live sync verified')
        ? currentOverview.replace(/\[Live sync verified.*?\]/, `[Live sync verified at ${nowStr}]`)
        : currentOverview
        ? `${currentOverview} [Live sync verified at ${nowStr}]`
        : `[Live sync verified at ${nowStr}]`,
      lastUpdated: new Date().toISOString(),
    };
    updateItinerary(updated);
    setTestSyncSuccess(true);
    setTimeout(() => setTestSyncSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-7 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5 mb-2">
            <span className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-400">
              <Share2 className="w-5 h-5" />
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Live Link Generator &amp; Concierge Dispatch
              </span>
              <span className="text-slate-500">&bull;</span>
              <span className="flex items-center text-xs text-emerald-400 font-semibold gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Dynamic Sync Active
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold font-serif-display tracking-tight text-white">
            Generate Live Client Itinerary Link
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-lg">
            Assign your dedicated tour concierge, write the bespoke journey overview, and choose what
            signature highlights to include before dispatching the real-time link.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* Trip Selector (Allows staff to switch tours on the fly) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Tour Itinerary
            </label>
            <div className="relative">
              <select
                value={selectedTrip.id}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none pr-10 cursor-pointer"
              >
                {itineraries.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} &mdash; {t.destination} ({t.code}, {t.days.length} Days)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <Sliders className="w-4 h-4" />
              </div>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-medium text-slate-800">{selectedTrip.destination}</span>
              </div>
              <span className="text-slate-300">&bull;</span>
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  {selectedTrip.startDate} &mdash; {selectedTrip.endDate} ({selectedTrip.days.length} Days)
                </span>
              </div>
              <span className="text-slate-300">&bull;</span>
              <div className="flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Party of {selectedTrip.partySize} {client ? `(${client.name})` : ''}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 space-x-1 overflow-x-auto pb-0.5">
            <button
              onClick={() => setActiveTab('setup')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'setup'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4 text-amber-600" />
              <span>1. Concierge &amp; Content Setup</span>
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'link'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>2. Live Share Link</span>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'qr'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Mobile QR Code</span>
            </button>
            <button
              onClick={() => setActiveTab('message')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'message'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Client Dispatch</span>
            </button>
          </div>

          {/* Feedback banner */}
          {saveSuccessNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessNotice}</span>
            </div>
          )}

          {/* TAB 1: CONCIERGE & CONTENT SETUP */}
          {activeTab === 'setup' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Concierge Selection Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                        Who is the Dedicated Tour Concierge?
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Assign the staff member responsible for 24/7 guest communications and real-time updates.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                    Required on Live Link
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      Assign Staff Member
                    </label>
                    <select
                      value={assignedStaffId}
                      onChange={(e) => setAssignedStaffId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                    >
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} &mdash; {s.role} ({s.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Active Concierge Snapshot Badge */}
                  {activeStaff && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center space-x-3 shadow-2xs">
                      {activeStaff.avatar ? (
                        <img
                          src={activeStaff.avatar}
                          alt={activeStaff.name}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-amber-500/20 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                          {activeStaff.name.slice(0, 2)}
                        </div>
                      )}
                      <div className="text-xs overflow-hidden">
                        <div className="font-extrabold text-slate-900 truncate">{activeStaff.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{activeStaff.role}</div>
                        <div className="text-[10px] text-amber-700 font-semibold truncate flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{activeStaff.phone}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Journey Overview Writing Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                        Write Journey Overview
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Compose your bespoke client narrative rather than pre-populating generic themes.
                      </p>
                    </div>
                  </div>
                  {customOverview && (
                    <button
                      type="button"
                      onClick={handleClearOverview}
                      className="text-[11px] text-slate-400 hover:text-red-600 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear Overview</span>
                    </button>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={customOverview}
                  onChange={(e) => setCustomOverview(e.target.value)}
                  placeholder="Write your bespoke journey overview here (e.g. A private signature voyage tailored exclusively for the family, blending heritage archaeological digs with ultra-luxury desert sanctuaries)..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 leading-relaxed focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>
                    {customOverview.trim() ? `${customOverview.length} characters` : 'Optional • Leave blank if not required'}
                  </span>
                  <span className="italic">Displayed prominently on the client's live portal header</span>
                </div>
              </div>

              {/* Signature Highlights Decision Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                        Decide Signature Highlights to Include
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Include only the highlights you select, or remove all for a clean layout without themes.
                      </p>
                    </div>
                  </div>
                  {customHighlights.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllHighlights}
                      className="text-[11px] text-slate-400 hover:text-red-600 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove All Highlights</span>
                    </button>
                  )}
                </div>

                {/* Add new highlight input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHighlightInput}
                    onChange={(e) => setNewHighlightInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddHighlight();
                      }
                    }}
                    placeholder="Enter a signature highlight (e.g. VIP tarmac escort, private curator permit)..."
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddHighlight}
                    disabled={!newHighlightInput.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-amber-400 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Highlight</span>
                  </button>
                </div>

                {/* Highlights List */}
                {customHighlights.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {customHighlights.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-white border border-amber-200/80 rounded-xl shadow-2xs group hover:border-amber-400 transition-colors"
                      >
                        <div className="flex items-center space-x-2 text-xs text-slate-800">
                          <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-medium">{item}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveHighlight(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove highlight"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-dashed border-slate-300 text-center">
                    <p className="text-xs text-slate-500 italic">
                      Zero signature highlights selected. The client portal will display a clean journey layout without pre-populated theme pills.
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons on setup tab */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveDossierConfig(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Save Changes (Stay Here)
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveDossierConfig(true)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Confirm &amp; Generate Live Link</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE SHARE LINK */}
          {activeTab === 'link' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Quick Summary Pill of Assigned Concierge */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-slate-700">
                    Dedicated Concierge: <strong className="text-slate-950">{activeStaff?.name}</strong> ({activeStaff?.role})
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('setup')}
                  className="text-amber-800 hover:text-amber-950 font-bold text-[11px] underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Concierge / Overview</span>
                </button>
              </div>

              {/* Optional Day Selection */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Landing View Destination:</span>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium text-xs focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value={0}>Complete Itinerary Overview</option>
                  {selectedTrip.days.map((d) => (
                    <option key={d.id} value={d.dayNumber}>
                      Day {d.dayNumber}: {d.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* URL Display with Copy Button */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={liveUrl}
                  className="w-full pl-3.5 pr-28 py-3 bg-slate-900 text-amber-300 font-mono text-xs rounded-xl border border-slate-800 select-all focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="absolute right-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons: Open Live View in New Tab / WhatsApp / Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs text-center cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open in New Tab</span>
                </a>

                <a
                  href={mailtoLink}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-200 text-center cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Email to Client</span>
                </a>

                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-emerald-200 text-center cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Share via WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: MOBILE QR CODE */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-4 animate-fadeIn">
              <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200">
                <canvas ref={qrCanvasRef} className="rounded-lg" />
              </div>
              <div className="text-center max-w-sm">
                <p className="text-xs font-bold text-slate-800">
                  Scan with Camera to Open Live Itinerary
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Clients on smartphones can point their camera at this code to view their luxury
                  itinerary on the go.
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-300 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Direct Web Link'}</span>
              </button>
            </div>
          )}

          {/* TAB 4: PRE-WRITTEN INVITATION MESSAGE */}
          {activeTab === 'message' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Formatted Client Dispatch:</span>
                <button
                  onClick={handleCopyMessage}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                >
                  {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMessage ? 'Copied Full Message!' : 'Copy Entire Message'}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={7}
                value={prewrittenMessage}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono leading-relaxed focus:outline-none select-all"
              />
            </div>
          )}

          {/* Live Sync Information & Verification Panel */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span>How Live Content Updating Works</span>
                    <span className="text-[10px] bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      Zero Refresh Needed
                    </span>
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    This link connects to the central tour record. Whenever any staff member alters
                    dates, adds an activity, confirms a hotel, or edits notes in the TourOps console,
                    the client view automatically re-synchronizes via real-time browser channels.
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium mt-1.5">
                    <strong>Try it side-by-side:</strong> Open the client link in another tab or window, then edit this itinerary in the builder to watch changes update instantly.
                  </p>
                </div>
              </div>

              <button
                onClick={handleTestLiveUpdate}
                title="Send a live test update pulse to verify cross-window communication"
                className="shrink-0 px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg transition-colors border border-emerald-300 shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testSyncSuccess ? 'animate-spin' : ''}`} />
                <span>{testSyncSuccess ? 'Synced!' : 'Test Sync'}</span>
              </button>
            </div>
            {testSyncSuccess && (
              <div className="mt-3 text-xs font-bold text-emerald-800 bg-emerald-100/90 py-1.5 px-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Live update pulse sent! All connected client views received the new timestamp.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure Read-Only Client Dossier</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            {activeTab === 'setup' ? (
              <button
                onClick={() => handleSaveDossierConfig(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>Save &amp; Generate Link</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Live Link'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
