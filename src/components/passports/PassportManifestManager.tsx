import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  Edit3,
  ShieldCheck,
  Compass,
  MapPin,
  Clock,
  Sparkles,
  Info,
  ChevronDown,
  Globe,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ItineraryPassport, Itinerary } from '../../types';

const POPULAR_NATIONALITIES = [
  'American',
  'British',
  'French',
  'Israeli',
  'German',
  'Swiss',
  'Canadian',
  'Australian',
  'Italian',
  'Spanish',
];

export const PassportManifestManager: React.FC = () => {
  const {
    itineraries,
    clients,
    passports,
    addItineraryPassport,
    updateItineraryPassport,
    deleteItineraryPassport,
    currentUser,
    firebaseUser,
  } = useApp();

  // Selected Itinerary State - Prompts user to choose an itinerary first
  const [selectedTripId, setSelectedTripId] = useState<string>('');

  const selectedTrip = useMemo(() => {
    return itineraries.find((t) => t.id === selectedTripId) || null;
  }, [itineraries, selectedTripId]);

  const tripClient = useMemo(() => {
    if (!selectedTrip?.clientId) return null;
    return clients.find((c) => c.id === selectedTrip.clientId) || null;
  }, [clients, selectedTrip]);

  // Passports for current trip
  const tripPassports = useMemo(() => {
    if (!selectedTripId) return [];
    return passports.filter((p) => p.tripId === selectedTripId);
  }, [passports, selectedTripId]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPassports = useMemo(() => {
    if (!searchQuery.trim()) return tripPassports;
    const q = searchQuery.toLowerCase();
    return tripPassports.filter(
      (p) =>
        p.participantName.toLowerCase().includes(q) ||
        p.passportNumber.toLowerCase().includes(q) ||
        p.nationality.toLowerCase().includes(q)
    );
  }, [tripPassports, searchQuery]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPassport, setEditingPassport] = useState<ItineraryPassport | null>(null);
  const [deletingPassportId, setDeletingPassportId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [formParticipantName, setFormParticipantName] = useState('');
  const [formNationality, setFormNationality] = useState('');
  const [formPassportNumber, setFormPassportNumber] = useState('');
  const [formDateOfIssue, setFormDateOfIssue] = useState('');
  const [formDateOfExpiry, setFormDateOfExpiry] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormParticipantName('');
    setFormNationality(tripClient?.nationality || 'American');
    setFormPassportNumber('');
    const today = new Date().toISOString().split('T')[0];
    setFormDateOfIssue(today);
    const inTenYears = new Date();
    inTenYears.setFullYear(inTenYears.getFullYear() + 10);
    setFormDateOfExpiry(inTenYears.toISOString().split('T')[0]);
    setFormNotes('');
    setFormError(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (passport: ItineraryPassport) => {
    setEditingPassport(passport);
    setFormParticipantName(passport.participantName);
    setFormNationality(passport.nationality);
    setFormPassportNumber(passport.passportNumber);
    setFormDateOfIssue(passport.dateOfIssue);
    setFormDateOfExpiry(passport.dateOfExpiry);
    setFormNotes(passport.notes || '');
    setFormError(null);
  };

  const handleCopyPassport = (passport: ItineraryPassport) => {
    const text = `Participant: ${passport.participantName}\nNationality: ${passport.nationality}\nPassport #: ${passport.passportNumber}\nIssue: ${passport.dateOfIssue}\nExpiry: ${passport.dateOfExpiry}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(passport.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getValidityStatus = (expiryDateStr: string) => {
    if (!expiryDateStr) return { label: 'Unknown', color: 'bg-slate-100 text-slate-700' };
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(now.getMonth() + 6);

    if (expiry < now) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800 border-red-200' };
    }
    if (expiry < sixMonthsFromNow) {
      return { label: 'Expires < 6 Months', color: 'bg-amber-100 text-amber-900 border-amber-300' };
    }
    return { label: 'Valid (> 6 Months)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId) {
      setFormError('Please select an itinerary first.');
      return;
    }
    if (!formParticipantName.trim()) {
      setFormError('Participant Name is required.');
      return;
    }
    if (!formNationality.trim()) {
      setFormError('Nationality is required.');
      return;
    }
    if (!formPassportNumber.trim()) {
      setFormError('Passport Number is required.');
      return;
    }
    if (!formDateOfIssue) {
      setFormError('Date of Issue is required.');
      return;
    }
    if (!formDateOfExpiry) {
      setFormError('Date of Expiry is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const editorName = currentUser?.name || firebaseUser?.email || 'Operations Agent';

    try {
      if (editingPassport) {
        const updated: ItineraryPassport = {
          ...editingPassport,
          participantName: formParticipantName.trim(),
          nationality: formNationality.trim(),
          passportNumber: formPassportNumber.trim().toUpperCase(),
          dateOfIssue: formDateOfIssue,
          dateOfExpiry: formDateOfExpiry,
          notes: formNotes.trim() || undefined,
          lastEditedBy: editorName,
        };
        await updateItineraryPassport(updated);
        setEditingPassport(null);
      } else {
        const newPassport: ItineraryPassport = {
          id: `pass-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          tripId: selectedTripId,
          participantName: formParticipantName.trim(),
          nationality: formNationality.trim(),
          passportNumber: formPassportNumber.trim().toUpperCase(),
          dateOfIssue: formDateOfIssue,
          dateOfExpiry: formDateOfExpiry,
          notes: formNotes.trim() || undefined,
          createdAt: new Date().toISOString(),
          lastEditedBy: editorName,
        };
        await addItineraryPassport(newPassport);
        setIsAddModalOpen(false);
      }
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save passport. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItineraryPassport(id);
      setDeletingPassportId(null);
    } catch (err: any) {
      console.error('Failed to delete passport:', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Tour Passports Manifest
            </span>
            <span className="text-xs text-slate-500 font-medium">Border &amp; Aviation Compliance</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Participant Passport &amp; Travel Manifest
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Log, verify, and export travel document details for tour participants at any time.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!selectedTrip || tripPassports.length === 0}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            title="Print or save PDF manifest for flight handling and private charters"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Manifest</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            disabled={!selectedTrip}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Passport Details</span>
          </button>
        </div>
      </div>

      {/* Itinerary Selection Card / Prompter */}
      {!selectedTrip ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-300 rounded-full text-xs font-extrabold text-amber-900 mb-2">
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              <span>Step 1: Select Tour Itinerary</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Select an Itinerary to Enter Passport Details
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Choose an itinerary from the list below to enter or manage participant travel documents. You can enter passports individually at any time as participants provide them.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {itineraries.length === 0 ? (
              <div className="col-span-full py-10 text-center text-slate-400">
                No itineraries registered yet. Create an itinerary first.
              </div>
            ) : (
              itineraries.map((trip) => {
                const count = passports.filter((p) => p.tripId === trip.id).length;
                return (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer bg-slate-50/50 hover:bg-white group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          {trip.code}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {count} / {trip.partySize} Passports
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-800 transition-colors">
                        {trip.title}
                      </h3>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{trip.destination}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{trip.startDate} &bull; {trip.days.length} Days ({trip.partySize} Guests)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mt-4 w-full py-2 bg-slate-900 group-hover:bg-amber-500 group-hover:text-slate-950 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Select &amp; Enter Passports</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Itinerary Header Bar */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-xs">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-900 text-amber-300 px-2 py-0.5 rounded-md">
                      {selectedTrip.code}
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900">
                      {selectedTrip.title}
                    </h2>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                    <span>{selectedTrip.destination}</span>
                    <span>&bull;</span>
                    <span>{selectedTrip.startDate} &mdash; {selectedTrip.endDate}</span>
                    <span>&bull;</span>
                    <span>Party: {selectedTrip.partySize} Guests</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTripId('')}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Switch Tour Itinerary
                </button>
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                  {tripPassports.length} of {selectedTrip.partySize} Passports Received
                </span>
              </div>
            </div>

            {/* Direct Passport Entry Form Section */}
            <div className="pt-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Enter Participant Passport Details</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tour participants submit passports at different times &mdash; enter each passport as it is received (no requirement to enter all participants at once).
                  </p>
                </div>
                <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-medium">
                  💡 Enter as many or as few passports as you want at any time.
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Participant Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block">
                      Participant Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lord Julian Sterling"
                      value={formParticipantName}
                      onChange={(e) => setFormParticipantName(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:border-amber-500 outline-none"
                    />
                  </div>

                  {/* Nationality */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block">
                      Nationality *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. American, British, French"
                      value={formNationality}
                      onChange={(e) => setFormNationality(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:border-amber-500 outline-none"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {POPULAR_NATIONALITIES.slice(0, 5).map((nat) => (
                        <button
                          key={nat}
                          type="button"
                          onClick={() => setFormNationality(nat)}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                            formNationality.toLowerCase() === nat.toLowerCase()
                              ? 'bg-amber-500 text-slate-950 font-bold border-amber-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {nat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Passport Number */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block">
                      Passport Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 549201948"
                      value={formPassportNumber}
                      onChange={(e) => setFormPassportNumber(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:border-amber-500 outline-none uppercase"
                    />
                  </div>

                  {/* Date of Issue */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block">
                      Date of Issue *
                    </label>
                    <input
                      type="date"
                      required
                      value={formDateOfIssue}
                      onChange={(e) => setFormDateOfIssue(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-amber-500 outline-none"
                    />
                  </div>

                  {/* Date of Expiry */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block">
                      Date of Expiry *
                    </label>
                    <input
                      type="date"
                      required
                      value={formDateOfExpiry}
                      onChange={(e) => setFormDateOfExpiry(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-amber-500 outline-none"
                    />
                  </div>

                  {/* Optional Notes */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block">
                      Notes / Visa Details (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Double-entry visa attached"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isSubmitting ? 'Saving Passport...' : 'Save & Add Passport to Tour'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manifest Table & Entries */}
      {selectedTrip && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">
                Manifest Entries for {selectedTrip.code}
              </h2>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {tripPassports.length} {tripPassports.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, passport #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none w-56"
                />
              </div>

              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
            </div>
          </div>

          {filteredPassports.length === 0 ? (
            <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {tripPassports.length === 0
                  ? 'No passports logged for this itinerary yet'
                  : 'No matching passports found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {tripPassports.length === 0
                  ? 'Passports arrive at different times. Enter each participant passport as soon as you receive it, with no requirement to submit all at once.'
                  : 'Try adjusting your search terms.'}
              </p>
              {tripPassports.length === 0 && (
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="mt-2 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Enter First Passport</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Participant Name</th>
                    <th className="py-3 px-4">Nationality</th>
                    <th className="py-3 px-4">Passport Number</th>
                    <th className="py-3 px-4">Date of Issue</th>
                    <th className="py-3 px-4">Date of Expiry</th>
                    <th className="py-3 px-4">Validity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPassports.map((p, idx) => {
                    const validity = getValidityStatus(p.dateOfExpiry);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 text-sm">
                            {p.participantName}
                          </div>
                          {p.notes && (
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">
                              {p.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-slate-800 text-xs font-medium">
                            {p.nationality}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-extrabold text-slate-900 text-xs tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                              {p.passportNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyPassport(p)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                              title="Copy passport info"
                            >
                              {copiedId === p.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">
                          {p.dateOfIssue}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                          {p.dateOfExpiry}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${validity.color}`}
                          >
                            {validity.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingPassportId(p.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Passport Modal */}
      {(isAddModalOpen || editingPassport) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingPassport ? 'Edit Participant Passport' : 'Enter Participant Passport'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedTrip ? `Itinerary: ${selectedTrip.code} - ${selectedTrip.title}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingPassport(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Participant Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Participant Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lord Julian Sterling"
                  value={formParticipantName}
                  onChange={(e) => setFormParticipantName(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              {/* Nationality */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Nationality *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. British, American, French"
                  value={formNationality}
                  onChange={(e) => setFormNationality(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase mr-1 self-center">Presets:</span>
                  {POPULAR_NATIONALITIES.slice(0, 6).map((nat) => (
                    <button
                      key={nat}
                      type="button"
                      onClick={() => setFormNationality(nat)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                        formNationality.toLowerCase() === nat.toLowerCase()
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {nat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Passport Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Passport Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GB-90812499"
                  value={formPassportNumber}
                  onChange={(e) => setFormPassportNumber(e.target.value.toUpperCase())}
                  className="w-full mt-1 px-3.5 py-2 text-xs font-mono font-bold uppercase bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              {/* Dates grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Date of Issue *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDateOfIssue}
                    onChange={(e) => setFormDateOfIssue(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Date of Expiry *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDateOfExpiry}
                    onChange={(e) => setFormDateOfExpiry(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Special Visa / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP fast-track clearance requested, Schengen visa holder"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingPassport(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingPassport
                    ? 'Update Passport'
                    : 'Save Passport'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPassportId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Remove Passport Record?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete this participant passport record from the manifest?
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPassportId(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingPassportId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
