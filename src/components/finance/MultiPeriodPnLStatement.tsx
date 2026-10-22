import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Building,
  Receipt,
  FileText,
  Filter,
  CheckCircle2,
  Clock,
  Coins,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronDown,
  Compass,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CurrencyCode, Invoice, SupplierInvoice, Expense } from '../../types';

export const MultiPeriodPnLStatement: React.FC = () => {
  const {
    invoices,
    supplierInvoices,
    expenses,
    itineraries,
    suppliers,
    clients,
    convertCurrency,
    formatMoney,
    companyLogo,
  } = useApp();

  // State: Duration selection (1 Calendar Month vs 2 Calendar Months)
  const [periodDuration, setPeriodDuration] = useState<'1_MONTH' | '2_MONTHS'>('1_MONTH');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedStartMonth, setSelectedStartMonth] = useState<number>(10); // 1-12 (10 = October)
  const [accountingBasis, setAccountingBasis] = useState<'INVOICE_DATE' | 'PAYMENT_DATE'>('INVOICE_DATE');
  const [reportingCurrency, setReportingCurrency] = useState<CurrencyCode>('USD');

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate Date Range strings (YYYY-MM-DD)
  const { startDateStr, endDateStr, periodLabel, priorStartDateStr, priorEndDateStr, priorPeriodLabel } = useMemo(() => {
    // Current period start
    const startY = selectedYear;
    const startM = selectedStartMonth;
    const pad = (n: number) => n.toString().padStart(2, '0');

    const startDate = `${startY}-${pad(startM)}-01`;

    let endY = startY;
    let endM = startM;
    let periodLbl = '';

    if (periodDuration === '1_MONTH') {
      const daysInMonth = new Date(startY, startM, 0).getDate();
      const endDate = `${startY}-${pad(startM)}-${pad(daysInMonth)}`;
      periodLbl = `${monthNames[startM - 1]} ${startY} (1 Calendar Month)`;

      // Prior period: previous 1 month
      let prevM = startM - 1;
      let prevY = startY;
      if (prevM === 0) {
        prevM = 12;
        prevY -= 1;
      }
      const prevDays = new Date(prevY, prevM, 0).getDate();
      const pStart = `${prevY}-${pad(prevM)}-01`;
      const pEnd = `${prevY}-${pad(prevM)}-${pad(prevDays)}`;
      const pLbl = `${monthNames[prevM - 1]} ${prevY}`;

      return {
        startDateStr: startDate,
        endDateStr: endDate,
        periodLabel: periodLbl,
        priorStartDateStr: pStart,
        priorEndDateStr: pEnd,
        priorPeriodLabel: pLbl,
      };
    } else {
      // 2 Calendar Months
      endM = startM + 1;
      if (endM > 12) {
        endM = 1;
        endY += 1;
      }
      const daysInEndMonth = new Date(endY, endM, 0).getDate();
      const endDate = `${endY}-${pad(endM)}-${pad(daysInEndMonth)}`;
      periodLbl = `${monthNames[startM - 1]} – ${monthNames[endM - 1]} ${startY === endY ? startY : `${startY}/${endY}`} (2 Calendar Months)`;

      // Prior period: 2 months prior to startM
      let pStartM = startM - 2;
      let pStartY = startY;
      let pEndM = startM - 1;
      let pEndY = startY;

      if (pStartM <= 0) {
        pStartM += 12;
        pStartY -= 1;
      }
      if (pEndM <= 0) {
        pEndM += 12;
        pEndY -= 1;
      }
      const pDays = new Date(pEndY, pEndM, 0).getDate();
      const pStart = `${pStartY}-${pad(pStartM)}-01`;
      const pEnd = `${pEndY}-${pad(pEndM)}-${pad(pDays)}`;
      const pLbl = `${monthNames[pStartM - 1]} – ${monthNames[pEndM - 1]} ${pStartY}`;

      return {
        startDateStr: startDate,
        endDateStr: endDate,
        periodLabel: periodLbl,
        priorStartDateStr: pStart,
        priorEndDateStr: pEnd,
        priorPeriodLabel: pLbl,
      };
    }
  }, [periodDuration, selectedYear, selectedStartMonth]);

  // Filter items in Current Period based on date of invoices and credits
  const periodInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const targetDate = accountingBasis === 'INVOICE_DATE' ? inv.issueDate : (inv.payments?.[0]?.date || inv.issueDate);
      return targetDate >= startDateStr && targetDate <= endDateStr;
    });
  }, [invoices, startDateStr, endDateStr, accountingBasis]);

  const periodSupplierInvoices = useMemo(() => {
    return supplierInvoices.filter((si) => {
      const targetDate = accountingBasis === 'INVOICE_DATE' ? si.issueDate : (si.paidAt?.split('T')[0] || si.dueDate);
      return targetDate >= startDateStr && targetDate <= endDateStr;
    });
  }, [supplierInvoices, startDateStr, endDateStr, accountingBasis]);

  const periodExpenses = useMemo(() => {
    return expenses.filter((e) => e.date >= startDateStr && e.date <= endDateStr);
  }, [expenses, startDateStr, endDateStr]);

  // Grouped Costs: Direct Tour vs General Overhead & Credits
  const periodDirectExpenses = useMemo(() => {
    return periodExpenses.filter((e) => !e.isGeneralOverhead && e.amount >= 0);
  }, [periodExpenses]);

  const periodGeneralOverhead = useMemo(() => {
    return periodExpenses.filter((e) => e.isGeneralOverhead && e.amount >= 0);
  }, [periodExpenses]);

  const periodCredits = useMemo(() => {
    // Negative expenses or credit notes
    return periodExpenses.filter((e) => e.amount < 0);
  }, [periodExpenses]);

  // Financial Calculations (Converted to reporting currency)
  const totalRevenue = useMemo(() => {
    return periodInvoices.reduce(
      (sum, inv) => sum + convertCurrency(inv.totalAmount, inv.currency, reportingCurrency),
      0
    );
  }, [periodInvoices, reportingCurrency, convertCurrency]);

  const totalSupplierCosts = useMemo(() => {
    return periodSupplierInvoices.reduce(
      (sum, si) => sum + convertCurrency(si.amount, si.currency, reportingCurrency),
      0
    );
  }, [periodSupplierInvoices, reportingCurrency, convertCurrency]);

  const totalDirectExpenses = useMemo(() => {
    return periodDirectExpenses.reduce(
      (sum, e) => sum + convertCurrency(e.amount, e.currency, reportingCurrency),
      0
    );
  }, [periodDirectExpenses, reportingCurrency, convertCurrency]);

  const totalDirectCosts = totalSupplierCosts + totalDirectExpenses;
  const grossProfit = totalRevenue - totalDirectCosts;
  const grossMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 1000) / 10 : 0;

  const totalOverhead = useMemo(() => {
    return periodGeneralOverhead.reduce(
      (sum, e) => sum + convertCurrency(e.amount, e.currency, reportingCurrency),
      0
    );
  }, [periodGeneralOverhead, reportingCurrency, convertCurrency]);

  const totalCreditsAmount = useMemo(() => {
    // sum of credits (absolute value)
    return periodCredits.reduce(
      (sum, c) => sum + convertCurrency(Math.abs(c.amount), c.currency, reportingCurrency),
      0
    );
  }, [periodCredits, reportingCurrency, convertCurrency]);

  const netOperatingProfit = grossProfit - totalOverhead + totalCreditsAmount;
  const netMarginPercent = totalRevenue > 0 ? Math.round((netOperatingProfit / totalRevenue) * 1000) / 10 : 0;

  // Prior Period Calculation for Comparative Variance
  const priorPeriodFinancials = useMemo(() => {
    const pInvoices = invoices.filter((inv) => {
      const d = accountingBasis === 'INVOICE_DATE' ? inv.issueDate : (inv.payments?.[0]?.date || inv.issueDate);
      return d >= priorStartDateStr && d <= priorEndDateStr;
    });
    const pSuppliers = supplierInvoices.filter((si) => {
      const d = accountingBasis === 'INVOICE_DATE' ? si.issueDate : (si.paidAt?.split('T')[0] || si.dueDate);
      return d >= priorStartDateStr && d <= priorEndDateStr;
    });
    const pExpenses = expenses.filter((e) => e.date >= priorStartDateStr && e.date <= priorEndDateStr);

    const pRev = pInvoices.reduce((sum, inv) => sum + convertCurrency(inv.totalAmount, inv.currency, reportingCurrency), 0);
    const pSup = pSuppliers.reduce((sum, si) => sum + convertCurrency(si.amount, si.currency, reportingCurrency), 0);
    const pDirExp = pExpenses.filter((e) => !e.isGeneralOverhead && e.amount >= 0).reduce((sum, e) => sum + convertCurrency(e.amount, e.currency, reportingCurrency), 0);
    const pOver = pExpenses.filter((e) => e.isGeneralOverhead && e.amount >= 0).reduce((sum, e) => sum + convertCurrency(e.amount, e.currency, reportingCurrency), 0);
    const pGross = pRev - (pSup + pDirExp);
    const pNet = pGross - pOver;

    return {
      revenue: pRev,
      directCosts: pSup + pDirExp,
      grossProfit: pGross,
      netProfit: pNet,
    };
  }, [invoices, supplierInvoices, expenses, priorStartDateStr, priorEndDateStr, accountingBasis, reportingCurrency, convertCurrency]);

  // Supplier Invoices grouped by Category
  const supplierCostsByCategory = useMemo(() => {
    const categories: Record<string, { count: number; total: number; invoices: SupplierInvoice[] }> = {
      'Accommodation': { count: 0, total: 0, invoices: [] },
      'Guide': { count: 0, total: 0, invoices: [] },
      'Transport': { count: 0, total: 0, invoices: [] },
      'Activities & Dining': { count: 0, total: 0, invoices: [] },
      'Other Suppliers': { count: 0, total: 0, invoices: [] },
    };

    periodSupplierInvoices.forEach((si) => {
      const sup = suppliers.find((s) => s.id === si.supplierId);
      const cat = sup?.category || 'Other Suppliers';
      const key = categories[cat] ? cat : 'Other Suppliers';
      const converted = convertCurrency(si.amount, si.currency, reportingCurrency);
      categories[key].count += 1;
      categories[key].total += converted;
      categories[key].invoices.push(si);
    });

    return categories;
  }, [periodSupplierInvoices, suppliers, reportingCurrency, convertCurrency]);

  // Export to CSV
  const handleExportCSV = () => {
    const rows = [
      ['PROFIT AND LOSS STATEMENT', periodLabel],
      ['Accounting Basis', accountingBasis === 'INVOICE_DATE' ? 'Date of Invoices and Credits' : 'Payment Settlement Date'],
      ['Reporting Currency', reportingCurrency],
      ['Generated On', new Date().toISOString()],
      [],
      ['SECTION', 'LINE ITEM', 'DETAILS', 'DATE', `AMOUNT (${reportingCurrency})`],
      ['REVENUE', 'Total Billed Revenue', `${periodInvoices.length} Invoices`, `${startDateStr} to ${endDateStr}`, totalRevenue],
      ...periodInvoices.map((inv) => {
        const trip = itineraries.find((t) => t.id === inv.tripId);
        const cl = clients.find((c) => c.id === inv.clientId);
        return [
          'REVENUE',
          inv.invoiceNumber,
          `${cl?.name || 'Client'} (${trip?.code || 'Overhead'})`,
          inv.issueDate,
          convertCurrency(inv.totalAmount, inv.currency, reportingCurrency),
        ];
      }),
      [],
      ['DIRECT COSTS', 'Total Supplier Invoices', `${periodSupplierInvoices.length} Bills`, `${startDateStr} to ${endDateStr}`, totalSupplierCosts],
      ...periodSupplierInvoices.map((si) => {
        const sup = suppliers.find((s) => s.id === si.supplierId);
        const trip = itineraries.find((t) => t.id === si.tripId);
        return [
          'DIRECT COSTS',
          si.invoiceNumber,
          `${sup?.name} - ${trip ? trip.code : 'Overhead'}`,
          si.issueDate,
          convertCurrency(si.amount, si.currency, reportingCurrency),
        ];
      }),
      [],
      ['GROSS PROFIT', 'Gross Profit', `${grossMarginPercent}% Margin`, '', grossProfit],
      ['OVERHEAD', 'Operating Expenses', `${periodGeneralOverhead.length} Items`, '', totalOverhead],
      ['CREDITS', 'Credits & Adjustments', `${periodCredits.length} Credits`, '', totalCreditsAmount],
      ['NET PROFIT', 'Net Operating Profit', `${netMarginPercent}% Margin`, '', netOperatingProfit],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PnL_Statement_${selectedYear}_M${selectedStartMonth}_${periodDuration}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header and Controls */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-200">
                Financial Statements Engine
              </span>
              <span className="text-xs text-slate-400 font-medium">Multi-Period Database Audit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Profit &amp; Loss Statement Generator
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Generate comprehensive, audit-ready Profit &amp; Loss statements across the entire database
              for any 1 calendar month or 2 calendar months based on the date of invoices and credits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print Formal Statement</span>
            </button>
          </div>
        </div>

        {/* Control Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
          {/* Duration Toggle */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Period Duration
            </label>
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setPeriodDuration('1_MONTH')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  periodDuration === '1_MONTH'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1 Month
              </button>
              <button
                type="button"
                onClick={() => setPeriodDuration('2_MONTHS')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  periodDuration === '2_MONTHS'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2 Months
              </button>
            </div>
          </div>

          {/* Calendar Month Selection */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              {periodDuration === '1_MONTH' ? 'Calendar Month' : 'Starting 2-Month Block'}
            </label>
            <select
              value={selectedStartMonth}
              onChange={(e) => setSelectedStartMonth(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
            >
              {periodDuration === '1_MONTH' ? (
                monthNames.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {m}
                  </option>
                ))
              ) : (
                <>
                  <option value={1}>Jan &ndash; Feb (Bi-Monthly)</option>
                  <option value={3}>Mar &ndash; Apr (Bi-Monthly)</option>
                  <option value={5}>May &ndash; Jun (Bi-Monthly)</option>
                  <option value={7}>Jul &ndash; Aug (Bi-Monthly)</option>
                  <option value={9}>Sep &ndash; Oct (Bi-Monthly)</option>
                  <option value={10}>Oct &ndash; Nov (Bi-Monthly)</option>
                  <option value={11}>Nov &ndash; Dec (Bi-Monthly)</option>
                  <option value={2}>Feb &ndash; Mar (Custom Span)</option>
                  <option value={4}>Apr &ndash; May (Custom Span)</option>
                  <option value={6}>Jun &ndash; Jul (Custom Span)</option>
                  <option value={8}>Aug &ndash; Sep (Custom Span)</option>
                </>
              )}
            </select>
          </div>

          {/* Year Selection */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Calendar Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
            >
              <option value={2026}>2026 (Active Fiscal)</option>
              <option value={2025}>2025</option>
              <option value={2027}>2027</option>
              <option value={2024}>2024</option>
            </select>
          </div>

          {/* Accounting Basis */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Accounting Basis
            </label>
            <select
              value={accountingBasis}
              onChange={(e) => setAccountingBasis(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
            >
              <option value="INVOICE_DATE">Date of Invoices &amp; Credits</option>
              <option value="PAYMENT_DATE">Cash Settlement Date</option>
            </select>
          </div>

          {/* Reporting Currency */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Reporting Currency
            </label>
            <select
              value={reportingCurrency}
              onChange={(e) => setReportingCurrency(e.target.value as CurrencyCode)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
            >
              <option value="USD">USD ($ - Base)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="ILS">ILS (₪)</option>
            </select>
          </div>
        </div>

        {/* Selected Period Badge */}
        <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-700 shrink-0" />
            <span className="text-indigo-950 font-bold">
              Active Scope: <span className="underline">{periodLabel}</span> &bull; {startDateStr} to {endDateStr}
            </span>
          </div>
          <div className="text-[11px] text-indigo-800 font-semibold">
            Based on: <strong>{accountingBasis === 'INVOICE_DATE' ? 'Issue Date of Invoices & Credit Notes' : 'Payment Dates'}</strong>
          </div>
        </div>
      </div>

      {/* FORMAL STATEMENT DOSSIER (Printable & Viewable) */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-md space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Printable Formal Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b-2 border-slate-900 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              {companyLogo ? (
                <img src={companyLogo} alt="Logo" className="w-10 h-10 object-contain rounded" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 font-black flex items-center justify-center text-xs">
                  TO360
                </div>
              )}
              <div>
                <h2 className="text-xl font-black font-serif-display text-slate-900 tracking-tight">
                  TourOps 360 &bull; Executive Statement
                </h2>
                <div className="text-[11px] text-slate-500 font-semibold">Official Corporate Management Accounts</div>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif-display tracking-tight pt-2">
              PROFIT AND LOSS STATEMENT
            </div>
            <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              {periodLabel} &bull; ({startDateStr} to {endDateStr})
            </div>
          </div>

          <div className="text-right text-xs space-y-1 text-slate-600">
            <div>Basis: <strong className="text-slate-900">Date of Invoices &amp; Credits</strong></div>
            <div>Reporting Currency: <strong className="text-slate-900">{reportingCurrency}</strong></div>
            <div className="text-[11px] text-slate-400">Statement Generated: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-500">Gross Billed Revenue</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              ${totalRevenue.toLocaleString()} {reportingCurrency}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {periodInvoices.length} Client Invoices
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200">
            <div className="text-[10px] font-bold uppercase text-amber-900">Direct Tour Costs (COGS)</div>
            <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
              ${totalDirectCosts.toLocaleString()} {reportingCurrency}
            </div>
            <div className="text-[11px] text-amber-800 font-medium mt-0.5">
              {periodSupplierInvoices.length} Supplier Bills
            </div>
          </div>

          <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200">
            <div className="text-[10px] font-bold uppercase text-indigo-900">Gross Operating Profit</div>
            <div className="text-xl sm:text-2xl font-black text-indigo-950 mt-1">
              ${grossProfit.toLocaleString()} {reportingCurrency}
            </div>
            <div className="text-[11px] text-indigo-800 font-bold mt-0.5">
              Gross Margin: {grossMarginPercent}%
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
            <div className="text-[10px] font-bold uppercase text-amber-400">Net Operating Profit</div>
            <div className={`text-xl sm:text-2xl font-black mt-1 ${netOperatingProfit >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
              ${netOperatingProfit.toLocaleString()} {reportingCurrency}
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              Net Margin: <strong className="text-emerald-400">{netMarginPercent}%</strong>
            </div>
          </div>
        </div>

        {/* Comparative Trend Banner vs Prior Period */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>
              Comparative Prior Period (<strong className="text-slate-800">{priorPeriodLabel}</strong>):
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span>Prior Revenue: ${priorPeriodFinancials.revenue.toLocaleString()}</span>
            <span>&bull;</span>
            <span>Prior Net Profit: ${priorPeriodFinancials.netProfit.toLocaleString()}</span>
            <span>&bull;</span>
            <span className={`font-black ${netOperatingProfit >= priorPeriodFinancials.netProfit ? 'text-emerald-600' : 'text-red-600'}`}>
              Variance: {priorPeriodFinancials.netProfit > 0
                ? `${Math.round(((netOperatingProfit - priorPeriodFinancials.netProfit) / priorPeriodFinancials.netProfit) * 100)}%`
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* SECTION 1: REVENUE / INCOME ITEMIZED */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span>I. REVENUE &amp; CLIENT INVOICES (DATED IN PERIOD)</span>
            </h3>
            <span className="text-sm font-black text-slate-900">
              ${totalRevenue.toLocaleString()} {reportingCurrency}
            </span>
          </div>

          {periodInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase">
                    <th className="py-2 px-2">Invoice #</th>
                    <th className="py-2 px-2">Issue Date</th>
                    <th className="py-2 px-2">Client / Account</th>
                    <th className="py-2 px-2">Linked Tour</th>
                    <th className="py-2 px-2 text-right">Invoiced Amount</th>
                    <th className="py-2 px-2 text-right">Amount Received</th>
                    <th className="py-2 px-2 text-right">Converted ({reportingCurrency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periodInvoices.map((inv) => {
                    const cl = clients.find((c) => c.id === inv.clientId);
                    const tour = itineraries.find((t) => t.id === inv.tripId);
                    const converted = convertCurrency(inv.totalAmount, inv.currency, reportingCurrency);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-2 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-2 px-2 text-slate-600">{inv.issueDate}</td>
                        <td className="py-2 px-2 font-semibold text-slate-800">{cl?.name || 'Private VIP Client'}</td>
                        <td className="py-2 px-2 text-slate-600">
                          {tour ? <span className="font-mono font-bold text-slate-900">{tour.code} &bull; {tour.tourName || tour.title}</span> : 'General'}
                        </td>
                        <td className="py-2 px-2 text-right font-semibold">{formatMoney(inv.totalAmount, inv.currency)}</td>
                        <td className="py-2 px-2 text-right font-semibold text-emerald-700">{formatMoney(inv.amountPaid, inv.currency)}</td>
                        <td className="py-2 px-2 text-right font-black text-slate-900">${converted.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 italic">
              No client invoices dated in this calendar period ({startDateStr} to {endDateStr}).
            </div>
          )}
        </div>

        {/* SECTION 2: COST OF GOODS SOLD / SUPPLIER INVOICES ITEMIZED */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span>II. COST OF GOODS SOLD: SUPPLIER INVOICES (DATED IN PERIOD)</span>
            </h3>
            <span className="text-sm font-black text-amber-950">
              ${totalSupplierCosts.toLocaleString()} {reportingCurrency}
            </span>
          </div>

          {/* Supplier Breakdown by Category */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Object.entries(supplierCostsByCategory).map(([cat, data]) => (
              <div key={cat} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-400 truncate">{cat}</div>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  ${data.total.toLocaleString()} {reportingCurrency}
                </div>
                <div className="text-[10px] text-slate-500">{data.count} bills</div>
              </div>
            ))}
          </div>

          {periodSupplierInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase">
                    <th className="py-2 px-2">Invoice #</th>
                    <th className="py-2 px-2">Issue Date</th>
                    <th className="py-2 px-2">Supplier / Vendor</th>
                    <th className="py-2 px-2">Category</th>
                    <th className="py-2 px-2">Belongs to Tour</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2 text-right">Original Amount</th>
                    <th className="py-2 px-2 text-right">Converted ({reportingCurrency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periodSupplierInvoices.map((si) => {
                    const sup = suppliers.find((s) => s.id === si.supplierId);
                    const tour = itineraries.find((t) => t.id === si.tripId);
                    const converted = convertCurrency(si.amount, si.currency, reportingCurrency);
                    return (
                      <tr key={si.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-2 font-mono font-bold text-slate-900">{si.invoiceNumber}</td>
                        <td className="py-2 px-2 text-slate-600">{si.issueDate}</td>
                        <td className="py-2 px-2 font-bold text-slate-900">{sup?.name || 'Vendor'}</td>
                        <td className="py-2 px-2 text-slate-600">{sup?.category}</td>
                        <td className="py-2 px-2">
                          {tour ? (
                            <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {tour.code}: {tour.tourName || tour.title}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">General Overhead</span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${si.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {si.status}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-semibold">{formatMoney(si.amount, si.currency)}</td>
                        <td className="py-2 px-2 text-right font-black text-slate-900">${converted.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 italic">
              No supplier invoices dated in this calendar period ({startDateStr} to {endDateStr}).
            </div>
          )}
        </div>

        {/* SECTION 3: DIRECT TOUR EXPENSES */}
        {periodDirectExpenses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                III. DIRECT TOUR EXPENSES (DISCRETIONARY TOUR OUTLAYS)
              </h3>
              <span className="text-sm font-black text-slate-900">
                ${totalDirectExpenses.toLocaleString()} {reportingCurrency}
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              {periodDirectExpenses.map((e) => {
                const tour = itineraries.find((t) => t.id === e.tripId);
                return (
                  <div key={e.id} className="flex justify-between py-1.5 px-3 bg-slate-50 rounded-xl">
                    <span>
                      {e.title} ({e.category}) &bull; Tour: {tour ? tour.code : 'Overhead'} &bull; Date: {e.date}
                    </span>
                    <span className="font-bold">
                      ${convertCurrency(e.amount, e.currency, reportingCurrency).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GROSS PROFIT SUB-TOTAL */}
        <div className="p-4 bg-indigo-50/80 rounded-2xl border-2 border-indigo-200 flex justify-between items-center text-sm font-black text-indigo-950">
          <span>GROSS OPERATING PROFIT (REVENUE MINUS DIRECT COSTS)</span>
          <span className="text-lg">${grossProfit.toLocaleString()} {reportingCurrency} ({grossMarginPercent}%)</span>
        </div>

        {/* SECTION 4: OVERHEAD EXPENSES & CREDITS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              IV. OPERATING OVERHEAD, EXPENSES &amp; CREDITS (DATED IN PERIOD)
            </h3>
            <span className="text-sm font-black text-slate-900">
              ${(totalOverhead - totalCreditsAmount).toLocaleString()} {reportingCurrency}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {periodGeneralOverhead.map((e) => (
              <div key={e.id} className="flex justify-between py-1.5 px-3 bg-slate-50 rounded-xl text-slate-800">
                <span>{e.title} &bull; {e.category} ({e.date})</span>
                <span className="font-bold">${convertCurrency(e.amount, e.currency, reportingCurrency).toLocaleString()}</span>
              </div>
            ))}

            {periodCredits.map((c) => (
              <div key={c.id} className="flex justify-between py-1.5 px-3 bg-emerald-50 text-emerald-950 rounded-xl font-bold">
                <span>Credit / Refund: {c.title} ({c.date})</span>
                <span>-${convertCurrency(Math.abs(c.amount), c.currency, reportingCurrency).toLocaleString()}</span>
              </div>
            ))}

            {periodGeneralOverhead.length === 0 && periodCredits.length === 0 && (
              <div className="p-3 bg-slate-50 rounded-xl text-slate-500 italic">
                No operational overhead expenses or credits recorded in this period.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: FINAL NET OPERATING PROFIT */}
        <div className="pt-4 border-t-4 border-slate-900 space-y-3">
          <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Net Operating Income / Profit for {periodLabel}
              </div>
              <div className="text-3xl sm:text-4xl font-black mt-1 font-serif-display text-white">
                ${netOperatingProfit.toLocaleString()} {reportingCurrency}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Net Margin: <strong className="text-emerald-400">{netMarginPercent}%</strong> of Gross Billed Revenue
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 space-y-1 text-xs">
              <div>Total Invoiced: <strong className="text-slate-200">${totalRevenue.toLocaleString()}</strong></div>
              <div>Direct Costs: <strong className="text-amber-400">${totalDirectCosts.toLocaleString()}</strong></div>
              <div>Overhead &amp; Credits: <strong className="text-slate-200">${(totalOverhead - totalCreditsAmount).toLocaleString()}</strong></div>
            </div>
          </div>
        </div>

        {/* Audit Sign-off Block for Print */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-6 text-[11px] text-slate-500">
          <div>
            <div className="font-bold text-slate-900">Prepared By:</div>
            <div className="mt-1">TourOps 360 Financial Engine</div>
            <div className="italic">Accrual Multi-Period Audit</div>
          </div>
          <div>
            <div className="font-bold text-slate-900">Management Approval:</div>
            <div className="mt-1">Managing Director &amp; Finance Lead</div>
            <div className="italic">Certified Database Scope</div>
          </div>
          <div>
            <div className="font-bold text-slate-900">Period Closed:</div>
            <div className="mt-1">{endDateStr}</div>
            <div className="italic">Zero Orphan Discrepancy</div>
          </div>
        </div>
      </div>
    </div>
  );
};
