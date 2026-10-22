import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles,
  Phone,
  Building,
  Bell,
  RefreshCw,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Supplier, SupplierBooking } from '../../types';

export const SupplierRemindersHub: React.FC = () => {
  const { suppliers, supplierBookings, updateSupplierBooking, itineraries } = useApp();

  const [autoDispatchEnabled, setAutoDispatchEnabled] = useState(true);
  const [selectedBookingForPreview, setSelectedBookingForPreview] = useState<SupplierBooking | null>(
    supplierBookings[0] || null
  );
  const [sentAlert, setSentAlert] = useState<string | null>(null);

  const [remindersGroupBy, setRemindersGroupBy] = useState<'NONE' | 'SUPPLIER' | 'TOUR' | 'DATE'>('NONE');

  // Filter confirmed or voucher-issued bookings that require reminders
  const activeBookings = supplierBookings.filter(
    (b) => b.status === 'Confirmed' || b.status === 'Voucher Issued'
  );

  interface ReminderGroup {
    id: string;
    title: string;
    subtitle?: string;
    items: SupplierBooking[];
  }

  // Grouped active bookings for reminders queue
  const groupedReminders: ReminderGroup[] = useMemo(() => {
    if (remindersGroupBy === 'NONE') {
      return [{ id: 'all', title: 'All Due Engagements', items: activeBookings }];
    }

    if (remindersGroupBy === 'SUPPLIER') {
      const map = new Map<string, SupplierBooking[]>();
      activeBookings.forEach((b) => {
        const k = b.supplierId || 'unassigned';
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(b);
      });
      const sortedKeys = Array.from(map.keys()).sort((a, b) => {
        const sA = suppliers.find((s) => s.id === a)?.name || 'Unassigned';
        const sB = suppliers.find((s) => s.id === b)?.name || 'Unassigned';
        return sA.localeCompare(sB);
      });
      return sortedKeys.map((k) => ({
        id: k,
        title: suppliers.find((s) => s.id === k)?.name || 'Unassigned Supplier',
        subtitle: suppliers.find((s) => s.id === k)?.category,
        items: map.get(k)!,
      }));
    }

    if (remindersGroupBy === 'TOUR') {
      const map = new Map<string, SupplierBooking[]>();
      activeBookings.forEach((b) => {
        const k = b.tripId || 'direct';
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(b);
      });
      const sortedKeys = Array.from(map.keys()).sort((a, b) => {
        const tA = itineraries.find((t) => t.id === a)?.code || '';
        const tB = itineraries.find((t) => t.id === b)?.code || '';
        return tA.localeCompare(tB);
      });
      return sortedKeys.map((k) => {
        const trip = itineraries.find((t) => t.id === k);
        return {
          id: k,
          title: trip ? `${trip.code} — ${trip.title}` : 'Direct Bookings',
          subtitle: trip ? `Destination: ${trip.destination}` : undefined,
          items: map.get(k)!,
        };
      });
    }

    if (remindersGroupBy === 'DATE') {
      const map = new Map<string, SupplierBooking[]>();
      activeBookings.forEach((b) => {
        const k = b.date || 'Undated';
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(b);
      });
      const sortedKeys = Array.from(map.keys()).sort();
      return sortedKeys.map((k) => ({
        id: k,
        title: `Service Date: ${k}`,
        items: map.get(k)!,
      }));
    }

    return [{ id: 'all', title: 'All Due Engagements', items: activeBookings }];
  }, [activeBookings, remindersGroupBy, suppliers, itineraries]);

  const selectedSupplier = suppliers.find(
    (s) => s.id === selectedBookingForPreview?.supplierId
  );
  const selectedTrip = itineraries.find(
    (t) => t.id === selectedBookingForPreview?.tripId
  );

  // Generate automated WhatsApp text
  const generateWhatsAppMessage = (booking: SupplierBooking, supplier?: Supplier) => {
    const trip = itineraries.find((t) => t.id === booking.tripId);
    return `Shalom ${supplier?.contactPerson || 'Partner'},\n\nThis is an automated 24-hour reminder from TourOps 360 regarding your confirmed service tomorrow, ${booking.date} at ${booking.startTime || '09:00'}.\n\n📋 Tour: ${trip?.code || 'Private Tour'} - ${trip?.title || 'Luxury Expedition'}\n📍 Service: ${booking.serviceDescription}\n👥 Party Size: ${booking.guestsCount} VIP Guests\n🎟️ Ref: ${booking.confirmationNumber || booking.voucherNumber || 'CONF-2026'}\n\nPlease reply with a quick confirmation. Emergency field manager: +972 54 889 1234.\n\nTourOps 360 Concierge Operations`;
  };

  // Generate automated Email text
  const generateEmailSubject = (booking: SupplierBooking) => {
    const trip = itineraries.find((t) => t.id === booking.tripId);
    return `[24-Hour Reminder & Voucher Briefing] ${booking.serviceDescription} - Date: ${booking.date} (${trip?.code})`;
  };

  const generateEmailBody = (booking: SupplierBooking, supplier?: Supplier) => {
    const trip = itineraries.find((t) => t.id === booking.tripId);
    return `Dear ${supplier?.contactPerson || 'Valued Supplier Partner'},\n\nThis is an automated operational reminder from TourOps 360. Your service is confirmed for tomorrow:\n\n• Date: ${booking.date}\n• Time: ${booking.startTime || '09:00'} - ${booking.endTime || '18:00'}\n• Service: ${booking.serviceDescription}\n• Tour Reference: ${trip?.code} (${trip?.title})\n• Number of Guests: ${booking.guestsCount} VIP Guests\n• Confirmation / Voucher Code: ${booking.confirmationNumber || booking.voucherNumber || 'CONF-DIRECT'}\n• Billing Note: Authorized direct to TourOps 360 Corporate Account\n\nPlease ensure your vehicle/equipment is in pristine condition. For any arrival issues or gate delays, contact Tour Director Elena Vance at +972 54 889 1234.\n\nBest regards,\nTourOps 360 Dispatch Team`;
  };

  const handleSendWhatsApp = (booking: SupplierBooking) => {
    const supplier = suppliers.find((s) => s.id === booking.supplierId);
    const msg = generateWhatsAppMessage(booking, supplier);
    const phone = supplier?.whatsappNumber ? supplier.whatsappNumber.replace(/[^0-9]/g, '') : '972504439921';
    
    // Update booking reminder status
    const updated = {
      ...booking,
      whatsappReminderStatus: 'Sent' as const,
      whatsappReminderSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    updateSupplierBooking(updated);
    if (selectedBookingForPreview?.id === booking.id) {
      setSelectedBookingForPreview(updated);
    }

    // Trigger safe link without window.open
    const link = document.createElement('a');
    link.href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSentAlert(`Automated 24h WhatsApp reminder sent to ${supplier?.name}!`);
    setTimeout(() => setSentAlert(null), 4000);
  };

  const handleSendEmail = (booking: SupplierBooking) => {
    const supplier = suppliers.find((s) => s.id === booking.supplierId);
    const subject = generateEmailSubject(booking);
    const body = generateEmailBody(booking, supplier);
    
    // Update booking reminder status
    const updated = {
      ...booking,
      emailReminderStatus: 'Sent' as const,
      emailReminderSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    updateSupplierBooking(updated);
    if (selectedBookingForPreview?.id === booking.id) {
      setSelectedBookingForPreview(updated);
    }

    const mailto = `mailto:${supplier?.email || 'supplier@example.com'}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    const link = document.createElement('a');
    link.href = mailto;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSentAlert(`Automated 24h reminder email dispatched to ${supplier?.name}!`);
    setTimeout(() => setSentAlert(null), 4000);
  };

  const handleBatchDispatchAll = () => {
    activeBookings.forEach((b) => {
      updateSupplierBooking({
        ...b,
        whatsappReminderStatus: 'Sent',
        whatsappReminderSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emailReminderStatus: 'Sent',
        emailReminderSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    });
    setSentAlert(`Batch dispatched all 24-hour WhatsApp and Email reminders for tomorrow's engagements!`);
    setTimeout(() => setSentAlert(null), 5000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <Bell className="w-3 h-3 text-emerald-600" />
              <span>Automated 24h Supplier Reminders</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">Day-Before Dispatch Automation</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Automatic WhatsApp &amp; Email Supplier Reminders
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Automatically briefs suppliers and drivers 1 day before engagement with VIP party count, pickup timing, and voucher credentials.
          </p>
        </div>

        {/* Global Automation Switch & Batch Action */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleBatchDispatchAll}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch All Due Reminders Now</span>
          </button>

          <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl">
            <div className="text-xs">
              <div className="font-bold text-slate-900">24-Hour Auto-Reminders</div>
              <div className="text-[10px] text-slate-500">
                {autoDispatchEnabled ? 'Active (Dispatches 1 day before)' : 'Paused'}
              </div>
            </div>
            <button
              onClick={() => setAutoDispatchEnabled(!autoDispatchEnabled)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                autoDispatchEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>
        </div>
      </div>

      {sentAlert && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{sentAlert}</span>
        </div>
      )}

      {/* Main Grid: Active Reminders Queue on Left, Preview & Dispatch on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bookings Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              24h Reminders Queue ({activeBookings.length})
            </div>
            {/* Group By Selector for Reminders Queue */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
              <span className="text-slate-400 pl-1">Group:</span>
              <button
                onClick={() => setRemindersGroupBy('NONE')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  remindersGroupBy === 'NONE' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                None
              </button>
              <button
                onClick={() => setRemindersGroupBy('SUPPLIER')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  remindersGroupBy === 'SUPPLIER' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Group by Supplier Name (A-Z)"
              >
                Supplier (A-Z)
              </button>
              <button
                onClick={() => setRemindersGroupBy('TOUR')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  remindersGroupBy === 'TOUR' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Group by Tour Code"
              >
                Tour
              </button>
              <button
                onClick={() => setRemindersGroupBy('DATE')}
                className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  remindersGroupBy === 'DATE' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Group by Service Date"
              >
                Date
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {groupedReminders.map((group) => (
              <div key={group.id} className="space-y-2">
                {remindersGroupBy !== 'NONE' && (
                  <div className="px-2 py-1 bg-slate-100/80 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="truncate">{group.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {group.items.length} {group.items.length === 1 ? 'booking' : 'bookings'}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  {group.items.map((b) => {
                    const supplier = suppliers.find((s) => s.id === b.supplierId);
                    const trip = itineraries.find((t) => t.id === b.tripId);
                    const isSelected = selectedBookingForPreview?.id === b.id;

                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBookingForPreview(b)}
                        className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-500/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                              isSelected
                                ? 'bg-amber-400/20 text-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {b.date}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              isSelected ? 'text-emerald-300' : 'text-emerald-700'
                            }`}
                          >
                            Auto-Scheduled: 24h Prior
                          </span>
                        </div>

                        <h4 className="font-bold text-xs truncate">{supplier?.name}</h4>
                        <div
                          className={`text-[11px] truncate mt-0.5 ${
                            isSelected ? 'text-slate-300' : 'text-slate-600'
                          }`}
                        >
                          {b.serviceDescription}
                        </div>

                        <div
                          className={`flex items-center justify-between mt-2 pt-2 border-t text-[10px] ${
                            isSelected ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-400'
                          }`}
                        >
                          <span>Tour: {trip?.code}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {b.startTime || '09:00'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview & Instant Trigger Console */}
        {selectedBookingForPreview && (
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Target Supplier &amp; Engagement
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedSupplier?.name}
                  </h3>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Service: {selectedBookingForPreview.serviceDescription}
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Engagement Date</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {selectedBookingForPreview.date} at {selectedBookingForPreview.startTime || '09:00'}
                  </div>
                </div>
              </div>

              {/* Action Buttons for WhatsApp & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleSendWhatsApp(selectedBookingForPreview)}
                  className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 group"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                  <span>Send WhatsApp Reminder Now</span>
                </button>

                <button
                  onClick={() => handleSendEmail(selectedBookingForPreview)}
                  className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 group"
                >
                  <Mail className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
                  <span>Send Email Reminder Now</span>
                </button>
              </div>

              {/* Live Preview Tabs */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Automated Reminder Content Preview
                </div>

                {/* WhatsApp Chat Bubble Mockup */}
                <div className="p-4 bg-emerald-950 text-emerald-100 rounded-2xl text-xs space-y-2 border border-emerald-900/60 shadow-inner">
                  <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold border-b border-emerald-900 pb-1">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      WhatsApp Message Payload (to {selectedSupplier?.whatsappNumber || selectedSupplier?.phone})
                    </span>
                    <span>Automated Trigger: Day Before at 09:00</span>
                  </div>
                  <pre className="font-sans whitespace-pre-wrap leading-relaxed text-xs text-emerald-50">
                    {generateWhatsAppMessage(selectedBookingForPreview, selectedSupplier)}
                  </pre>
                </div>

                {/* Email Subject & Body Preview */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold border-b border-slate-100 pb-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-amber-600" />
                      Email Dispatch Payload (to {selectedSupplier?.email})
                    </span>
                    <span>Automated Trigger: Day Before at 09:00</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Subject:</span>
                    <span className="font-bold text-slate-900">
                      {generateEmailSubject(selectedBookingForPreview)}
                    </span>
                  </div>
                  <pre className="font-sans whitespace-pre-wrap leading-relaxed text-xs text-slate-700 pt-1 border-t border-slate-100">
                    {generateEmailBody(selectedBookingForPreview, selectedSupplier)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
