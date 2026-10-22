import React, { useState } from 'react';
import {
  Users,
  Plus,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Compass,
  DollarSign,
  Search,
  Shield,
  Star,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client, CommunicationRecord } from '../../types';
import { GenerateClientLinkModal } from '../itinerary/GenerateClientLinkModal';

export const ClientCRM: React.FC = () => {
  const {
    clients,
    addClient,
    communications,
    addCommunication,
    itineraries,
    staff,
    formatMoney,
    convertCurrency,
    openClientPortal,
    hasFullFinancialView,
  } = useApp();

  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isLogCommOpen, setIsLogCommOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedTripForLink, setSelectedTripForLink] = useState<string | undefined>(undefined);

  // New Client state - No VIP tier field
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    companyOrFamily: '',
    nationality: 'American',
    dietaryRestrictions: [],
    preferences: [],
    notes: '',
  });
  const [dietaryInput, setDietaryInput] = useState('');
  const [prefInput, setPrefInput] = useState('');

  // New Comm state
  const [newComm, setNewComm] = useState<Partial<CommunicationRecord>>({
    type: 'Phone Call',
    subject: '',
    summary: '',
    staffId: staff[0]?.id || '',
    nextFollowUpDate: '',
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const filteredClients = clients.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.nationality.toLowerCase().includes(q)
    );
  });

  // Client's trips history
  const clientTrips = itineraries.filter((t) => t.clientId === selectedClient?.id);
  const clientTotalSpendUSD = clientTrips.reduce(
    (sum, t) => sum + convertCurrency(t.totalClientPrice, t.currency, 'USD'),
    0
  );

  // Client's communication logs
  const clientCommunications = communications.filter(
    (comm) => comm.clientId === selectedClient?.id
  );

  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.email) return;

    // Notice: No VIP tier field assigned
    const client: Client = {
      id: `client-${Date.now()}`,
      name: newClient.name || '',
      email: newClient.email || '',
      phone: newClient.phone || '',
      companyOrFamily: newClient.companyOrFamily,
      nationality: newClient.nationality || 'American',
      dietaryRestrictions: newClient.dietaryRestrictions || [],
      preferences: newClient.preferences || [],
      passportExpiry: '2028-12-31',
      emergencyContact: {
        name: 'Family Office Secretary',
        phone: '+1 555-0199',
        relationship: 'Executive Assistant',
      },
      notes: newClient.notes || '',
      createdAt: new Date().toISOString().split('T')[0],
    };

    addClient(client);
    setSelectedClientId(client.id);
    setIsNewClientOpen(false);
  };

  const handleLogCommSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newComm.subject) return;

    const comm: CommunicationRecord = {
      id: `comm-${Date.now()}`,
      clientId: selectedClient.id,
      staffId: newComm.staffId || staff[0].id,
      date: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      type: (newComm.type as any) || 'Phone Call',
      subject: newComm.subject || '',
      summary: newComm.summary || '',
      nextFollowUpDate: newComm.nextFollowUpDate || undefined,
    };

    addCommunication(comm);
    setIsLogCommOpen(false);
    setNewComm({
      type: 'Phone Call',
      subject: '',
      summary: '',
      staffId: staff[0]?.id || '',
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Module 5: VIP Client CRM
            </span>
            <span className="text-xs text-slate-500 font-medium">Guest Dossiers &amp; Communications</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Client Relationship Management &amp; History Logs
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Maintain high-touch client dossiers, dietary preferences, past trip archives, and logged communications.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsNewClientOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Main CRM Grid: Client Selector on Left, Dossier on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Client Directory List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients by name, nationality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="space-y-2">
            {filteredClients.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No clients registered</p>
                <p className="text-[11px] text-slate-400 mt-1">Get started by creating your first client record.</p>
                <button
                  type="button"
                  onClick={() => setIsNewClientOpen(true)}
                  className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                >
                  + Add Client
                </button>
              </div>
            ) : (
              filteredClients.map((client) => {
              const isSelected = client.id === selectedClient?.id;
              const tripsCount = itineraries.filter((t) => t.clientId === client.id).length;

              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-500/30'
                      : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    {client.vipTier ? (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {client.vipTier}
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-slate-800 text-slate-300 border border-slate-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {client.nationality || 'Client'}
                      </span>
                    )}
                    <span
                      className={`text-xs ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}
                    >
                      {tripsCount} {tripsCount === 1 ? 'Trip' : 'Trips'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm truncate">{client.name}</h3>
                  <div
                    className={`text-xs truncate mt-0.5 ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {client.email}
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>

        {/* Right Col: Client Dossier Details & Communication Log */}
        {selectedClient ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Client Dossier Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    {selectedClient.vipTier && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-slate-950">
                        {selectedClient.vipTier}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-semibold">
                      {selectedClient.nationality} Citizen
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold font-serif-display text-slate-900 mt-1.5">
                    {selectedClient.name}
                  </h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {selectedClient.companyOrFamily}
                  </div>
                </div>

                {hasFullFinancialView && (
                  <div className="text-right sm:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Lifetime Spend (LTV)
                    </span>
                    <span className="text-xl font-black text-emerald-700">
                      {formatMoney(clientTotalSpendUSD, 'USD')}
                    </span>
                  </div>
                )}
              </div>

              {/* Contact & Emergency Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Direct Email</div>
                  <div className="font-semibold text-slate-900 mt-0.5 truncate">
                    {selectedClient.email}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Phone &amp; WhatsApp</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {selectedClient.phone}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Passport Expiry</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {selectedClient.passportExpiry || '2028-12-31'}
                  </div>
                </div>
              </div>

              {/* Preferences & Dietary Requirements */}
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Dietary Restrictions &amp; Allergies
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedClient.dietaryRestrictions.map((diet, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-lg"
                      >
                        {diet}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Travel Style Preferences &amp; Special Directives
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedClient.preferences.map((pref, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg"
                      >
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Client Notes */}
              {selectedClient.notes && (
                <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-700 italic border border-slate-100">
                  &ldquo;{selectedClient.notes}&rdquo;
                </div>
              )}
            </div>

            {/* Past & Active Trips History Section */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-600" />
                  <span>Trip History &amp; Bookings Archive ({clientTrips.length})</span>
                </h3>
              </div>

              {clientTrips.length === 0 ? (
                <p className="text-xs text-slate-400">No itineraries booked for this client yet.</p>
              ) : (
                <div className="space-y-3">
                  {clientTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900">{trip.code}</span>
                          <span className="font-bold text-slate-900">{trip.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                            {trip.status}
                          </span>
                        </div>
                        <div className="text-slate-500 flex items-center gap-3">
                          <span>{trip.destination}</span>
                          <span>&bull;</span>
                          <span>{trip.startDate} &mdash; {trip.endDate}</span>
                          {hasFullFinancialView && (
                            <>
                              <span>&bull;</span>
                              <span className="font-bold text-emerald-700">
                                ${trip.totalClientPrice.toLocaleString()} {trip.currency}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-start sm:self-auto">
                        <button
                          onClick={() => {
                            setSelectedTripForLink(trip.id);
                            setIsLinkModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                          title="Generate live sharable link with real-time updates and QR code"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Generate Link</span>
                        </button>
                        <button
                          onClick={() => openClientPortal(trip.id)}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                          <span>Live Portal</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Communication Log Section */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  <span>Communication Records &amp; Touchpoints ({clientCommunications.length})</span>
                </h3>
                <button
                  onClick={() => setIsLogCommOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Log Communication</span>
                </button>
              </div>

              {clientCommunications.length === 0 ? (
                <p className="text-xs text-slate-400">No communication logs recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {clientCommunications.map((comm) => {
                    const staffMember = staff.find((s) => s.id === comm.staffId);

                    return (
                      <div
                        key={comm.id}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              {comm.type}
                            </span>
                            <span className="font-bold text-slate-900">{comm.subject}</span>
                          </div>
                          <span className="text-slate-400 text-[11px]">{comm.date}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{comm.summary}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/50">
                          <span>Staff: <strong className="text-slate-700">{staffMember?.name}</strong></span>
                          {comm.nextFollowUpDate && (
                            <span className="text-amber-700 font-semibold">
                              Follow-up Scheduled: {comm.nextFollowUpDate}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white rounded-3xl p-12 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center min-h-[380px]">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Client Selected</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
              Select a client from the directory to review their dossier, preferences, and communication history, or add a new client record.
            </p>
            <button
              type="button"
              onClick={() => setIsNewClientOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add New Client</span>
            </button>
          </div>
        )}
      </div>

      {/* Log Communication Modal */}
      {isLogCommOpen && selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Log Communication with {selectedClient.name}
            </h3>

            <form onSubmit={handleLogCommSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Channel / Type</label>
                <select
                  value={newComm.type}
                  onChange={(e) => setNewComm({ ...newComm, type: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="Phone Call">Phone Call</option>
                  <option value="Email">Email Exchange</option>
                  <option value="WhatsApp">WhatsApp Conversation</option>
                  <option value="In-Person Meeting">In-Person VIP Meeting</option>
                  <option value="Trip Debrief">Post-Trip Debriefing</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discussed private jet catering & hotel upgrade"
                  value={newComm.subject}
                  onChange={(e) => setNewComm({ ...newComm, subject: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Summary &amp; Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Key decisions, client requests, budget approvals..."
                  value={newComm.summary}
                  onChange={(e) => setNewComm({ ...newComm, summary: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Staff Representative</label>
                  <select
                    value={newComm.staffId}
                    onChange={(e) => setNewComm({ ...newComm, staffId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Next Follow-Up Date</label>
                  <input
                    type="date"
                    value={newComm.nextFollowUpDate}
                    onChange={(e) => setNewComm({ ...newComm, nextFollowUpDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogCommOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Save Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Client Modal - No VIP tier field */}
      {isNewClientOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New Client Dossier</h3>

            <form onSubmit={handleAddClientSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Client Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lord & Lady Hamilton"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Email</label>
                  <input
                    type="email"
                    required
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Phone</label>
                  <input
                    type="text"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Nationality</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. American, British, French"
                    value={newClient.nationality}
                    onChange={(e) => setNewClient({ ...newClient, nationality: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Family Office / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Hamilton Family Trust"
                    value={newClient.companyOrFamily}
                    onChange={(e) => setNewClient({ ...newClient, companyOrFamily: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">
                  Dietary Restrictions (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Strictly Kosher, Nut Allergy, Gluten-free"
                  value={dietaryInput}
                  onChange={(e) => {
                    setDietaryInput(e.target.value);
                    setNewClient({
                      ...newClient,
                      dietaryRestrictions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    });
                  }}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">
                  Travel Preferences (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tarmac pickup, Connecting suites, High-end wine tastings"
                  value={prefInput}
                  onChange={(e) => {
                    setPrefInput(e.target.value);
                    setNewClient({
                      ...newClient,
                      preferences: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    });
                  }}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewClientOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Create Client Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Live Client Link Modal */}
      <GenerateClientLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        tripId={selectedTripForLink}
      />
    </div>
  );
};
