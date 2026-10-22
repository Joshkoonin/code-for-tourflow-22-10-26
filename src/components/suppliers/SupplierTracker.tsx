import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  FileCheck,
  AlertTriangle,
  Star,
  Phone,
  Mail,
  Compass,
  Filter,
  DollarSign,
  ShieldCheck,
  MessageSquare,
  Bell,
  Search,
  Edit2,
  X,
  Tag,
  Shield,
  Sparkles,
  MapPin,
  User,
  XCircle,
  Trash2,
  Check,
  Layers,
  Calendar,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  Supplier,
  SupplierBooking,
  SupplierBookingStatus,
  SupplierCategory,
} from '../../types';
import { LoneProviderAvailabilityChecker } from './LoneProviderAvailabilityChecker';
import { SupplierRemindersHub } from './SupplierRemindersHub';
import { BookingsGroupedView, BookingGroupByOption } from './BookingsGroupedView';

export const SupplierTracker: React.FC = () => {
  const {
    suppliers,
    addSupplier,
    updateSupplier,
    supplierBookings,
    addSupplierBooking,
    updateSupplierBooking,
    updateSupplierBookingStatus,
    cancelSupplierBooking,
    deleteSupplierBooking,
    itineraries,
    conflicts,
    formatMoney,
    hasFullFinancialView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'CURRENT' | 'BOOKINGS' | 'AVAILABILITY' | 'REMINDERS' | 'SUPPLIERS'>('CURRENT');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentStatusSubfilter, setCurrentStatusSubfilter] = useState<'ALL' | 'Requested' | 'Confirmed'>('ALL');
  const [bookingGroupBy, setBookingGroupBy] = useState<BookingGroupByOption>('NONE');
  const [selectedBookingForVoucher, setSelectedBookingForVoucher] = useState<SupplierBooking | null>(null);
  const [whatsappToast, setWhatsappToast] = useState<string | null>(null);

  // Add / Edit Supplier Modal State
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Supplier Form Fields
  const [supName, setSupName] = useState('');
  const [supCategory, setSupCategory] = useState<SupplierCategory>('Guide');
  const [supIsLoneProvider, setSupIsLoneProvider] = useState<boolean | null>(null);
  const [loneProviderError, setLoneProviderError] = useState<string | null>(null);
  const [supLoneProviderType, setSupLoneProviderType] = useState<Supplier['loneProviderType']>('Exclusive Specialist Guide');
  const [supCity, setSupCity] = useState('');
  const [supCountry, setSupCountry] = useState('Israel');
  const [supContactPerson, setSupContactPerson] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supWhatsapp, setSupWhatsapp] = useState('');
  const [supRating, setSupRating] = useState<number>(5);
  const [supNotes, setSupNotes] = useState('');

  // Suppliers Directory search & filters
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [supplierTypeFilter, setSupplierTypeFilter] = useState<'ALL' | 'LONE' | 'STANDARD'>('ALL');
  const [supplierCategoryFilter, setSupplierCategoryFilter] = useState<string>('ALL');
  const [supplierToast, setSupplierToast] = useState<string | null>(null);

  const showSupplierToast = (msg: string) => {
    setSupplierToast(msg);
    setTimeout(() => setSupplierToast(null), 4000);
  };

  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupName('');
    setSupCategory('Guide');
    // Actively ask user whether supplier is a lone provider; do not assume!
    setSupIsLoneProvider(null);
    setLoneProviderError(null);
    setSupLoneProviderType('Exclusive Specialist Guide');
    setCityField();
    setIsAddSupplierOpen(true);
  };

  const setCityField = () => {
    setSupCity('Jerusalem');
    setSupCountry('Israel');
    setSupContactPerson('');
    setSupEmail('');
    setSupPhone('');
    setSupWhatsapp('');
    setSupRating(5);
    setSupNotes('');
  };

  const handleOpenEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupName(s.name);
    setSupCategory(s.category);
    setSupIsLoneProvider(s.isLoneProvider);
    setLoneProviderError(null);
    setSupLoneProviderType(s.loneProviderType || 'Exclusive Specialist Guide');
    setSupCity(s.city || '');
    setSupCountry(s.country || 'Israel');
    setSupContactPerson(s.contactPerson || '');
    setSupEmail(s.email || '');
    setSupPhone(s.phone || '');
    setSupWhatsapp(s.whatsappNumber || s.phone || '');
    setSupRating(s.rating || 5);
    setSupNotes(s.notes || '');
    setIsAddSupplierOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    // Actively validate that user answered the Lone Provider question
    if (supIsLoneProvider === null) {
      setLoneProviderError('Please actively select whether this supplier is a Lone Provider or a Standard Supplier.');
      return;
    }
    setLoneProviderError(null);

    const isLone = Boolean(supIsLoneProvider);

    if (editingSupplier) {
      const updated: Supplier = {
        ...editingSupplier,
        name: supName.trim(),
        category: supCategory,
        isLoneProvider: isLone,
        loneProviderType: isLone ? supLoneProviderType : undefined,
        city: supCity.trim() || 'Jerusalem',
        country: supCountry.trim() || 'Israel',
        contactPerson: supContactPerson.trim(),
        email: supEmail.trim(),
        phone: supPhone.trim(),
        whatsappNumber: supWhatsapp.trim() || supPhone.trim(),
        rating: supRating,
        notes: supNotes.trim(),
      };
      updateSupplier(updated);
      showSupplierToast(`Updated supplier "${updated.name}" (${updated.isLoneProvider ? 'Lone Provider' : 'Standard Provider'})`);
    } else {
      const created: Supplier = {
        id: `sup-${Date.now()}`,
        name: supName.trim(),
        category: supCategory,
        isLoneProvider: isLone,
        loneProviderType: isLone ? supLoneProviderType : undefined,
        city: supCity.trim() || 'Jerusalem',
        country: supCountry.trim() || 'Israel',
        contactPerson: supContactPerson.trim(),
        email: supEmail.trim(),
        phone: supPhone.trim(),
        whatsappNumber: supWhatsapp.trim() || supPhone.trim(),
        rating: supRating,
        notes: supNotes.trim(),
      };
      addSupplier(created);
      showSupplierToast(`Added new supplier "${created.name}" (${created.isLoneProvider ? 'Lone Provider' : 'Standard Provider'})`);
      setActiveTab('SUPPLIERS');
    }

    setIsAddSupplierOpen(false);
  };

  const handleToggleLoneProvider = (s: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIsLone = !s.isLoneProvider;
    updateSupplier({
      ...s,
      isLoneProvider: nextIsLone,
      loneProviderType: nextIsLone ? (s.loneProviderType || 'Exclusive Specialist Guide') : undefined,
    });
    showSupplierToast(`Changed "${s.name}" to ${nextIsLone ? 'Lone Provider (Exclusive)' : 'Standard Supplier'}`);
  };

  // Filtered suppliers for Tab 4
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = supplierSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
        (s.loneProviderType && s.loneProviderType.toLowerCase().includes(q));

      const matchesType =
        supplierTypeFilter === 'ALL' ||
        (supplierTypeFilter === 'LONE' && s.isLoneProvider) ||
        (supplierTypeFilter === 'STANDARD' && !s.isLoneProvider);

      const matchesCategory =
        supplierCategoryFilter === 'ALL' || s.category === supplierCategoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [suppliers, supplierSearchQuery, supplierTypeFilter, supplierCategoryFilter]);

  // New Booking state
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [newBooking, setNewBooking] = useState<Partial<SupplierBooking>>({
    supplierId: suppliers[0]?.id || '',
    tripId: itineraries[0]?.id || '',
    serviceDescription: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '13:00',
    guestsCount: 4,
    status: 'Requested',
    cost: 1500,
    currency: 'USD',
  });

  const requestedCount = useMemo(
    () => supplierBookings.filter((b) => b.status === 'Requested').length,
    [supplierBookings]
  );
  const confirmedCount = useMemo(
    () => supplierBookings.filter((b) => b.status === 'Confirmed').length,
    [supplierBookings]
  );
  const currentTotalCount = requestedCount + confirmedCount;
  const currentPipelineValue = useMemo(() => {
    return supplierBookings
      .filter((b) => b.status === 'Requested' || b.status === 'Confirmed')
      .reduce((sum, b) => sum + (b.cost || 0), 0);
  }, [supplierBookings]);

  // Bookings for "Current" tab: strictly Requested and Confirmed
  const currentBookings = useMemo(() => {
    return supplierBookings.filter((b) => {
      const isCurrent = b.status === 'Requested' || b.status === 'Confirmed';
      if (!isCurrent) return false;
      if (currentStatusSubfilter === 'Requested' && b.status !== 'Requested') return false;
      if (currentStatusSubfilter === 'Confirmed' && b.status !== 'Confirmed') return false;
      return true;
    });
  }, [supplierBookings, currentStatusSubfilter]);

  // Bookings for "All Bookings" tab
  const filteredBookings = useMemo(() => {
    return supplierBookings.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      return true;
    });
  }, [supplierBookings, statusFilter]);

  // Booking Toast Notification
  const [bookingToast, setBookingToast] = useState<string | null>(null);
  const showBookingToast = (msg: string) => {
    setBookingToast(msg);
    setTimeout(() => setBookingToast(null), 5000);
  };

  // Cancel Booking Modal State
  const [bookingToCancel, setBookingToCancel] = useState<SupplierBooking | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Edit Booking Modal State
  const [editingBooking, setEditingBooking] = useState<SupplierBooking | null>(null);
  const [isEditBookingOpen, setIsEditBookingOpen] = useState(false);

  const handleConfirmBooking = (b: SupplierBooking) => {
    const supplier = suppliers.find((s) => s.id === b.supplierId);
    updateSupplierBookingStatus(b.id, 'Confirmed');
    showBookingToast(`Booking confirmed for ${supplier?.name || 'supplier'} on ${b.date}! Itinerary activity synced.`);
  };

  const handleUpdateStatus = (b: SupplierBooking, nextStatus: SupplierBookingStatus | 'CANCEL_AND_REMOVE') => {
    if (nextStatus === 'CANCEL_AND_REMOVE' || nextStatus === 'Cancelled') {
      handleOpenCancelModal(b);
      return;
    }
    const supplier = suppliers.find((s) => s.id === b.supplierId);
    updateSupplierBookingStatus(b.id, nextStatus);
    showBookingToast(`Booking status for ${supplier?.name || 'supplier'} updated to "${nextStatus}".`);
  };

  const handleOpenCancelModal = (b: SupplierBooking) => {
    setBookingToCancel(b);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelBooking = () => {
    if (!bookingToCancel) return;
    const supplier = suppliers.find((s) => s.id === bookingToCancel.supplierId);
    cancelSupplierBooking(bookingToCancel.id);
    setIsCancelModalOpen(false);
    if (isEditBookingOpen && editingBooking?.id === bookingToCancel.id) {
      setIsEditBookingOpen(false);
      setEditingBooking(null);
    }
    setBookingToCancel(null);
    showBookingToast(
      `Booking for ${supplier?.name || 'supplier'} on ${bookingToCancel.date} was cancelled and removed from the system. Any lone provider clashes have been cleared!`
    );
  };

  const handleOpenEditBooking = (b: SupplierBooking) => {
    setEditingBooking({ ...b });
    setIsEditBookingOpen(true);
  };

  const handleSaveEditBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    if (editingBooking.status === 'Cancelled') {
      setBookingToCancel(editingBooking);
      setIsEditBookingOpen(false);
      setIsCancelModalOpen(true);
      return;
    }
    const supplier = suppliers.find((s) => s.id === editingBooking.supplierId);
    updateSupplierBooking(editingBooking);
    if (editingBooking.status === 'Confirmed') {
      updateSupplierBookingStatus(editingBooking.id, 'Confirmed');
    }
    setIsEditBookingOpen(false);
    setEditingBooking(null);
    showBookingToast(`Booking updated for ${supplier?.name || 'supplier'}.`);
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.supplierId || !newBooking.tripId) return;

    const b: SupplierBooking = {
      id: `book-${Date.now()}`,
      supplierId: newBooking.supplierId,
      tripId: newBooking.tripId,
      serviceDescription: newBooking.serviceDescription || 'VIP Bespoke Service',
      date: newBooking.date || new Date().toISOString().split('T')[0],
      startTime: newBooking.startTime,
      endTime: newBooking.endTime,
      guestsCount: Number(newBooking.guestsCount) || 2,
      status: (newBooking.status as SupplierBookingStatus) || 'Requested',
      confirmationNumber: `CONF-${Math.floor(1000 + Math.random() * 9000)}`,
      cost: Number(newBooking.cost) || 1000,
      currency: (newBooking.currency as any) || 'USD',
      notes: newBooking.notes,
      autoRemindersEnabled: true,
      whatsappReminderStatus: 'Scheduled',
      emailReminderStatus: 'Scheduled',
    };

    addSupplierBooking(b);
    setIsAddBookingOpen(false);
    showBookingToast(`New booking created in status "${b.status}".`);
  };

  const getStatusBadge = (status: SupplierBookingStatus) => {
    switch (status) {
      case 'Requested':
        return 'bg-amber-100 text-amber-900 border border-amber-300';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-900 border border-blue-300';
      case 'Voucher Issued':
        return 'bg-emerald-100 text-emerald-900 border border-emerald-300';
      case 'Paid':
        return 'bg-purple-100 text-purple-900 border border-purple-300';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-900 border border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleTriggerQuickWhatsApp = (b: SupplierBooking) => {
    const supplier = suppliers.find((s) => s.id === b.supplierId);
    const trip = itineraries.find((t) => t.id === b.tripId);
    const msg = `Shalom ${supplier?.contactPerson || 'Partner'},\n\nAutomated 24h reminder from TourOps 360: Service confirmed for tomorrow, ${b.date} at ${b.startTime || '09:00'}.\n\nTour: ${trip?.code} (${b.serviceDescription})\nParty: ${b.guestsCount} VIP Guests.\nRef: ${b.confirmationNumber || 'CONF-DIRECT'}.\n\nPlease reply to confirm receipt. Operations line: +972 54 889 1234.`;
    const phone = supplier?.whatsappNumber ? supplier.whatsappNumber.replace(/[^0-9]/g, '') : '972504439921';
    
    // Update booking status
    updateSupplierBooking({
      ...b,
      whatsappReminderStatus: 'Sent',
      whatsappReminderSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    // Create safe link click without window.open
    const link = document.createElement('a');
    link.href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setWhatsappToast(`24-hour WhatsApp reminder dispatched to ${supplier?.name}!`);
    setTimeout(() => setWhatsappToast(null), 4000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Module 7: Supplier Operations
            </span>
            <span className="text-xs text-slate-500 font-medium">Bookings, Clash Prevention &amp; 24h Reminders</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Supplier Pipeline &amp; Engagement Automation
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Track confirmations, search lone provider availability to avoid double-bookings, and automate day-before reminders.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleOpenAddSupplier}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Supplier</span>
          </button>

          <button
            onClick={() => setIsAddBookingOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>New Supplier Booking</span>
          </button>
        </div>
      </div>

      {supplierToast && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 text-xs font-bold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <span>{supplierToast}</span>
          </div>
          <button onClick={() => setSupplierToast(null)} className="text-amber-800 hover:text-amber-950 font-bold">
            &times;
          </button>
        </div>
      )}

      {whatsappToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{whatsappToast}</span>
          </div>
          <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full uppercase font-extrabold">
            Status: Sent
          </span>
        </div>
      )}

      {bookingToast && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-950 text-xs font-bold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{bookingToast}</span>
          </div>
          <button onClick={() => setBookingToast(null)} className="text-blue-700 hover:text-blue-950 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* View Switcher Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-thin">
        {/* TAB 1: CURRENT BOOKINGS (REQUESTED & CONFIRMED) */}
        <button
          onClick={() => setActiveTab('CURRENT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'CURRENT'
              ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Current Bookings ({currentTotalCount})</span>
          {requestedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-600 text-white animate-pulse">
              {requestedCount} requested
            </span>
          )}
        </button>

        {/* TAB 2: ALL SUPPLIER BOOKINGS */}
        <button
          onClick={() => setActiveTab('BOOKINGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'BOOKINGS'
              ? 'bg-slate-900 text-white shadow-xs font-extrabold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Supplier Bookings ({supplierBookings.length})</span>
        </button>

        {/* TAB 3: LONE PROVIDER AVAILABILITY */}
        <button
          onClick={() => setActiveTab('AVAILABILITY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'AVAILABILITY'
              ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Lone Provider Availability Search (No Clashes)</span>
        </button>

        {/* TAB 4: AUTOMATED 24H REMINDERS */}
        <button
          onClick={() => setActiveTab('REMINDERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'REMINDERS'
              ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Automated 24h Reminders (WhatsApp &amp; Email)</span>
        </button>

        {/* TAB 5: SUPPLIERS DIRECTORY */}
        <button
          onClick={() => setActiveTab('SUPPLIERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'SUPPLIERS'
              ? 'bg-slate-900 text-white shadow-xs font-extrabold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Verified Suppliers Directory ({suppliers.length})</span>
        </button>
      </div>

      {/* TAB 1: CURRENT BOOKINGS (REQUESTED & CONFIRMED) */}
      {activeTab === 'CURRENT' && (
        <div className="space-y-4">
          {/* Operational Pipeline Summary Header */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${hasFullFinancialView ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3`}>
            <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Current Bookings
              </div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                {currentTotalCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Requested + Confirmed operations
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-2xl shadow-2xs">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center justify-between">
                <span>Action Needed: Requested</span>
                {requestedCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <div className="text-xl font-extrabold text-amber-950 mt-0.5">
                {requestedCount}
              </div>
              <div className="text-[10px] text-amber-800 mt-0.5">
                Awaiting supplier confirmation
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl shadow-2xs">
              <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                Confirmed Bookings
              </div>
              <div className="text-xl font-extrabold text-blue-950 mt-0.5">
                {confirmedCount}
              </div>
              <div className="text-[10px] text-blue-800 mt-0.5">
                Locked with supplier partners
              </div>
            </div>

            {hasFullFinancialView && (
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-2xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Current Pipeline Value
                </div>
                <div className="text-xl font-extrabold text-amber-400 font-mono mt-0.5">
                  {formatMoney(currentPipelineValue, 'USD')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Active service commitments
                </div>
              </div>
            )}
          </div>

          {/* Subfilter Bar for Current: ALL, Requested, Confirmed */}
          <div className="flex items-center space-x-2 pb-1 text-xs">
            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mr-1">
              Filter Current:
            </span>
            <button
              onClick={() => setCurrentStatusSubfilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                currentStatusSubfilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Current ({currentTotalCount})
            </button>

            <button
              onClick={() => setCurrentStatusSubfilter('Requested')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer ${
                currentStatusSubfilter === 'Requested'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Requested Only ({requestedCount})</span>
            </button>

            <button
              onClick={() => setCurrentStatusSubfilter('Confirmed')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer ${
                currentStatusSubfilter === 'Confirmed'
                  ? 'bg-blue-600 text-white shadow-xs font-extrabold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-blue-300" />
              <span>Confirmed Only ({confirmedCount})</span>
            </button>
          </div>

          {/* Grouped Bookings Table */}
          <BookingsGroupedView
            bookings={currentBookings}
            suppliers={suppliers}
            itineraries={itineraries}
            groupBy={bookingGroupBy}
            onGroupByChange={setBookingGroupBy}
            formatMoney={formatMoney}
            onUpdateStatus={handleUpdateStatus}
            onConfirmBooking={handleConfirmBooking}
            onOpenCancelModal={handleOpenCancelModal}
            onOpenEditBooking={handleOpenEditBooking}
            onTriggerQuickWhatsApp={handleTriggerQuickWhatsApp}
            onIssueVoucher={(b) => {
              updateSupplierBookingStatus(b.id, 'Voucher Issued');
              setSelectedBookingForVoucher(b);
            }}
            onViewVoucher={(b) => setSelectedBookingForVoucher(b)}
            emptyMessage="No current bookings found matching filters"
          />
        </div>
      )}

      {/* TAB 2: ALL SUPPLIER BOOKINGS */}
      {activeTab === 'BOOKINGS' && (
        <div className="space-y-4">
          {/* Status Filter Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mr-1">
              Filter by Status:
            </span>
            {['ALL', 'Requested', 'Confirmed', 'Voucher Issued', 'Paid', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Grouped Bookings Table */}
          <BookingsGroupedView
            bookings={filteredBookings}
            suppliers={suppliers}
            itineraries={itineraries}
            groupBy={bookingGroupBy}
            onGroupByChange={setBookingGroupBy}
            formatMoney={formatMoney}
            onUpdateStatus={handleUpdateStatus}
            onConfirmBooking={handleConfirmBooking}
            onOpenCancelModal={handleOpenCancelModal}
            onOpenEditBooking={handleOpenEditBooking}
            onTriggerQuickWhatsApp={handleTriggerQuickWhatsApp}
            onIssueVoucher={(b) => {
              updateSupplierBookingStatus(b.id, 'Voucher Issued');
              setSelectedBookingForVoucher(b);
            }}
            onViewVoucher={(b) => setSelectedBookingForVoucher(b)}
            emptyMessage="No supplier bookings found matching filters"
          />
        </div>
      )}

      {/* TAB 2: LONE PROVIDER AVAILABILITY & CLASH CHECKER */}
      {activeTab === 'AVAILABILITY' && (
        <LoneProviderAvailabilityChecker
          onQuickBook={(supplierId, date) => {
            setNewBooking({
              ...newBooking,
              supplierId,
              date,
            });
            setIsAddBookingOpen(true);
          }}
        />
      )}

      {/* TAB 3: AUTOMATED REMINDERS HUB (WHATSAPP & EMAIL) */}
      {activeTab === 'REMINDERS' && <SupplierRemindersHub />}

      {/* TAB 4: VERIFIED SUPPLIERS DIRECTORY */}
      {activeTab === 'SUPPLIERS' && (
        <div className="space-y-4">
          {/* Directory Toolbar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search supplier name, city, contact person..."
                  value={supplierSearchQuery}
                  onChange={(e) => setSupplierSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
              </div>

              {/* Lone Provider Filter */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setSupplierTypeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    supplierTypeFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({suppliers.length})
                </button>
                <button
                  onClick={() => setSupplierTypeFilter('LONE')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    supplierTypeFilter === 'LONE'
                      ? 'bg-amber-500 text-slate-950 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Star className="w-3 h-3 fill-amber-500" />
                  <span>Lone Providers ({suppliers.filter((s) => s.isLoneProvider).length})</span>
                </button>
                <button
                  onClick={() => setSupplierTypeFilter('STANDARD')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    supplierTypeFilter === 'STANDARD'
                      ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Standard ({suppliers.filter((s) => !s.isLoneProvider).length})
                </button>
              </div>

              {/* Category Filter */}
              <select
                value={supplierCategoryFilter}
                onChange={(e) => setSupplierCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
              >
                <option value="ALL">All Categories</option>
                <option value="Accommodation">Accommodation</option>
                <option value="Guide">Guide</option>
                <option value="Transport">Transport</option>
                <option value="Activities & Dining">Activities &amp; Dining</option>
              </select>

              {(supplierSearchQuery || supplierTypeFilter !== 'ALL' || supplierCategoryFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSupplierSearchQuery('');
                    setSupplierTypeFilter('ALL');
                    setSupplierCategoryFilter('ALL');
                  }}
                  className="text-xs text-amber-700 font-bold hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={handleOpenAddSupplier}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Supplier</span>
              </button>
            </div>
          </div>

          {/* Supplier Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((s) => (
              <div
                key={s.id}
                className={`bg-white rounded-3xl border-2 p-6 shadow-xs flex flex-col justify-between space-y-4 transition-all hover:shadow-md ${
                  s.isLoneProvider
                    ? 'border-amber-400/80 ring-2 ring-amber-200/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                      {s.category}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {s.isLoneProvider ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1 shadow-2xs">
                          <Star className="w-3 h-3 fill-slate-950" />
                          <span>Lone Provider</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          Standard Provider
                        </span>
                      )}

                      <button
                        onClick={() => handleOpenEditSupplier(s)}
                        className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit full supplier details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900">{s.name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{s.city}, {s.country}</span>
                    {s.contactPerson && (
                      <>
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-slate-600 font-medium">{s.contactPerson}</span>
                      </>
                    )}
                  </div>

                  {/* Lone Provider Status Banner & Quick Switcher */}
                  <div className="mt-3">
                    {s.isLoneProvider ? (
                      <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-amber-700" />
                            <span>Exclusive Asset: {s.loneProviderType}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleToggleLoneProvider(s, e)}
                            className="text-[10px] text-amber-800 underline font-bold hover:text-amber-950"
                            title="Click to switch to standard provider"
                          >
                            Switch to Standard
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-600 leading-snug">
                          Protected by automatic clash engine against concurrent bookings.
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 text-xs flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          Concurrent group bookings permitted.
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleToggleLoneProvider(s, e)}
                          className="text-[10px] text-amber-800 font-bold hover:underline"
                          title="Click to mark as lone provider"
                        >
                          + Mark as Lone Provider
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed line-clamp-3">
                    {s.notes || 'No additional notes provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold text-slate-700">WhatsApp: {s.whatsappNumber || s.phone}</span>
                    </div>
                    {s.rating && (
                      <span className="font-bold text-amber-600 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-500" />
                        <span>{s.rating}.0</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-amber-600" />
                    <span>{s.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No suppliers found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No verified suppliers match your search filters. Click below to add a new supplier.
              </p>
              <button
                onClick={handleOpenAddSupplier}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-sm"
              >
                Add New Supplier
              </button>
            </div>
          )}
        </div>
      )}

      {/* Supplier Service Voucher Modal */}
      {selectedBookingForVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Official Supplier Service Voucher
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={() => setSelectedBookingForVoucher(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    TourOps 360 Voucher
                  </h3>
                  <div className="text-slate-500">Authorized Tour Operator Exchange Order</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-slate-900">
                    {selectedBookingForVoucher.voucherNumber || 'VOUCH-PENDING'}
                  </div>
                  <div className="text-slate-500">Date: {selectedBookingForVoucher.date}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Supplier:</span>
                  <div className="font-bold text-slate-900 text-sm">
                    {suppliers.find((s) => s.id === selectedBookingForVoucher.supplierId)?.name}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Service Authorized:</span>
                  <div className="font-semibold text-slate-800">
                    {selectedBookingForVoucher.serviceDescription}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Party Size:</span>
                  <div className="font-semibold text-slate-800">
                    {selectedBookingForVoucher.guestsCount} VIP Guests
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 space-y-1">
                <div className="font-bold">Billing &amp; Payment Confirmation</div>
                <div>Charges direct to TourOps 360 Corporate Account. Do not solicit payment from passengers.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Booking Modal */}
      {isAddBookingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create Supplier Booking Request</h3>

            <form onSubmit={handleCreateBooking} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Select Supplier</label>
                <select
                  required
                  value={newBooking.supplierId}
                  onChange={(e) => setNewBooking({ ...newBooking, supplierId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category}) {s.isLoneProvider ? '★ LONE PROVIDER' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Link to Tour Project</label>
                <select
                  required
                  value={newBooking.tripId}
                  onChange={(e) => setNewBooking({ ...newBooking, tripId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  {itineraries.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.code} - {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Service Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 68ft Riva Superyacht Capri Full Day Charter"
                  value={newBooking.serviceDescription}
                  onChange={(e) => setNewBooking({ ...newBooking, serviceDescription: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Service Date</label>
                  <input
                    type="date"
                    required
                    value={newBooking.date}
                    onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Guests Count</label>
                  <input
                    type="number"
                    value={newBooking.guestsCount}
                    onChange={(e) => setNewBooking({ ...newBooking, guestsCount: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {hasFullFinancialView ? (
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase">Agreed Cost</label>
                    <input
                      type="number"
                      value={newBooking.cost}
                      onChange={(e) => setNewBooking({ ...newBooking, cost: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                ) : <div />}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Initial Status</label>
                  <select
                    value={newBooking.status}
                    onChange={(e) => setNewBooking({ ...newBooking, status: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="Requested">Requested</option>
                    <option value="Confirmed">Confirmed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBookingOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT SUPPLIER MODAL */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                  <Building2 className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingSupplier ? 'Edit Supplier Profile' : 'Add New Verified Supplier'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Register supplier details and configure lone provider exclusivity status
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddSupplierOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-4">
              {/* Supplier Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Supplier / Provider Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Avi Ron, Master Historian"
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Primary Category *
                  </label>
                  <select
                    value={supCategory}
                    onChange={(e) => setSupCategory(e.target.value as SupplierCategory)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white outline-none"
                  >
                    <option value="Guide">Guide / Specialist Scholar</option>
                    <option value="Transport">Transport &amp; Private Fleet</option>
                    <option value="Accommodation">Accommodation &amp; Villa</option>
                    <option value="Activities & Dining">Activities &amp; Dining / Sommelier</option>
                  </select>
                </div>
              </div>

              {/* CORE REQUIREMENT: ACTIVELY ASK WHETHER SUPPLIER IS A LONE PROVIDER */}
              <div
                className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${
                  loneProviderError
                    ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-300/40'
                    : supIsLoneProvider === null
                    ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-200/50'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>Is this supplier a Lone Provider? *</span>
                  </label>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      supIsLoneProvider === null
                        ? 'bg-amber-200 text-amber-950 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {supIsLoneProvider === null ? '⚠️ Selection Required' : 'Selection Confirmed'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-snug">
                  Please actively specify whether this supplier is an exclusive specialist resource subject to double-booking clash alerts:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Lone Supplier */}
                  <button
                    type="button"
                    onClick={() => {
                      setSupIsLoneProvider(true);
                      setLoneProviderError(null);
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      supIsLoneProvider === true
                        ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-400 text-amber-950 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs flex items-center gap-1">
                        <span>🌟</span>
                        <span>Yes &ndash; Lone Provider</span>
                      </span>
                      {supIsLoneProvider === true && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-500 text-slate-950">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-amber-900 mt-1 leading-snug">
                      <strong>Exclusive Provider.</strong> Cannot take concurrent bookings across different itineraries on the same date (triggers clash prevention).
                    </div>
                  </button>

                  {/* Option 2: Not Lone Supplier (Standard) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSupIsLoneProvider(false);
                      setLoneProviderError(null);
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      supIsLoneProvider === false
                        ? 'bg-blue-100/90 border-blue-500 ring-2 ring-blue-400 text-blue-950 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs flex items-center gap-1">
                        <span>🏢</span>
                        <span>No &ndash; Standard Supplier</span>
                      </span>
                      {supIsLoneProvider === false && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-blue-600 text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 leading-snug">
                      <strong>Non-Lone Provider.</strong> Can handle multiple simultaneous bookings (e.g. hotel, museum, restaurant, group transport).
                    </div>
                  </button>
                </div>

                {loneProviderError && (
                  <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-xl text-rose-900 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{loneProviderError}</span>
                  </div>
                )}

                {/* Sub-selector for Lone Provider Type if marked as Lone Supplier */}
                {supIsLoneProvider === true && (
                  <div className="pt-2 border-t border-amber-200 space-y-1 animate-fade-in">
                    <label className="text-[11px] font-extrabold text-amber-950 uppercase block">
                      Exclusive Asset Classification:
                    </label>
                    <select
                      value={supLoneProviderType}
                      onChange={(e) => setSupLoneProviderType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl font-bold text-amber-950 outline-none"
                    >
                      <option value="Exclusive Specialist Guide">Exclusive Specialist Guide (Individual Expert)</option>
                      <option value="Private Yacht Charter">Private Yacht Charter (Single Vessel)</option>
                      <option value="Sole Luxury Van/Chauffeur">Sole Luxury Van/Chauffeur (Dedicated Vehicle)</option>
                      <option value="Private Villa Host">Private Villa Host (Exclusive Residence)</option>
                      <option value="Bespoke Sommelier">Bespoke Sommelier (Personal Masterclass)</option>
                    </select>
                    <p className="text-[10px] text-amber-800">
                      When this lone provider is assigned to an activity on a date, any concurrent booking on the same date triggers an immediate Lone Provider Double Booking conflict alert.
                    </p>
                  </div>
                )}
              </div>

              {/* Location: City and Country */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jerusalem, Rome, Paris"
                    value={supCity}
                    onChange={(e) => setSupCity(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Country *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Israel, Italy, France"
                    value={supCountry}
                    onChange={(e) => setSupCountry(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Contacts: Contact Person, Email, WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Avi Ron"
                    value={supContactPerson}
                    onChange={(e) => setSupContactPerson(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. avi@luxuryjerusalem.com"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Phone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +972-54-889-1122"
                    value={supWhatsapp}
                    onChange={(e) => {
                      setSupWhatsapp(e.target.value);
                      if (!supPhone) setSupPhone(e.target.value);
                    }}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Rating and Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Quality Rating</label>
                  <select
                    value={supRating}
                    onChange={(e) => setSupRating(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white outline-none"
                  >
                    <option value={5}>5.0 Stars (Premier Luxury)</option>
                    <option value={4}>4.0 Stars (Superior)</option>
                    <option value={3}>3.0 Stars (Standard)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Specialties &amp; Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. VIP Hebrew/English scholar, private key to subterranean excavations..."
                    value={supNotes}
                    onChange={(e) => setSupNotes(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingSupplier ? 'Save Supplier Changes' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL BOOKING CONFIRMATION MODAL */}
      {isCancelModalOpen && bookingToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Cancel &amp; Remove Booking</h3>
                <p className="text-[11px] text-slate-500">Lone Provider Schedule Clearance</p>
              </div>
            </div>

            {(() => {
              const sup = suppliers.find((s) => s.id === bookingToCancel.supplierId);
              const trip = itineraries.find((t) => t.id === bookingToCancel.tripId);
              return (
                <div className="space-y-3">
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">{sup?.name}</span>
                      {sup?.isLoneProvider && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-500 text-slate-950 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-slate-950" />
                          <span>Lone Provider</span>
                        </span>
                      )}
                    </div>
                    <div className="text-slate-700">
                      <strong>Service:</strong> {bookingToCancel.serviceDescription}
                    </div>
                    <div className="text-slate-700">
                      <strong>Date:</strong> {bookingToCancel.date} {bookingToCancel.startTime && `(${bookingToCancel.startTime} - ${bookingToCancel.endTime})`}
                    </div>
                    <div className="text-slate-700">
                      <strong>Tour:</strong> {trip?.code || 'Trip'} &bull; {bookingToCancel.guestsCount} Guests
                    </div>
                    {hasFullFinancialView && (
                      <div className="text-slate-700 font-bold">
                        <strong>Cost:</strong> {formatMoney(bookingToCancel.cost, bookingToCancel.currency)}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-700" />
                      <span>Clash Prevention Guarantee:</span>
                    </p>
                    <p className="text-[11px] text-amber-900 leading-snug">
                      Cancelling this booking will <strong>permanently remove it from the system</strong> so that it <strong>does not show as a clash for lone providers</strong> on {bookingToCancel.date}.
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setBookingToCancel(null);
                }}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelBooking}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Cancellation &amp; Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BOOKING MODAL */}
      {isEditBookingOpen && editingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Edit Supplier Booking</h3>
                  <p className="text-[11px] text-slate-500">Modify status, timing, or cancel booking</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditBookingOpen(false);
                  setEditingBooking(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEditBooking} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Service Description *</label>
                <input
                  type="text"
                  required
                  value={editingBooking.serviceDescription}
                  onChange={(e) => setEditingBooking({ ...editingBooking, serviceDescription: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Booking Status *</label>
                  <select
                    value={editingBooking.status}
                    onChange={(e) => setEditingBooking({ ...editingBooking, status: e.target.value as SupplierBookingStatus })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white outline-none"
                  >
                    <option value="Requested">Requested</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Voucher Issued">Voucher Issued</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancel &amp; Remove</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Date *</label>
                  <input
                    type="date"
                    required
                    value={editingBooking.date}
                    onChange={(e) => setEditingBooking({ ...editingBooking, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Start Time</label>
                  <input
                    type="time"
                    value={editingBooking.startTime || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, startTime: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">End Time</label>
                  <input
                    type="time"
                    value={editingBooking.endTime || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, endTime: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Guests</label>
                  <input
                    type="number"
                    min="1"
                    value={editingBooking.guestsCount}
                    onChange={(e) => setEditingBooking({ ...editingBooking, guestsCount: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {hasFullFinancialView ? (
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase">Agreed Cost</label>
                    <input
                      type="number"
                      min="0"
                      value={editingBooking.cost}
                      onChange={(e) => setEditingBooking({ ...editingBooking, cost: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white outline-none"
                    />
                  </div>
                ) : <div />}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Currency</label>
                  <select
                    value={editingBooking.currency}
                    onChange={(e) => setEditingBooking({ ...editingBooking, currency: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white outline-none"
                  >
                    {['USD', 'EUR', 'GBP', 'ILS'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Operational Notes</label>
                <textarea
                  rows={2}
                  value={editingBooking.notes || ''}
                  onChange={(e) => setEditingBooking({ ...editingBooking, notes: e.target.value })}
                  placeholder="Special instructions, dietary notes for guide, VIP preferences..."
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setBookingToCancel(editingBooking);
                    setIsEditBookingOpen(false);
                    setIsCancelModalOpen(true);
                  }}
                  className="px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 rounded-xl font-bold border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel &amp; Remove Booking</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditBookingOpen(false);
                      setEditingBooking(null);
                    }}
                    className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
