import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Compass,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Receipt,
  Plus,
  Search,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  ExternalLink,
  Edit3,
  TrendingUp,
  Printer,
  Download,
  Sparkles,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  FileText,
  Check,
  RotateCcw,
  Filter,
  Coins,
  ChevronRight,
  UserCheck,
  Phone,
  Mail,
  Link,
  Layers,
  BarChart3,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CurrencyCode, SupplierInvoice, Invoice, SupplierInvoiceStatus, PaymentRecord } from '../../types';

export const TourManagementArea: React.FC = () => {
  const {
    itineraries,
    selectedTripId,
    setSelectedTripId,
    supplierInvoices,
    addSupplierInvoice,
    updateSupplierInvoice,
    deleteSupplierInvoice,
    markSupplierInvoicePaid,
    invoices,
    recordPayment,
    addInvoice,
    expenses,
    suppliers,
    staff,
    clients,
    supplierBookings,
    convertCurrency,
    formatMoney,
    setActiveView,
    openClientPortal,
    hasFullFinancialView,
  } = useApp();

  // Current selected tour
  const currentTourId = selectedTripId || itineraries[0]?.id || '';
  const currentTour = itineraries.find((t) => t.id === currentTourId) || itineraries[0];

  // Local tab
  const [activeTab, setActiveTab] = useState<'overview' | 'supplier-invoices' | 'income' | 'pnl' | 'operations'>('overview');

  // Modals
  const [isAddSupplierInvoiceOpen, setIsAddSupplierInvoiceOpen] = useState(false);
  const [isLinkExistingInvoiceOpen, setIsLinkExistingInvoiceOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Wire' | 'Credit Card' | 'Stripe' | 'AMEX'>('Bank Wire');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Supplier Invoice Form State
  const [sinvNumber, setSinvNumber] = useState('');
  const [sinvSupplierId, setSinvSupplierId] = useState('');
  const [sinvIssueDate, setSinvIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [sinvDueDate, setSinvDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [sinvAmount, setSinvAmount] = useState<number>(1800);
  const [sinvCurrency, setSinvCurrency] = useState<CurrencyCode>('USD');
  const [sinvDescription, setSinvDescription] = useState('');
  const [sinvStatus, setSinvStatus] = useState<SupplierInvoiceStatus>('Pending Review');
  const [sinvAssignedStaffId, setSinvAssignedStaffId] = useState(staff[0]?.id || '');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (!currentTour) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center space-y-4">
        <Briefcase className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">No Tours Registered Yet</h2>
        <p className="text-slate-500 text-sm">Create an itinerary first to unlock its dedicated Tour Management Area.</p>
        <button
          onClick={() => setActiveView('itineraries')}
          className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
        >
          Go to Itineraries
        </button>
      </div>
    );
  }

  const client = clients.find((c) => c.id === currentTour.clientId);
  const concierge = staff.find((s) => s.id === currentTour.leadStaffId) || staff[0];

  // Specific tour supplier invoices
  const tourSupplierInvoices = useMemo(() => {
    return supplierInvoices.filter((si) => si.tripId === currentTour.id);
  }, [supplierInvoices, currentTour.id]);

  // Unassigned or other supplier invoices that could be linked
  const unassignedSupplierInvoices = useMemo(() => {
    return supplierInvoices.filter((si) => si.tripId !== currentTour.id);
  }, [supplierInvoices, currentTour.id]);

  // Specific tour client invoices
  const tourClientInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.tripId === currentTour.id);
  }, [invoices, currentTour.id]);

  // Specific tour direct expenses
  const tourExpenses = useMemo(() => {
    return expenses.filter((e) => e.tripId === currentTour.id);
  }, [expenses, currentTour.id]);

  // Specific tour supplier bookings
  const tourBookings = useMemo(() => {
    return supplierBookings.filter((b) => b.tripId === currentTour.id);
  }, [supplierBookings, currentTour.id]);

  // Financial Calculations for this Specific Tour
  const tourContractPriceUSD = convertCurrency(currentTour.totalClientPrice, currentTour.currency, 'USD');

  const totalInvoicedUSD = tourClientInvoices.reduce(
    (sum, inv) => sum + convertCurrency(inv.totalAmount, inv.currency, 'USD'),
    0
  );

  // Income Received: Cash collected from client payments for this specific tour
  const totalIncomeReceivedUSD = tourClientInvoices.reduce(
    (sum, inv) => sum + convertCurrency(inv.amountPaid, inv.currency, 'USD'),
    0
  );

  const pendingClientReceivablesUSD = totalInvoicedUSD > 0
    ? totalInvoicedUSD - totalIncomeReceivedUSD
    : Math.max(0, tourContractPriceUSD - totalIncomeReceivedUSD);

  // Supplier Invoices Cost (Cost of Goods Sold)
  const totalSupplierInvoicesUSD = tourSupplierInvoices.reduce(
    (sum, si) => sum + convertCurrency(si.amount, si.currency, 'USD'),
    0
  );

  const totalSupplierPaidUSD = tourSupplierInvoices
    .filter((si) => si.status === 'Paid')
    .reduce((sum, si) => sum + convertCurrency(si.amount, si.currency, 'USD'), 0);

  const totalSupplierPendingUSD = totalSupplierInvoicesUSD - totalSupplierPaidUSD;

  // Direct Tour Expenses
  const totalExpensesUSD = tourExpenses.reduce(
    (sum, e) => sum + convertCurrency(e.amount, e.currency, 'USD'),
    0
  );

  // Total Direct Costs
  const totalDirectCostsUSD = totalSupplierInvoicesUSD + totalExpensesUSD;
  const totalDirectCostsPaidUSD = totalSupplierPaidUSD + totalExpensesUSD;

  // Running Profit & Loss Calculations
  // Running Cash Profit: Cash in minus cash paid to suppliers/expenses to date
  const runningCashProfitUSD = totalIncomeReceivedUSD - totalDirectCostsPaidUSD;

  // Projected Gross Profit: Contract Value or Total Invoiced minus Total Direct Costs
  const revenueBasisUSD = totalInvoicedUSD > 0 ? totalInvoicedUSD : tourContractPriceUSD;
  const projectedGrossProfitUSD = revenueBasisUSD - totalDirectCostsUSD;
  const projectedMarginPercent = revenueBasisUSD > 0
    ? Math.round((projectedGrossProfitUSD / revenueBasisUSD) * 1000) / 10
    : 0;

  // Running cash margin %
  const runningCashMarginPercent = totalIncomeReceivedUSD > 0
    ? Math.round((runningCashProfitUSD / totalIncomeReceivedUSD) * 1000) / 10
    : 0;

  // Handlers
  const handleOpenAddSupplierInvoice = () => {
    const defaultSup = suppliers[0];
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSinvNumber(`INV-${defaultSup ? defaultSup.name.slice(0, 3).toUpperCase() : 'SUP'}-${rand}`);
    setSinvSupplierId(defaultSup?.id || '');
    setSinvIssueDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setSinvDueDate(d.toISOString().split('T')[0]);
    setSinvAmount(1800);
    setSinvCurrency(currentTour.currency);
    setSinvDescription(`Supplier operations for ${currentTour.title}`);
    setSinvStatus('Pending Review');
    setSinvAssignedStaffId(staff.find((s) => s.department.includes('Finance'))?.id || staff[0]?.id || '');
    setIsAddSupplierInvoiceOpen(true);
  };

  const handleCreateSupplierInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sinvNumber.trim() || !sinvSupplierId) return;

    const newInvoice: SupplierInvoice = {
      id: `sinv-${Date.now()}`,
      invoiceNumber: sinvNumber.trim(),
      supplierId: sinvSupplierId,
      tripId: currentTour.id, // Marked as belonging specifically to this tour!
      issueDate: sinvIssueDate,
      dueDate: sinvDueDate,
      amount: Number(sinvAmount) || 0,
      currency: sinvCurrency,
      description: sinvDescription.trim(),
      status: sinvStatus,
      assignedStaffId: sinvAssignedStaffId,
      paymentReminderEnabled: true,
      createdByStaffId: staff[0]?.id,
      createdBy: staff[0]?.name || 'Tour Manager',
    };

    addSupplierInvoice(newInvoice, true);
    setIsAddSupplierInvoiceOpen(false);
    showToast(`Supplier invoice ${newInvoice.invoiceNumber} recorded and linked to ${currentTour.title}.`);
  };

  const handleLinkExistingInvoice = (inv: SupplierInvoice) => {
    updateSupplierInvoice({
      ...inv,
      tripId: currentTour.id,
    });
    showToast(`Invoice ${inv.invoiceNumber} linked to ${currentTour.title}! It now appears in this tour's management area.`);
  };

  const handleUnlinkInvoice = (inv: SupplierInvoice) => {
    updateSupplierInvoice({
      ...inv,
      tripId: undefined,
    });
    showToast(`Invoice ${inv.invoiceNumber} unlinked from ${currentTour.title}. (Still displays in general supplier invoices list)`);
  };

  const handleOpenRecordPayment = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    setPaymentAmount(inv.balanceDue);
    setPaymentRef(`REC-${Math.floor(100000 + Math.random() * 900000)}`);
    setIsRecordPaymentOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment || paymentAmount <= 0) return;

    recordPayment(selectedInvoiceForPayment.id, {
      date: new Date().toISOString().split('T')[0],
      amount: Number(paymentAmount),
      currency: selectedInvoiceForPayment.currency,
      convertedAmountUSD: convertCurrency(paymentAmount, selectedInvoiceForPayment.currency, 'USD'),
      paymentMethod,
      reference: paymentRef,
      notes: `Recorded in Tour Management Area for ${currentTour.title}`,
    });

    setIsRecordPaymentOpen(false);
    setSelectedInvoiceForPayment(null);
    showToast(`Payment of ${formatMoney(paymentAmount, selectedInvoiceForPayment.currency)} recorded! Income received updated in real-time.`);
  };

  const handleExportTourPnLCSV = () => {
    const rows = [
      ['RUNNING PROFIT AND LOSS REPORT', currentTour.tourName || currentTour.title],
      ['Tour Code', currentTour.code],
      ['Client', client?.name || 'Private VIP Client'],
      ['Dates', `${currentTour.startDate} to ${currentTour.endDate}`],
      ['Generated On', new Date().toISOString()],
      [],
      ['METRIC', 'AMOUNT (USD)', 'DETAILS'],
      ['Gross Tour Revenue Basis', revenueBasisUSD, `Contract: ${formatMoney(currentTour.totalClientPrice, currentTour.currency)}`],
      ['Total Cash Income Received', totalIncomeReceivedUSD, `${tourClientInvoices.length} Client Invoices`],
      ['Pending Client Receivables', pendingClientReceivablesUSD, 'Outstanding client balance'],
      ['Total Supplier Invoices (Cost)', totalSupplierInvoicesUSD, `${tourSupplierInvoices.length} Supplier Invoices linked`],
      ['Supplier Invoices Paid', totalSupplierPaidUSD, 'Settled supplier accounts'],
      ['Supplier Invoices Pending', totalSupplierPendingUSD, 'Pending supplier settlement'],
      ['Direct Tour Expenses', totalExpensesUSD, `${tourExpenses.length} Direct expenses`],
      ['Total Direct Costs', totalDirectCostsUSD, 'Supplier invoices + Direct expenses'],
      ['Running Cash Profit to Date', runningCashProfitUSD, `${runningCashMarginPercent}% Running Cash Margin`],
      ['Projected Final Gross Profit', projectedGrossProfitUSD, `${projectedMarginPercent}% Projected Margin`],
      [],
      ['ITEMIZED SUPPLIER INVOICES'],
      ['Invoice #', 'Supplier', 'Category', 'Issue Date', 'Due Date', 'Status', 'Amount (USD)'],
      ...tourSupplierInvoices.map((si) => {
        const sup = suppliers.find((s) => s.id === si.supplierId);
        return [
          si.invoiceNumber,
          sup?.name || 'Supplier',
          sup?.category || 'Operations',
          si.issueDate,
          si.dueDate,
          si.status,
          convertCurrency(si.amount, si.currency, 'USD'),
        ];
      }),
      [],
      ['ITEMIZED CLIENT PAYMENTS / INCOME RECEIVED'],
      ['Payment Ref', 'Invoice #', 'Date', 'Method', 'Amount (USD)'],
      ...tourClientInvoices.flatMap((inv) =>
        (inv.payments || []).map((p) => [
          p.reference,
          inv.invoiceNumber,
          p.date,
          p.paymentMethod,
          convertCurrency(p.amount, p.currency, 'USD'),
        ])
      ),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Running_PnL_${currentTour.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-amber-400/50 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Tour Switcher Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                Tour Operations &amp; Management Area
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-xs font-mono font-bold text-slate-500">{currentTour.code}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {currentTour.tourName || currentTour.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-semibold text-slate-800">{currentTour.destination}</span>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>{currentTour.startDate} &mdash; {currentTour.endDate} ({currentTour.days.length} Days)</span>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Party of {currentTour.partySize} &bull; Client: <strong className="text-slate-800">{client?.name || 'Private Client'}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Tour Switcher & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={currentTour.id}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer pr-8"
              >
                {itineraries.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code}: {t.tourName || t.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setSelectedTripId(currentTour.id);
                setActiveView('builder');
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open Itinerary Design Builder"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Itinerary Builder</span>
            </button>

            <button
              onClick={() => openClientPortal(currentTour.id)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View live client portal for this tour"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Live Portal</span>
            </button>
          </div>
        </div>

        {/* Top KPI Cards specifically for this Tour */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Card 1: Package Value */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Contract Package Value</span>
              <span className="font-mono text-slate-400">{currentTour.currency}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {formatMoney(currentTour.totalClientPrice, currentTour.currency)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              ≈ ${tourContractPriceUSD.toLocaleString()} USD
            </div>
          </div>

          {/* Card 2: Income Received (The core request) */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
              <span>Income Received</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-200/80 text-emerald-950 font-black text-[9px]">
                {revenueBasisUSD > 0 ? Math.round((totalIncomeReceivedUSD / revenueBasisUSD) * 100) : 0}% Collected
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
              ${totalIncomeReceivedUSD.toLocaleString()} USD
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              Pending: ${pendingClientReceivablesUSD.toLocaleString()} USD
            </div>
          </div>

          {/* Card 3: Supplier Invoices (Belonging to this tour) */}
          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center justify-between">
              <span>Supplier Invoices</span>
              <span className="font-bold text-[10px] text-amber-800">
                {tourSupplierInvoices.length} Bills
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
              ${totalSupplierInvoicesUSD.toLocaleString()} USD
            </div>
            <div className="text-[11px] text-amber-800 font-medium mt-0.5">
              Paid: ${totalSupplierPaidUSD.toLocaleString()} &bull; Pending: ${totalSupplierPendingUSD.toLocaleString()}
            </div>
          </div>

          {/* Card 4: Running Profit & Margin */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span>Running Gross Profit</span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 font-black text-[9px]">
                {projectedMarginPercent}% Margin
              </span>
            </div>
            <div className={`text-xl sm:text-2xl font-black mt-1 ${projectedGrossProfitUSD >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
              ${projectedGrossProfitUSD.toLocaleString()} USD
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              Running Cash: <strong className={runningCashProfitUSD >= 0 ? 'text-emerald-400' : 'text-red-300'}>${runningCashProfitUSD.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-1 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'overview'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Tour Command Center</span>
        </button>

        <button
          onClick={() => setActiveTab('supplier-invoices')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'supplier-invoices'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Supplier Invoices ({tourSupplierInvoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('income')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'income'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Income Received &amp; Client Billing</span>
        </button>

        <button
          onClick={() => setActiveTab('pnl')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'pnl'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span>Running Profit &amp; Loss Report</span>
        </button>

        <button
          onClick={() => setActiveTab('operations')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'operations'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Operations &amp; Concierge Roster</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 cols: Tour Financial Summary & Fast Link */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Action Bar */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Tour Financial Actions &amp; Controls</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('pnl')}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Full P&amp;L Statement</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={handleOpenAddSupplierInvoice}
                    className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-left transition-all group shadow-xs cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold mb-2">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div className="font-extrabold text-xs text-white">+ Receive Supplier Invoice</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Link a vendor bill directly to this tour</div>
                  </button>

                  <button
                    onClick={() => setIsLinkExistingInvoiceOpen(true)}
                    className="p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-950 text-left border border-amber-200 transition-all group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500/30 text-amber-900 flex items-center justify-center font-bold mb-2">
                      <Link className="w-4 h-4" />
                    </div>
                    <div className="font-extrabold text-xs text-amber-950">Link Existing Invoices</div>
                    <div className="text-[11px] text-amber-800/80 mt-0.5">Assign unallocated vendor bills to this tour</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('pnl')}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-900 text-left border border-slate-200 transition-all group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-2">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="font-extrabold text-xs text-slate-900">Generate Running P&amp;L</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Calculate live revenue, cost &amp; gross margin</div>
                  </button>
                </div>
              </div>

              {/* Supplier Invoices Preview Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Receipt className="w-4 h-4 text-amber-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Supplier Invoices for this Tour ({tourSupplierInvoices.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('supplier-invoices')}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 underline"
                  >
                    Manage Invoices
                  </button>
                </div>

                {tourSupplierInvoices.length > 0 ? (
                  <div className="space-y-2">
                    {tourSupplierInvoices.slice(0, 4).map((inv) => {
                      const sup = suppliers.find((s) => s.id === inv.supplierId);
                      return (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                              <span className="text-slate-400">&bull;</span>
                              <span className="font-semibold text-slate-800">{sup?.name || 'Vendor'}</span>
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-200 text-slate-700">{sup?.category}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Due: {inv.dueDate} &bull; {inv.description}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 text-right">
                            <div>
                              <div className="font-black text-slate-900">
                                {formatMoney(inv.amount, inv.currency)}
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                  inv.status === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {inv.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500">No supplier invoices assigned to this tour yet.</p>
                    <button
                      onClick={handleOpenAddSupplierInvoice}
                      className="px-3 py-1.5 bg-slate-900 text-amber-400 font-bold text-xs rounded-xl"
                    >
                      + Receive First Supplier Invoice
                    </button>
                  </div>
                )}
              </div>

              {/* Income Received & Client Billing Preview Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Income Received for this Tour (${totalIncomeReceivedUSD.toLocaleString()} USD)
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('income')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    View All Receipts
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-emerald-800">Actual Income Collected</div>
                    <div className="text-2xl font-black text-emerald-950">
                      ${totalIncomeReceivedUSD.toLocaleString()} USD
                    </div>
                    <p className="text-[11px] text-emerald-700">Cash received from client payments</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Client Invoices Generated</div>
                    <div className="text-2xl font-black text-slate-900">
                      {tourClientInvoices.length} Invoices
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Total Billed: ${totalInvoicedUSD.toLocaleString()} USD
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Tour Operations, Dedicated Concierge & Quick Facts */}
            <div className="space-y-6">
              {/* Dedicated Tour Concierge Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-600" />
                    <span>Dedicated Tour Concierge</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                    24/7 Assigned
                  </span>
                </div>

                <div className="flex items-center space-x-3.5">
                  {concierge.avatar ? (
                    <img
                      src={concierge.avatar}
                      alt={concierge.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/20"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 font-black text-lg flex items-center justify-center uppercase shadow-sm">
                      {concierge.name.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">{concierge.name}</h4>
                    <div className="text-xs text-slate-500">{concierge.role}</div>
                    <div className="text-[11px] text-amber-700 font-semibold">{concierge.department}</div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-amber-600" />
                    <span>{concierge.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-amber-600" />
                    <span>{concierge.email}</span>
                  </div>
                </div>
              </div>

              {/* Client Dossier Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Client &amp; Passenger Dossier
                </h3>
                <div className="text-sm font-extrabold text-slate-900">{client?.name || 'Private VIP Client'}</div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div>Email: <strong className="text-slate-800">{client?.email || 'N/A'}</strong></div>
                  <div>Phone: <strong className="text-slate-800">{client?.phone || 'N/A'}</strong></div>
                  <div>Tier: <span className="font-bold text-amber-700">{client?.vipTier || 'VIP'}</span></div>
                </div>
              </div>

              {/* Private Crew Assignment */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Operations Crew
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Dedicated Tour Guide</div>
                    <div className="font-extrabold text-slate-900 mt-0.5">{currentTour.guideName || 'Unassigned'}</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Dedicated Chauffeur</div>
                    <div className="font-extrabold text-slate-900 mt-0.5">{currentTour.driverName || 'Unassigned'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIER INVOICES BELONGING TO THIS TOUR */}
      {activeTab === 'supplier-invoices' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900">
                  Tour Cost Ledger
                </span>
                <span className="text-xs text-slate-400">Total Bills: {tourSupplierInvoices.length}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                Supplier Invoices for {currentTour.tourName || currentTour.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                These vendor bills belong to this tour and are reflected in the overall supplier invoices list and running P&amp;L.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsLinkExistingInvoiceOpen(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Select from unallocated invoices in the database to link to this tour"
              >
                <Link className="w-3.5 h-3.5 text-amber-600" />
                <span>Link Unallocated Invoice</span>
              </button>

              <button
                onClick={handleOpenAddSupplierInvoice}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Receive Supplier Invoice</span>
              </button>
            </div>
          </div>

          {/* Table */}
          {tourSupplierInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Invoice #</th>
                    <th className="py-3 px-3">Supplier / Category</th>
                    <th className="py-3 px-3">Description</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tourSupplierInvoices.map((inv) => {
                    const sup = suppliers.find((s) => s.id === inv.supplierId);
                    const isPaid = inv.status === 'Paid';
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{sup?.name || 'Vendor'}</div>
                          <span className="text-[10px] text-slate-400 font-semibold">{sup?.category}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                          {inv.description}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {inv.dueDate}
                        </td>
                        <td className="py-3 px-3 font-black text-slate-900">
                          {formatMoney(inv.amount, inv.currency)}
                          {inv.currency !== 'USD' && (
                            <div className="text-[10px] text-slate-400 font-medium">
                              ≈ ${convertCurrency(inv.amount, inv.currency, 'USD').toLocaleString()} USD
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {!isPaid && (
                              <button
                                onClick={() => {
                                  markSupplierInvoicePaid(inv.id, 'Bank Wire');
                                  showToast(`Marked invoice ${inv.invoiceNumber} as Paid`);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg shadow-2xs cursor-pointer"
                                title="Mark Paid"
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              onClick={() => handleUnlinkInvoice(inv)}
                              className="px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-[10px] font-bold cursor-pointer"
                              title="Unlink from this tour (keeps invoice in overall list)"
                            >
                              Unlink
                            </button>
                            <button
                              onClick={() => deleteSupplierInvoice(inv.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Delete Invoice"
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
          ) : (
            <div className="p-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No Supplier Invoices for this Tour</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When you receive a supplier invoice (guide, transport, hotel, dining), click below to assign it to this tour.
                It will display here and also in the master Supplier Invoices list.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleOpenAddSupplierInvoice}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  + Receive Supplier Invoice for this Tour
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INCOME RECEIVED & CLIENT BILLING */}
      {activeTab === 'income' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900">
                  Tour Revenue Ledger
                </span>
                <span className="text-xs text-slate-400">Client: {client?.name}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                Income Received for {currentTour.tourName || currentTour.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Itemized record of client invoices issued, payments collected, and outstanding receivables.
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500 font-bold uppercase">Total Cash Collected</div>
              <div className="text-2xl font-black text-emerald-700">
                ${totalIncomeReceivedUSD.toLocaleString()} USD
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Client Invoices Issued for this Tour ({tourClientInvoices.length})
            </h4>

            {tourClientInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Issue Date</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3">Billed Amount</th>
                      <th className="py-2.5 px-3">Amount Received</th>
                      <th className="py-2.5 px-3">Balance Due</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tourClientInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-3 px-3 text-slate-600">{inv.issueDate}</td>
                        <td className="py-3 px-3 text-slate-600">{inv.dueDate}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{formatMoney(inv.totalAmount, inv.currency)}</td>
                        <td className="py-3 px-3 font-black text-emerald-700">
                          {formatMoney(inv.amountPaid, inv.currency)}
                        </td>
                        <td className="py-3 px-3 font-bold text-amber-900">
                          {formatMoney(inv.balanceDue, inv.currency)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'Partially Paid'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {inv.balanceDue > 0 && (
                            <button
                              onClick={() => handleOpenRecordPayment(inv)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg shadow-2xs cursor-pointer"
                            >
                              + Record Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                <DollarSign className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No client invoices created for this tour yet.</p>
                <button
                  onClick={() => setActiveView('invoicing')}
                  className="px-3.5 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
                >
                  Create Client Invoice in Invoicing Hub
                </button>
              </div>
            )}
          </div>

          {/* Payment Receipts History */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Itemized Payment Receipts Collected for this Tour
            </h4>

            {(() => {
              const payments = tourClientInvoices.flatMap((inv) =>
                (inv.payments || []).map((p) => ({ ...p, invNumber: inv.invoiceNumber }))
              );

              if (payments.length === 0) {
                return (
                  <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 italic">
                    No cash payments recorded on this tour yet.
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {payments.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                          <Check className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900">
                            {formatMoney(p.amount, p.currency)} &bull; {p.paymentMethod}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Received on {p.date} &bull; Ref: {p.reference} &bull; Inv: {p.invNumber}
                          </div>
                        </div>
                      </div>

                      <div className="font-black text-emerald-800">
                        ≈ ${convertCurrency(p.amount, p.currency, 'USD').toLocaleString()} USD
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 4: RUNNING PROFIT AND LOSS REPORT FOR THIS TOUR */}
      {activeTab === 'pnl' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-900 border border-indigo-200">
                  Running P&amp;L Dossier
                </span>
                <span className="text-xs text-slate-400 font-mono">{currentTour.code}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                Running Profit &amp; Loss Report: {currentTour.tourName || currentTour.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time income, supplier costs, expenses, and gross profitability margin.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportTourPnLCSV}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Export detailed tour running P&L report as CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export P&amp;L CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Running P&amp;L</span>
              </button>
            </div>
          </div>

          {/* KPI Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Gross Tour Revenue</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">${revenueBasisUSD.toLocaleString()} USD</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-emerald-700">Cash Income Received</div>
              <div className="text-xl font-black text-emerald-800 mt-0.5">${totalIncomeReceivedUSD.toLocaleString()} USD</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-amber-700">Total Supplier &amp; Direct Costs</div>
              <div className="text-xl font-black text-amber-900 mt-0.5">${totalDirectCostsUSD.toLocaleString()} USD</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-indigo-700">Projected Tour Gross Profit</div>
              <div className={`text-xl font-black mt-0.5 ${projectedGrossProfitUSD >= 0 ? 'text-indigo-900' : 'text-red-600'}`}>
                ${projectedGrossProfitUSD.toLocaleString()} USD ({projectedMarginPercent}%)
              </div>
            </div>
          </div>

          {/* Statement Detailed Table */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200">
              I. Revenue &amp; Income Receipts
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 px-3 bg-slate-50 rounded-xl">
                <span>Contract Package Quote ({currentTour.currency})</span>
                <span className="font-bold">{formatMoney(currentTour.totalClientPrice, currentTour.currency)}</span>
              </div>
              <div className="flex justify-between py-1.5 px-3 bg-slate-50 rounded-xl">
                <span>Client Invoices Issued ({tourClientInvoices.length} invoices)</span>
                <span className="font-bold">${totalInvoicedUSD.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between py-1.5 px-3 bg-emerald-50 rounded-xl text-emerald-950 font-bold">
                <span>Actual Cash Received from Client</span>
                <span className="font-black text-emerald-700">${totalIncomeReceivedUSD.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between py-1.5 px-3 bg-slate-50 rounded-xl text-slate-600">
                <span>Pending Receivables from Client</span>
                <span>${pendingClientReceivablesUSD.toLocaleString()} USD</span>
              </div>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200 pt-3">
              II. Cost of Sales &amp; Supplier Invoices
            </h4>
            {tourSupplierInvoices.length > 0 ? (
              <div className="space-y-1.5 text-xs">
                {tourSupplierInvoices.map((si) => {
                  const sup = suppliers.find((s) => s.id === si.supplierId);
                  return (
                    <div key={si.id} className="flex justify-between py-1.5 px-3 bg-slate-50 rounded-xl">
                      <div>
                        <strong className="text-slate-900">{sup?.name || 'Supplier'}</strong> &bull; {sup?.category || 'Operations'} ({si.invoiceNumber})
                        <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.2 rounded ${si.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {si.status}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900">
                        ${convertCurrency(si.amount, si.currency, 'USD').toLocaleString()} USD
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between py-2 px-3 bg-amber-50 rounded-xl font-bold text-amber-950">
                  <span>Subtotal Supplier Invoices</span>
                  <span>${totalSupplierInvoicesUSD.toLocaleString()} USD</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                No supplier invoices currently linked to this tour.
              </p>
            )}

            {/* Direct Expenses */}
            {tourExpenses.length > 0 && (
              <>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200 pt-3">
                  III. Direct Tour Expenses &amp; Discretionary Outlays
                </h4>
                <div className="space-y-1.5 text-xs">
                  {tourExpenses.map((exp) => (
                    <div key={exp.id} className="flex justify-between py-1.5 px-3 bg-slate-50 rounded-xl">
                      <span>{exp.title} ({exp.category})</span>
                      <span className="font-bold">${convertCurrency(exp.amount, exp.currency, 'USD').toLocaleString()} USD</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 px-3 bg-slate-100 rounded-xl font-bold">
                    <span>Subtotal Direct Expenses</span>
                    <span>${totalExpensesUSD.toLocaleString()} USD</span>
                  </div>
                </div>
              </>
            )}

            {/* Bottom Line Summary */}
            <div className="pt-4 border-t-2 border-slate-900 space-y-2">
              <div className="flex justify-between py-2 px-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-800">
                <span>Running Cash Position (Cash Collected minus Costs Paid to Date)</span>
                <span className={`text-sm ${runningCashProfitUSD >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  ${runningCashProfitUSD.toLocaleString()} USD ({runningCashMarginPercent}%)
                </span>
              </div>

              <div className="flex justify-between py-3 px-4 bg-slate-900 text-white rounded-2xl text-sm font-extrabold shadow-md">
                <span>Projected Final Tour Profit (Contract Price minus All Committed Costs)</span>
                <span className={`text-base ${projectedGrossProfitUSD >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                  ${projectedGrossProfitUSD.toLocaleString()} USD ({projectedMarginPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OPERATIONS & CONCIERGE ROSTER */}
      {activeTab === 'operations' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Operations &amp; Staff Assigned to this Tour</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold uppercase text-slate-500">Dedicated Tour Concierge</div>
              <div className="flex items-center space-x-3">
                {concierge.avatar ? (
                  <img src={concierge.avatar} alt={concierge.name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center">
                    {concierge.name.slice(0, 2)}
                  </div>
                )}
                <div>
                  <div className="font-extrabold text-slate-900">{concierge.name}</div>
                  <div className="text-xs text-slate-500">{concierge.role}</div>
                  <div className="text-[11px] text-amber-700 font-semibold">{concierge.phone}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-bold uppercase text-slate-500">Tour Operations Crew</div>
              <div className="space-y-1.5 text-xs">
                <div>Guide: <strong className="text-slate-900">{currentTour.guideName || 'Unassigned'}</strong></div>
                <div>Chauffeur: <strong className="text-slate-900">{currentTour.driverName || 'Unassigned'}</strong></div>
                <div>Party Size: <strong className="text-slate-900">{currentTour.partySize} guests</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD SUPPLIER INVOICE FOR THIS TOUR */}
      {isAddSupplierInvoiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Linked to {currentTour.code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Receive Supplier Invoice for this Tour</h3>
              </div>
              <button
                onClick={() => setIsAddSupplierInvoiceOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
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
                    value={sinvNumber}
                    onChange={(e) => setSinvNumber(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Supplier *</label>
                  <select
                    required
                    value={sinvSupplierId}
                    onChange={(e) => setSinvSupplierId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none cursor-pointer"
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950">
                <strong>Tour Assignment:</strong> This invoice will belong to <span className="font-bold underline">{currentTour.tourName || currentTour.title}</span> ({currentTour.code}).
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={sinvIssueDate}
                    onChange={(e) => setSinvIssueDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={sinvDueDate}
                    onChange={(e) => setSinvDueDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
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
                    value={sinvAmount}
                    onChange={(e) => setSinvAmount(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-black outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Currency *</label>
                  <select
                    value={sinvCurrency}
                    onChange={(e) => setSinvCurrency(e.target.value as CurrencyCode)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="ILS">ILS (₪)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Service Description</label>
                <input
                  type="text"
                  required
                  value={sinvDescription}
                  onChange={(e) => setSinvDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierInvoiceOpen(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Save &amp; Link to Tour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LINK EXISTING UNASSIGNED INVOICES */}
      {isLinkExistingInvoiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Link Existing Invoices to this Tour</h3>
                <p className="text-xs text-slate-500">Select any unallocated supplier invoice to mark as belonging to {currentTour.title}.</p>
              </div>
              <button
                onClick={() => setIsLinkExistingInvoiceOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {unassignedSupplierInvoices.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {unassignedSupplierInvoices.map((inv) => {
                  const sup = suppliers.find((s) => s.id === inv.supplierId);
                  const currLinkedTrip = itineraries.find((t) => t.id === inv.tripId);
                  return (
                    <div
                      key={inv.id}
                      className="p-3 bg-slate-50 hover:bg-amber-50/40 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</div>
                        <div className="font-semibold text-slate-800">{sup?.name || 'Vendor'} &bull; {inv.description}</div>
                        <div className="text-[10px] text-slate-400">
                          {currLinkedTrip ? `Currently on ${currLinkedTrip.code}` : 'General Overhead (Unlinked)'}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <div className="font-black text-slate-900">{formatMoney(inv.amount, inv.currency)}</div>
                          <div className="text-[10px] text-slate-500">{inv.dueDate}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleLinkExistingInvoice(inv)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          + Link
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic text-center p-6 bg-slate-50 rounded-xl">
                All existing supplier invoices are already assigned to this tour!
              </p>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsLinkExistingInvoiceOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD CLIENT PAYMENT */}
      {isRecordPaymentOpen && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Record Income Received
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Record Payment on {selectedInvoiceForPayment.invoiceNumber}</h3>
              </div>
              <button
                onClick={() => setIsRecordPaymentOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Payment Amount ({selectedInvoiceForPayment.currency})</label>
                <input
                  type="number"
                  min={1}
                  max={selectedInvoiceForPayment.balanceDue}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-black text-emerald-800 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none cursor-pointer"
                >
                  <option value="Bank Wire">Bank Wire</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Stripe">Stripe</option>
                  <option value="AMEX">AMEX</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Reference / Wire Receipt #</label>
                <input
                  type="text"
                  required
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(false)}
                  className="px-4 py-2 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Save Payment Received
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
