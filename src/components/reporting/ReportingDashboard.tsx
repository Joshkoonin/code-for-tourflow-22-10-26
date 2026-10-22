import React, { useState } from 'react';
import {
  PieChart,
  TrendingUp,
  DollarSign,
  Compass,
  Building,
  Printer,
  Calendar,
  Sparkles,
  BarChart3,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ReportingDashboard: React.FC = () => {
  const {
    itineraries,
    invoices,
    expenses,
    supplierInvoices,
    suppliers,
    supplierBookings,
    convertCurrency,
    formatMoney,
    hasFullFinancialView,
    setActiveView,
  } = useApp();

  const [dateRange, setDateRange] = useState<'YTD' | 'Q4' | 'ALL'>('ALL');

  // Compute total figures in USD
  const totalRevenueUSD = itineraries.reduce(
    (sum, t) => sum + convertCurrency(t.totalClientPrice, t.currency, 'USD'),
    0
  );

  // 1. Direct Tour Expenses (Legacy expenses + Tour-Assigned Supplier Invoices)
  const legacyDirectCostsUSD = expenses
    .filter((e) => !e.isGeneralOverhead)
    .reduce((sum, e) => sum + convertCurrency(e.amount, e.currency, 'USD'), 0);

  const tourSupplierInvoicesUSD = supplierInvoices
    .filter((si) => Boolean(si.tripId && si.tripId !== 'OVERHEAD'))
    .reduce((sum, si) => sum + convertCurrency(si.amount, si.currency, 'USD'), 0);

  const totalDirectCostsUSD = legacyDirectCostsUSD + tourSupplierInvoicesUSD;

  // 2. General Overhead Expenses (Legacy overhead + Overhead Supplier Invoices)
  const legacyOverheadUSD = expenses
    .filter((e) => e.isGeneralOverhead)
    .reduce((sum, e) => sum + convertCurrency(e.amount, e.currency, 'USD'), 0);

  const overheadSupplierInvoicesUSD = supplierInvoices
    .filter((si) => !si.tripId || si.tripId === 'OVERHEAD')
    .reduce((sum, si) => sum + convertCurrency(si.amount, si.currency, 'USD'), 0);

  const totalOverheadUSD = legacyOverheadUSD + overheadSupplierInvoicesUSD;

  // Total Supplier Invoices
  const totalAllSupplierInvoicesUSD = tourSupplierInvoicesUSD + overheadSupplierInvoicesUSD;

  // Gross and Net Profit Calculations
  const grossProfitUSD = totalRevenueUSD - totalDirectCostsUSD;
  const netProfitUSD = grossProfitUSD - totalOverheadUSD;
  const grossMarginPercent = totalRevenueUSD > 0 ? Math.round((grossProfitUSD / totalRevenueUSD) * 100) : 0;
  const netMarginPercent = totalRevenueUSD > 0 ? Math.round((netProfitUSD / totalRevenueUSD) * 100) : 0;
  const avgTripValueUSD = itineraries.length > 0 ? Math.round(totalRevenueUSD / itineraries.length) : 0;

  // Expense categories aggregation (Merging Expenses + Supplier Invoices)
  const expensesByCategory = expenses.reduce((acc, exp) => {
    const usd = convertCurrency(exp.amount, exp.currency, 'USD');
    acc[exp.category] = (acc[exp.category] || 0) + usd;
    return acc;
  }, {} as Record<string, number>);

  // Merge supplier invoices into category aggregation
  supplierInvoices.forEach((si) => {
    const usd = convertCurrency(si.amount, si.currency, 'USD');
    const sup = suppliers.find((s) => s.id === si.supplierId);
    let cat = 'General Operational Overhead';
    if (si.tripId && si.tripId !== 'OVERHEAD') {
      cat = sup?.category || 'Tour Direct Supplier Costs';
    } else {
      cat = sup ? `${sup.category} (Overhead)` : 'General Overhead';
    }
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + usd;
  });

  const categoryEntries = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);
  const maxCategorySpend = Math.max(...categoryEntries.map((c) => c[1]), 1);

  // Status breakdown
  const statusCounts = itineraries.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Lone Provider utilization
  const loneSuppliers = suppliers.filter((s) => s.isLoneProvider);
  const loneBookingsCount = supplierBookings.filter((b) =>
    loneSuppliers.some((ls) => ls.id === b.supplierId)
  ).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Module 6: Business Intelligence
            </span>
            <span className="text-xs text-slate-500 font-medium">Analytics &amp; Data Visualizations</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Executive Performance &amp; Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Real-time visual reporting on gross margins, supplier expenditure allocation, and itinerary pipelines.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 text-xs font-semibold">
            {(['ALL', 'YTD', 'Q4'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  dateRange === r ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'ALL' ? 'All Time' : r === 'YTD' ? '2026 YTD' : 'Q4 2026'}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Grid */}
      {hasFullFinancialView ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Gross Invoiced Revenue
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +24% YoY
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {formatMoney(totalRevenueUSD, 'USD')}
              </div>
              <div className="text-xs text-slate-500 mt-1">Avg per tour: ${avgTripValueUSD.toLocaleString()}</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Gross Tour Margin
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-[10px] font-extrabold">
                  Target &gt; 35%
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {grossMarginPercent}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Gross Profit: {formatMoney(grossProfitUSD, 'USD')}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Net Agency Profit
                </span>
                <span className="text-xs font-bold text-slate-600">After Overheads</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {formatMoney(netProfitUSD, 'USD')}
              </div>
              <div className="text-xs text-slate-500 mt-1">Net Margin: {netMarginPercent}%</div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-md border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Active Itineraries
                </span>
                <span className="text-xs font-bold text-amber-300">Live</span>
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {itineraries.length} Tours
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {loneBookingsCount} Lone Provider bookings tracked
              </div>
            </div>
          </div>

          {/* Supplier Invoices Expense Allocation Summary Banner */}
          <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-slate-50 to-amber-50/60 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Supplier Invoices Integrated into Financials &amp; Profit Margins</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900">
                    {supplierInvoices.length} Invoices ({formatMoney(totalAllSupplierInvoicesUSD, 'USD')})
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Every supplier invoice is dynamically factored as an operational expense: <strong className="text-slate-900">{formatMoney(tourSupplierInvoicesUSD, 'USD')}</strong> assigned to tours directly reduces Tour Gross Margin, and <strong className="text-slate-900">{formatMoney(overheadSupplierInvoicesUSD, 'USD')}</strong> is calculated into Corporate Overhead.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveView('tour-gross-profit')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Tour Gross Profits &rarr;
              </button>
              <button
                onClick={() => setActiveView('supplier-invoices')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Supplier Invoices Hub &rarr;
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-md border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Active Itineraries
              </span>
              <span className="text-xs font-bold text-amber-300">Live</span>
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {itineraries.length} Tours
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Currently planned &amp; running
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Lone Provider Bookings
              </span>
              <span className="text-xs font-bold text-amber-600">Monitored</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {loneBookingsCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">Single-party specialist bookings</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Confirmed Bookings
              </span>
              <span className="text-xs font-bold text-blue-600">Locked</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {supplierBookings.filter((b) => b.status === 'Confirmed' || b.status === 'Voucher Issued').length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Partner suppliers confirmed</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Total Tour Days
              </span>
              <span className="text-xs font-bold text-emerald-600">Curated</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {itineraries.reduce((sum, t) => sum + (t.days?.length || 0), 0)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Full-day activity schedules</div>
          </div>
        </div>
      )}

      {/* Main Charts & Visualizations Grid */}
      {hasFullFinancialView && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visual Chart 1: Revenue vs Cost Comparison */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-600" />
                  <span>Financial Composition &amp; Profit Retention</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proportion of client revenue converted into net operating margin.
                </p>
              </div>
            </div>

            {/* Stacked Composition Bar */}
            <div className="space-y-3 pt-2">
              <div className="h-6 w-full rounded-xl overflow-hidden flex shadow-inner bg-slate-100">
                <div
                  style={{ width: `${Math.round((totalDirectCostsUSD / (totalRevenueUSD || 1)) * 100)}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title="Direct Supplier Costs"
                />
                <div
                  style={{ width: `${Math.round((totalOverheadUSD / (totalRevenueUSD || 1)) * 100)}%` }}
                  className="bg-slate-700 transition-all duration-500"
                  title="Corporate Overhead"
                />
                <div
                  style={{ width: `${Math.max(0, netMarginPercent)}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title="Net Operating Profit"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="text-[10px] font-bold text-rose-800 uppercase block">Direct Costs</span>
                  <span className="font-bold text-rose-950 text-sm">
                    {formatMoney(totalDirectCostsUSD, 'USD')}
                  </span>
                  <span className="text-[10px] text-rose-700 block mt-0.5">
                    {Math.round((totalDirectCostsUSD / (totalRevenueUSD || 1)) * 100)}% of revenue
                  </span>
                </div>
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-700 uppercase block">Overhead</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatMoney(totalOverheadUSD, 'USD')}
                  </span>
                  <span className="text-[10px] text-slate-600 block mt-0.5">
                    {Math.round((totalOverheadUSD / (totalRevenueUSD || 1)) * 100)}% of revenue
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Net Margin</span>
                  <span className="font-bold text-emerald-950 text-sm">
                    {formatMoney(netProfitUSD, 'USD')}
                  </span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">
                    {netMarginPercent}% net retention
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Chart 2: Expenditure by Category */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-amber-600" />
                  <span>Operational Spend by Category</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribution across accommodations, private guides, yachts, and admin.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {categoryEntries.slice(0, 5).map(([category, amount]) => {
                const pct = Math.round((amount / (maxCategorySpend || 1)) * 100);

                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{category}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatMoney(amount, 'USD')}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Itinerary Pipeline Distribution & Lone Provider Asset Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Itinerary Pipeline Stages</span>
          </h3>

          <div className="space-y-2.5">
            {['Confirmed', 'In Progress', 'Proposed', 'Draft', 'Completed'].map((stage) => {
              const count = statusCounts[stage] || 0;
              return (
                <div
                  key={stage}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <span className="font-semibold text-slate-800">{stage}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{count} Tours</span>
                    <span className="text-slate-400">
                      ({Math.round((count / (itineraries.length || 1)) * 100)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lone Provider Asset Monitoring */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Lone Provider Capacity &amp; Booking Allocation</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exclusive specialist guides and private vessels can only service 1 client at a time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {loneSuppliers.map((ls) => {
              const assignedBookings = supplierBookings.filter(
                (b) => b.supplierId === ls.id && b.status !== 'Cancelled'
              );

              return (
                <div
                  key={ls.id}
                  className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ls.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                      {assignedBookings.length} Active {assignedBookings.length === 1 ? 'Date' : 'Dates'}
                    </span>
                  </div>
                  <div className="text-amber-900 font-medium text-[11px]">{ls.loneProviderType}</div>
                  <div className="text-slate-600 text-[11px]">
                    City: {ls.city} &bull; Rating: {ls.rating}&#9733;
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
