import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Bell,
  Trash2,
  Mail,
  Send,
  Check,
  CreditCard,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Filter,
  Coins,
  Briefcase,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CurrencyCode, SupplierInvoice, SupplierInvoiceStatus } from '../../types';
import { FxRatesModal } from '../finance/FxRatesModal';

export const SupplierInvoicesHub: React.FC = () => {
  const {
    supplierInvoices,
    addSupplierInvoice,
    updateSupplierInvoice,
    deleteSupplierInvoice,
    markSupplierInvoicePaid,
    suppliers,
    staff,
    itineraries,
    convertCurrency,
    formatMoney,
    tasks,
    setActiveView,
    setSelectedTripId,
    hasFullFinancialView,
    currentUser,
    firebaseUser,
  } = useApp();

  const canUserSeeInvoiceAmount = (inv?: SupplierInvoice | null) => {
    if (!inv) return false;
    if (hasFullFinancialView) return true;
    const isCreator = Boolean(
      (currentUser?.id && inv.createdByStaffId === currentUser.id) ||
      (currentUser?.name && inv.createdBy === currentUser.name) ||
      (firebaseUser?.uid && inv.createdByUid === firebaseUser.uid)
    );
    return isCreator;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [tourFilter, setTourFilter] = useState<string>('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFxModalOpen, setIsFxModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<SupplierInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Wire' | 'Company Card' | 'Petty Cash' | 'Direct Debit'>('Bank Wire');
  const [reassignInvoice, setReassignInvoice] = useState<SupplierInvoice | null>(null);
  const [reassignTripId, setReassignTripId] = useState<string>('');

  // Form State
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formTripId, setFormTripId] = useState('');
  const [formIssueDate, setFormIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [formAmount, setFormAmount] = useState<number>(1500);
  const [formCurrency, setFormCurrency] = useState<CurrencyCode>('USD');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<SupplierInvoiceStatus>('Pending Review');
  const [formCreateReminder, setFormCreateReminder] = useState(true);
  const [formAssignedStaffId, setFormAssignedStaffId] = useState(staff[2]?.id || staff[0]?.id || '');
  const [formNotes, setFormNotes] = useState('');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAddModal = () => {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const defaultSup = suppliers[0];
    setFormInvoiceNumber(`INV-${defaultSup ? defaultSup.name.slice(0, 3).toUpperCase() : 'SUP'}-${randNum}`);
    setFormSupplierId(defaultSup?.id || '');
    setFormTripId(itineraries[0]?.id || '');
    setFormIssueDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setFormDueDate(d.toISOString().split('T')[0]);
    setFormAmount(2400);
    setFormCurrency('USD');
    setFormDescription('Guiding & private tour operations settlement');
    setFormStatus('Pending Review');
    setFormCreateReminder(true);
    setFormAssignedStaffId(staff.find((s) => s.department.includes('Finance'))?.id || staff[0]?.id || '');
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const handleCreateSupplierInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInvoiceNumber.trim() || !formSupplierId) return;

    const newInvoice: SupplierInvoice = {
      id: `sinv-${Date.now()}`,
      invoiceNumber: formInvoiceNumber.trim(),
      supplierId: formSupplierId,
      tripId: formTripId || undefined,
      issueDate: formIssueDate,
      dueDate: formDueDate,
      amount: Number(formAmount) || 0,
      currency: formCurrency,
      description: formDescription.trim(),
      status: formStatus,
      assignedStaffId: formCreateReminder ? formAssignedStaffId : undefined,
      paymentReminderEnabled: formCreateReminder,
      notes: formNotes.trim() || undefined,
      createdByStaffId: currentUser?.id,
      createdByUid: firebaseUser?.uid,
      createdBy: currentUser?.name || firebaseUser?.displayName || 'Team Member',
    };

    addSupplierInvoice(newInvoice, formCreateReminder);
    setIsAddModalOpen(false);

    const worker = staff.find((s) => s.id === formAssignedStaffId);
    showToast(
      formCreateReminder && worker
        ? `Created supplier invoice ${newInvoice.invoiceNumber} and added payment task to ${worker.name}'s task list (Due: ${newInvoice.dueDate})`
        : `Created supplier invoice ${newInvoice.invoiceNumber}`
    );
  };

  const handleConfirmPayment = () => {
    if (!selectedInvoiceForPayment) return;
    markSupplierInvoicePaid(selectedInvoiceForPayment.id, paymentMethod);
    showToast(
      `Marked invoice ${selectedInvoiceForPayment.invoiceNumber} as Paid. Payment reminder task removed from staff tasks.`
    );
    setSelectedInvoiceForPayment(null);
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return supplierInvoices.filter((inv) => {
      const sup = suppliers.find((s) => s.id === inv.supplierId);
      const matchesSearch =
        !searchQuery.trim() ||
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sup && sup.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchesSupplier = supplierFilter === 'ALL' || inv.supplierId === supplierFilter;
      const matchesStaff = staffFilter === 'ALL' || inv.assignedStaffId === staffFilter;
      const matchesTour =
        tourFilter === 'ALL' ||
        (tourFilter === 'OVERHEAD' ? !inv.tripId : inv.tripId === tourFilter);

      return matchesSearch && matchesStatus && matchesSupplier && matchesStaff && matchesTour;
    });
  }, [supplierInvoices, searchQuery, statusFilter, supplierFilter, staffFilter, tourFilter, suppliers]);

  // Totals calculations
  const visibleInvoicesForUser = useMemo(() => {
    return supplierInvoices.filter((inv) => canUserSeeInvoiceAmount(inv));
  }, [supplierInvoices, hasFullFinancialView, currentUser, firebaseUser]);

  const totalPayableUSD = visibleInvoicesForUser.reduce(
    (sum, inv) => sum + convertCurrency(inv.amount, inv.currency, 'USD'),
    0
  );
  const pendingPayableUSD = visibleInvoicesForUser
    .filter((inv) => inv.status !== 'Paid')
    .reduce((sum, inv) => sum + convertCurrency(inv.amount, inv.currency, 'USD'), 0);
  const paidUSD = visibleInvoicesForUser
    .filter((inv) => inv.status === 'Paid')
    .reduce((sum, inv) => sum + convertCurrency(inv.amount, inv.currency, 'USD'), 0);

  const getStatusBadge = (status: SupplierInvoiceStatus) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Approved':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Pending Review':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Overdue':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'Draft':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-200 text-slate-800">
              Module 3B: Accounts Payable
            </span>
            <span className="text-xs text-slate-500 font-medium">Supplier Settlements &amp; Reminders</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Supplier Invoices &amp; Payment Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track vendor bills, schedule payments, and automatically assign invoice payment reminders to staff tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFxModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Update multi-currency exchange rates"
          >
            <Coins className="w-4 h-4" />
            <span>Manage FX Rates</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>New Supplier Invoice</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Total Invoices</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {supplierInvoices.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {hasFullFinancialView
              ? `$${totalPayableUSD.toLocaleString()} USD Total Value`
              : `${supplierInvoices.length} Registered Accounts`}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center justify-between">
            <span>Outstanding To Pay</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">
            {hasFullFinancialView
              ? `$${pendingPayableUSD.toLocaleString()}`
              : supplierInvoices.filter((i) => i.status !== 'Paid').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {supplierInvoices.filter((i) => i.status !== 'Paid').length} invoices pending settlement
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center justify-between">
            <span>Settled / Paid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            {hasFullFinancialView
              ? `$${paidUSD.toLocaleString()}`
              : supplierInvoices.filter((i) => i.status === 'Paid').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {supplierInvoices.filter((i) => i.status === 'Paid').length} settled supplier bills
          </div>
        </div>

        <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white p-5 rounded-3xl border border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
            <span>Staff Task Sync</span>
            <Bell className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-white mt-1">
              Automated Reminders Active
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              Adding a payment reminder instantly assigns a task to that employee.
            </div>
          </div>
          <button
            onClick={() => setActiveView('tasks')}
            className="mt-2 text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 underline"
          >
            <span>View Staff, Tasks &amp; Reminders</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice number, description, or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Paid">Paid</option>
            <option value="Draft">Draft</option>
            <option value="Overdue">Overdue</option>
          </select>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="ALL">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="ALL">All Staff Assignees</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.department.split(' ')[0]})
              </option>
            ))}
          </select>

          <select
            value={tourFilter}
            onChange={(e) => setTourFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
          >
            <option value="ALL">All Tours &amp; Overhead</option>
            <option value="OVERHEAD">General Operational Overhead</option>
            {itineraries.map((t) => (
              <option key={t.id} value={t.id}>
                Tour: {t.tourName || t.title} ({t.code})
              </option>
            ))}
          </select>

          {(searchQuery || statusFilter !== 'ALL' || supplierFilter !== 'ALL' || staffFilter !== 'ALL' || tourFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setSupplierFilter('ALL');
                setStaffFilter('ALL');
                setTourFilter('ALL');
              }}
              className="text-xs text-amber-700 font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing {filteredInvoices.length} of {supplierInvoices.length} invoices
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Invoice # &amp; Description</th>
                <th className="px-4 py-3.5">Supplier / Vendor</th>
                <th className="px-4 py-3.5">Trip Link</th>
                <th className="px-4 py-3.5">Due Date</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Staff Payment Task</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const sup = suppliers.find((s) => s.id === inv.supplierId);
                const trip = itineraries.find((t) => t.id === inv.tripId);
                const assignee = staff.find((s) => s.id === inv.assignedStaffId);
                const isPaid = inv.status === 'Paid';
                const todayStr = new Date().toISOString().split('T')[0];
                const isOverdue = inv.dueDate < todayStr && !isPaid;

                return (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      isPaid ? 'opacity-80' : ''
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="font-extrabold text-slate-900 font-mono text-xs flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inv.invoiceNumber}</span>
                      </div>
                      <div className="text-slate-600 font-medium text-[11px] mt-0.5 max-w-sm line-clamp-1">
                        {inv.description}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Issued: {inv.issueDate}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sup?.name || 'External Vendor'}</span>
                      </div>
                      {sup?.isLoneProvider && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
                          Lone Provider
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {trip ? (
                        <div className="space-y-1">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 block w-fit max-w-[170px] truncate"
                            title={`${trip.code}: ${trip.tourName || trip.title}`}
                          >
                            {trip.code}: {trip.tourName || trip.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedTripId(trip.id);
                                setActiveView('tour-management');
                              }}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                              title="Open this tour's dedicated Tour Management Area"
                            >
                              <Briefcase className="w-3 h-3" />
                              <span>Tour Area</span>
                            </button>
                            <span className="text-slate-300 text-[10px]">&bull;</span>
                            <button
                              onClick={() => {
                                setReassignInvoice(inv);
                                setReassignTripId(inv.tripId || '');
                              }}
                              className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                              title="Re-assign to another tour or overhead"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-slate-400 text-[11px] block">General Overhead</span>
                          <button
                            onClick={() => {
                              setReassignInvoice(inv);
                              setReassignTripId('');
                            }}
                            className="text-[10px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                            title="Mark this invoice as belonging to a specific tour"
                          >
                            <Briefcase className="w-3 h-3 text-amber-600" />
                            <span>Assign to Tour</span>
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span
                          className={`font-bold ${
                            isOverdue ? 'text-red-600 font-black' : 'text-slate-800'
                          }`}
                        >
                          {inv.dueDate}
                        </span>
                      </div>
                      {isOverdue && (
                        <span className="text-[9px] font-black text-red-600 uppercase">
                          Overdue
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {canUserSeeInvoiceAmount(inv) ? (
                        <>
                          <div className="font-extrabold text-slate-900 text-sm">
                            {formatMoney(inv.amount, inv.currency)}
                          </div>
                          {inv.currency !== 'USD' && (
                            <div className="text-[10px] text-slate-400 font-semibold">
                              ≈ ${convertCurrency(inv.amount, inv.currency, 'USD').toLocaleString()} USD
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-slate-400 font-medium text-sm">—</div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border inline-block ${getStatusBadge(
                          inv.status
                        )}`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {assignee ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 text-[11px]">
                            {assignee.avatar && assignee.avatar.trim() ? (
                              <img
                                src={assignee.avatar.trim()}
                                alt={assignee.name}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center uppercase">
                                {assignee.name ? assignee.name[0] : 'S'}
                              </div>
                            )}
                            <span className="font-bold text-slate-800">{assignee.name}</span>
                          </div>
                          {isPaid ? (
                            <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                              <Check className="w-2.5 h-2.5" />
                              <span>Task Settled</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                              <Bell className="w-2.5 h-2.5 text-amber-600" />
                              <span>Task in Employee Roster</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No reminder set</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {!isPaid && (
                          <button
                            onClick={() => setSelectedInvoiceForPayment(inv)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                            title="Record supplier payment"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Mark Paid</span>
                          </button>
                        )}

                        <button
                          onClick={() => deleteSupplierInvoice(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete invoice"
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

        {filteredInvoices.length === 0 && (
          <div className="p-12 text-center space-y-3">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No matching supplier invoices</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create a supplier invoice or adjust your search filter criteria.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              New Supplier Invoice
            </button>
          </div>
        )}
      </div>

      {/* New Supplier Invoice Modal with Reminder to Staff */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Create Supplier Invoice &amp; Payment Task
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Record accounts payable bill and automatically schedule employee payment reminders.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSupplierInvoice} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-AVI-8821"
                    value={formInvoiceNumber}
                    onChange={(e) => setFormInvoiceNumber(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Supplier / Vendor *</label>
                  <select
                    required
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white outline-none"
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category}) {s.isLoneProvider ? '★ (LONE PROVIDER)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mark as Belonging to Tour (Tour Assignment)</span>
                  </label>
                  <span className="text-[10px] text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    Tour Management Sync
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Marking an invoice as belonging to a specific tour calculates it as an expense to determine that tour&apos;s Gross Profit and Margin, and automatically displays it in that tour&apos;s Tour Management Area. Assigning it to General Overhead calculates it as an overhead expense across your executive dashboard profit margin.
                </p>
                <select
                  value={formTripId}
                  onChange={(e) => setFormTripId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">-- General Operational Overhead (Calculated as Business Overhead) --</option>
                  {itineraries.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tourName || t.title} [{t.code}] &bull; {t.destination}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={formIssueDate}
                    onChange={(e) => setFormIssueDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-amber-900 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Amount *</label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-sm focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Currency *</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value as CurrencyCode)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="ILS">ILS (₪)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="CHF">CHF (CHF)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Description / Services *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2-Day Private Archaeology Master Guidance for Lord Sterling"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as SupplierInvoiceStatus)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white outline-none"
                  >
                    <option value="Pending Review">Pending Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Paid">Paid</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Internal Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Check bank wire coordinates"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* AUTOMATED REMINDER TO STAFF MEMBER SECTION */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="createReminderCheckbox"
                    checked={formCreateReminder}
                    onChange={(e) => setFormCreateReminder(e.target.checked)}
                    className="mt-1 w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="createReminderCheckbox"
                      className="text-xs font-extrabold text-amber-950 block cursor-pointer"
                    >
                      Create automated reminder to staff member to pay this invoice
                    </label>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                      When enabled, this automatically creates a high-priority payment task in the assigned employee&apos;s task roster due on <strong>{formDueDate}</strong>.
                    </p>
                  </div>
                </div>

                {formCreateReminder && (
                  <div className="pt-2 border-t border-amber-200/60">
                    <label className="text-xs font-bold text-amber-950 block mb-1">
                      Assign Payment Task to Staff Member:
                    </label>
                    <select
                      value={formAssignedStaffId}
                      onChange={(e) => setFormAssignedStaffId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 outline-none"
                    >
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {s.department} ({s.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Create Invoice &amp; Remind Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Confirmation Modal */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Confirm Supplier Settlement
                </h3>
                <p className="text-[11px] text-slate-500">
                  Settle bill &amp; automatically clear staff payment task.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedInvoiceForPayment.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Payable:</span>
                <span className="font-bold text-slate-900">
                  {canUserSeeInvoiceAmount(selectedInvoiceForPayment)
                    ? formatMoney(selectedInvoiceForPayment.amount, selectedInvoiceForPayment.currency)
                    : '—'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
              >
                <option value="Bank Wire">Bank Wire / SWIFT / SEPA</option>
                <option value="Company Card">Company Card (AMEX / Visa)</option>
                <option value="Direct Debit">Direct Debit</option>
                <option value="Petty Cash">Petty Cash</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Confirm Settlement &amp; Clear Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Tour Reassignment Modal */}
      {reassignInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  Tour Assignment
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Assign Invoice to Specific Tour
                </h3>
              </div>
              <button
                onClick={() => setReassignInvoice(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div>Invoice: <strong className="font-mono text-slate-900">{reassignInvoice.invoiceNumber}</strong></div>
              <div>Amount: <strong className="text-slate-900">{formatMoney(reassignInvoice.amount, reassignInvoice.currency)}</strong></div>
              <div>Description: <span className="text-slate-600">{reassignInvoice.description}</span></div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>Select Tour Destination / Itinerary</span>
              </label>
              <select
                value={reassignTripId}
                onChange={(e) => setReassignTripId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white outline-none"
              >
                <option value="">-- General Operational Overhead (No Tour) --</option>
                {itineraries.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tourName || t.title} [{t.code}]
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                When assigned to a tour, this invoice displays in the tour&apos;s specific management area and running P&amp;L report, while still displaying in this overall supplier invoices list.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setReassignInvoice(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateSupplierInvoice({
                    ...reassignInvoice,
                    tripId: reassignTripId ? reassignTripId : undefined,
                  });
                  const linkedTour = itineraries.find((t) => t.id === reassignTripId);
                  showToast(
                    reassignTripId && linkedTour
                      ? `Invoice ${reassignInvoice.invoiceNumber} marked as belonging to ${linkedTour.tourName || linkedTour.title}! It now appears in this tour's management area while remaining in the overall list.`
                      : `Invoice ${reassignInvoice.invoiceNumber} unlinked from tour (marked as general overhead).`
                  );
                  setReassignInvoice(null);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Save Tour Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FX Rates Management Modal */}
      <FxRatesModal
        isOpen={isFxModalOpen}
        onClose={() => setIsFxModalOpen(false)}
      />
    </div>
  );
};
