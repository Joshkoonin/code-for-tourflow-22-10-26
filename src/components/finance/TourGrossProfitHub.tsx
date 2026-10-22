import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  ChevronRight,
  Building2,
  Calendar,
  Users,
  Receipt,
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Itinerary, CurrencyCode, SupplierInvoice } from '../../types';

export const TourGrossProfitHub: React.FC = () => {
  const {
    itineraries,
    invoices,
    supplierInvoices,
    expenses,
    suppliers,
    clients,
    convertCurrency,
    formatMoney,
    setSelectedTripId,
    setActiveView,
    openClientPortal,
    hasFullFinancialView,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'profit_desc' | 'profit_asc' | 'margin_desc' | 'revenue_desc' | 'date_desc'>('profit_desc');
  const [selectedTourForDetail, setSelectedTourForDetail] = useState<Itinerary | null>(null);

  // Compute metrics per tour
  const tourMetrics = useMemo(() => {
    return itineraries.map((tour) => {
      const tourRevenueUSD = convertCurrency(tour.totalClientPrice, tour.currency, 'USD');

      // Client invoices generated for this tour
      const tourClientInvoices = invoices.filter((inv) => inv.tripId === tour.id);
      const totalInvoicedUSD = tourClientInvoices.reduce(
        (sum, inv) => sum + convertCurrency(inv.totalAmount, inv.currency, 'USD'),
        0
      );
      const incomeReceivedUSD = tourClientInvoices.reduce(
        (sum, inv) => sum + convertCurrency(inv.amountPaid, inv.currency, 'USD'),
        0
      );

      // Revenue basis: Total invoiced if available, otherwise tour total price
      const effectiveRevenueUSD = totalInvoicedUSD > 0 ? totalInvoicedUSD : tourRevenueUSD;

      // Supplier invoices specifically assigned to this tour
      const tourSupplierInvs = supplierInvoices.filter((si) => si.tripId === tour.id);
      const totalSupplierCostsUSD = tourSupplierInvs.reduce(
        (sum, si) => sum + convertCurrency(si.amount, si.currency, 'USD'),
        0
      );
      const supplierPaidUSD = tourSupplierInvs
        .filter((si) => si.status === 'Paid')
        .reduce((sum, si) => sum + convertCurrency(si.amount, si.currency, 'USD'), 0);

      // Other direct expenses assigned to this tour
      const tourExps = expenses.filter((e) => e.tripId === tour.id && !e.isGeneralOverhead);
      const totalOtherExpensesUSD = tourExps.reduce(
        (sum, e) => sum + convertCurrency(e.amount, e.currency, 'USD'),
        0
      );

      // Total direct costs
      const totalDirectCostsUSD = totalSupplierCostsUSD + totalOtherExpensesUSD;

      // Gross profit and margin
      const grossProfitUSD = effectiveRevenueUSD - totalDirectCostsUSD;
      const grossMarginPercent = effectiveRevenueUSD > 0
        ? Math.round((grossProfitUSD / effectiveRevenueUSD) * 1000) / 10
        : 0;

      const client = clients.find((c) => c.id === tour.clientId);

      return {
        tour,
        client,
        effectiveRevenueUSD,
        totalInvoicedUSD,
        incomeReceivedUSD,
        totalSupplierCostsUSD,
        supplierInvoicesCount: tourSupplierInvs.length,
        supplierInvoices: tourSupplierInvs,
        supplierPaidUSD,
        totalOtherExpensesUSD,
        totalDirectCostsUSD,
        grossProfitUSD,
        grossMarginPercent,
      };
    });
  }, [itineraries, invoices, supplierInvoices, expenses, clients, convertCurrency]);

  // Filter and sort
  const filteredTours = useMemo(() => {
    return tourMetrics
      .filter((tm) => {
        const matchesStatus = statusFilter === 'ALL' || tm.tour.status === statusFilter;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          tm.tour.title.toLowerCase().includes(q) ||
          (tm.tour.tourName && tm.tour.tourName.toLowerCase().includes(q)) ||
          tm.tour.code.toLowerCase().includes(q) ||
          tm.tour.destination.toLowerCase().includes(q) ||
          (tm.client && tm.client.name.toLowerCase().includes(q));

        return matchesStatus && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'profit_desc') return b.grossProfitUSD - a.grossProfitUSD;
        if (sortBy === 'profit_asc') return a.grossProfitUSD - b.grossProfitUSD;
        if (sortBy === 'margin_desc') return b.grossMarginPercent - a.grossMarginPercent;
        if (sortBy === 'revenue_desc') return b.effectiveRevenueUSD - a.effectiveRevenueUSD;
        if (sortBy === 'date_desc') return new Date(b.tour.startDate).getTime() - new Date(a.tour.startDate).getTime();
        return 0;
      });
  }, [tourMetrics, statusFilter, searchQuery, sortBy]);

  // Overall portfolio aggregate statistics
  const portfolioAggregates = useMemo(() => {
    const totalRev = tourMetrics.reduce((sum, tm) => sum + tm.effectiveRevenueUSD, 0);
    
    // Overhead invoices (those not assigned to a tour)
    const overheadInvoices = supplierInvoices.filter((si) => !si.tripId || si.tripId === '');
    const totalOverheadSupplier = overheadInvoices.reduce(
        (sum, si) => sum + convertCurrency(si.amount, si.currency, 'USD'),
        0
    );
    // Overhead expenses (those not assigned to a tour)
    const overheadExpenses = expenses.filter((e) => e.isGeneralOverhead || !e.tripId);
    const totalOverheadExpenses = overheadExpenses.reduce(
        (sum, e) => sum + convertCurrency(e.amount, e.currency, 'USD'),
        0
    );

    const totalSupplier = tourMetrics.reduce((sum, tm) => sum + tm.totalSupplierCostsUSD, 0) + totalOverheadSupplier;
    const totalOther = tourMetrics.reduce((sum, tm) => sum + tm.totalOtherExpensesUSD, 0) + totalOverheadExpenses;
    const totalCosts = totalSupplier + totalOther;
    const totalProfit = totalRev - totalCosts;
    const avgMargin = totalRev > 0 ? Math.round((totalProfit / totalRev) * 1000) / 10 : 0;

    return {
      totalRev,
      totalSupplier,
      totalOther,
      totalCosts,
      totalProfit,
      avgMargin,
    };
  }, [tourMetrics, supplierInvoices, expenses, convertCurrency]);

  // Selected tour detail metric
  const selectedMetric = useMemo(() => {
    if (!selectedTourForDetail) return null;
    return tourMetrics.find((tm) => tm.tour.id === selectedTourForDetail.id);
  }, [selectedTourForDetail, tourMetrics]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              Tour Profitability &amp; Cost Accounting
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Gross Profit &bull; Margins &bull; Supplier Expense Allocation
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-600" />
            <span>Gross Profit per Tour</span>
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Click on any tour in the list below to inspect its detailed gross profit breakdown, assigned supplier invoices, and margins.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={() => setActiveView('supplier-invoices')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Supplier Invoices Hub</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Tour Revenue
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatMoney(portfolioAggregates.totalRev, 'USD')}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Across {tourMetrics.length} total tours
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
            Tour Supplier Invoices
          </span>
          <div className="text-2xl font-black text-rose-950 mt-1">
            {formatMoney(portfolioAggregates.totalSupplier, 'USD')}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Direct supplier cost of goods
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Other Direct Expenses
          </span>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {formatMoney(portfolioAggregates.totalOther, 'USD')}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Incidental tour disbursements
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
            Aggregate Gross Profit
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatMoney(portfolioAggregates.totalProfit, 'USD')}
          </div>
          <span className="text-xs text-emerald-900 font-semibold mt-1 block">
            Revenue minus direct tour costs
          </span>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-md border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            Avg Gross Margin
          </span>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {portfolioAggregates.avgMargin}%
          </div>
          <span className="text-xs text-slate-300 mt-1 block">
            Average portfolio margin
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search tours by name, code, client, or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
            >
              <option value="ALL">All Tour Statuses</option>
              <option value="Proposed">Proposed</option>
              <option value="Confirmed">Confirmed</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
            >
              <option value="profit_desc">Highest Gross Profit ($)</option>
              <option value="profit_asc">Lowest Gross Profit ($)</option>
              <option value="margin_desc">Highest Gross Margin (%)</option>
              <option value="revenue_desc">Highest Revenue ($)</option>
              <option value="date_desc">Newest Tour Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main List of Tours with Gross Profit */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Tours Gross Profit Breakdown ({filteredTours.length} Tours)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Click any row to inspect complete income, supplier invoices &amp; cost breakdown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="px-4 py-3.5">Tour Code &amp; Name</th>
                <th className="px-4 py-3.5">Client &amp; Destination</th>
                <th className="px-4 py-3.5">Dates / Status</th>
                <th className="px-4 py-3.5 text-right">Revenue</th>
                <th className="px-4 py-3.5 text-right">Supplier Costs</th>
                <th className="px-4 py-3.5 text-right">Direct Costs</th>
                <th className="px-4 py-3.5 text-right font-black text-slate-900">Gross Profit</th>
                <th className="px-4 py-3.5 text-right">Gross Margin</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredTours.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No tours match your current filter</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing your search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredTours.map((tm) => {
                  const isProfitable = tm.grossProfitUSD >= 0;

                  return (
                    <tr
                      key={tm.tour.id}
                      onClick={() => setSelectedTourForDetail(tm.tour)}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-4">
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200 inline-block">
                            {tm.tour.code}
                          </span>
                          <div className="font-extrabold text-slate-900 group-hover:text-amber-950 transition-colors line-clamp-1 max-w-[220px]">
                            {tm.tour.tourName || tm.tour.title}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{tm.client?.name || 'Assigned VIP Guest'}</span>
                            {tm.client?.vipTier && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-bold">
                                {tm.client.vipTier}
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-[11px] truncate max-w-[180px]">
                            {tm.tour.destination}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="text-[11px] text-slate-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{tm.tour.startDate} &bull; {tm.tour.days.length}d</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider inline-block ${
                              tm.tour.status === 'Confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tm.tour.status === 'In Progress'
                                ? 'bg-blue-100 text-blue-800'
                                : tm.tour.status === 'Completed'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {tm.tour.status}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right font-mono font-bold text-slate-900">
                        {formatMoney(tm.effectiveRevenueUSD, 'USD')}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="font-mono font-bold text-rose-700">
                          {formatMoney(tm.totalSupplierCostsUSD, 'USD')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {tm.supplierInvoicesCount} {tm.supplierInvoicesCount === 1 ? 'invoice' : 'invoices'}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right font-mono font-bold text-slate-700">
                        {formatMoney(tm.totalDirectCostsUSD, 'USD')}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span
                          className={`font-mono font-black text-sm px-2.5 py-1 rounded-xl inline-block ${
                            isProfitable
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isProfitable ? '+' : ''}
                          {formatMoney(tm.grossProfitUSD, 'USD')}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="space-y-1">
                          <span
                            className={`font-mono font-black text-xs ${
                              isProfitable ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {tm.grossMarginPercent}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full ml-auto overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                tm.grossMarginPercent >= 30
                                  ? 'bg-emerald-500'
                                  : tm.grossMarginPercent >= 15
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, tm.grossMarginPercent))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTourForDetail(tm.tour);
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 mx-auto shadow-2xs cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED TOUR GROSS PROFIT INSPECTOR MODAL */}
      {selectedTourForDetail && selectedMetric && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto animate-scale-in">
            {/* Modal Top Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-800 flex items-center justify-center font-black">
                  <TrendingUp className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900">
                      {selectedMetric.tour.code}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Tour Gross Profit Inspector</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        selectedMetric.tour.status === 'Confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {selectedMetric.tour.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    {selectedMetric.tour.tourName || selectedMetric.tour.title}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                    <span>Client: <strong className="text-slate-800">{selectedMetric.client?.name || 'VIP Client'}</strong></span>
                    <span>&bull;</span>
                    <span>Destination: <strong className="text-slate-800">{selectedMetric.tour.destination}</strong></span>
                    <span>&bull;</span>
                    <span>Dates: <strong className="text-slate-800">{selectedMetric.tour.startDate} ({selectedMetric.tour.days.length} Days)</strong></span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTourForDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Profit KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Tour Revenue</span>
                <span className="text-xl font-black text-slate-900 block mt-1">
                  {formatMoney(selectedMetric.effectiveRevenueUSD, 'USD')}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {selectedMetric.totalInvoicedUSD > 0 ? 'Billed via invoices' : 'Contract price'}
                </span>
              </div>

              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                <span className="text-[10px] font-bold text-rose-800 uppercase block">Supplier Invoices</span>
                <span className="text-xl font-black text-rose-950 block mt-1">
                  {formatMoney(selectedMetric.totalSupplierCostsUSD, 'USD')}
                </span>
                <span className="text-[10px] text-rose-700 mt-0.5 block">
                  {selectedMetric.supplierInvoicesCount} invoices linked
                </span>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Gross Tour Profit</span>
                <span className="text-xl font-black text-emerald-700 block mt-1">
                  {formatMoney(selectedMetric.grossProfitUSD, 'USD')}
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold mt-0.5 block">
                  Revenue - Direct Costs
                </span>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">Gross Margin %</span>
                <span className="text-xl font-black text-amber-400 block mt-1">
                  {selectedMetric.grossMarginPercent}%
                </span>
                <span className="text-[10px] text-slate-300 mt-0.5 block">
                  Gross profit / Revenue
                </span>
              </div>
            </div>

            {/* Section 1: Supplier Invoices Breakdown for This Tour */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <span>Supplier Invoices Assigned to this Tour ({selectedMetric.supplierInvoices.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTripId(selectedMetric.tour.id);
                    setActiveView('tour-management');
                  }}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add / Manage Invoices in Tour Area</span>
                </button>
              </div>

              {selectedMetric.supplierInvoices.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1.5">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Supplier Invoices Linked to this Tour Yet</p>
                  <p className="text-[11px] text-slate-500">
                    When you receive a supplier invoice, mark it as belonging to this tour to calculate its expense and gross profit.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                        <th className="px-3.5 py-2.5">Invoice #</th>
                        <th className="px-3.5 py-2.5">Supplier</th>
                        <th className="px-3.5 py-2.5">Category</th>
                        <th className="px-3.5 py-2.5">Issue Date</th>
                        <th className="px-3.5 py-2.5">Status</th>
                        <th className="px-3.5 py-2.5 text-right">Amount (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedMetric.supplierInvoices.map((inv) => {
                        const sup = suppliers.find((s) => s.id === inv.supplierId);
                        const usd = convertCurrency(inv.amount, inv.currency, 'USD');

                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/60">
                            <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900">
                              {inv.invoiceNumber}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-800">
                              {sup?.name || 'Partner Supplier'}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-500">
                              {sup?.category || 'Tour Operations'}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-500">
                              {inv.issueDate}
                            </td>
                            <td className="px-3.5 py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  inv.status === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : inv.status === 'Overdue'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-bold text-rose-700">
                              {formatMoney(usd, 'USD')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTourForDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close Inspector
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openClientPortal(selectedMetric.tour.id)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Live Client View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTripId(selectedMetric.tour.id);
                    setActiveView('tour-management');
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Full Tour Management Area &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
