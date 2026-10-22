import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  DollarSign,
  TrendingUp,
  Building,
  PieChart,
  Filter,
  CheckCircle2,
  Trash2,
  Tag,
  Calendar,
  Download,
  Coins,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CurrencyCode, Expense, ExpenseCategory } from '../../types';
import { FxRatesModal } from '../finance/FxRatesModal';

export const ExpenseTracker: React.FC = () => {
  const {
    expenses,
    supplierInvoices,
    addExpense,
    deleteExpense,
    itineraries,
    suppliers,
    convertCurrency,
    formatMoney,
    hasFullFinancialView,
  } = useApp();

  const [filterType, setFilterType] = useState<'ALL' | 'PROJECT' | 'OVERHEAD'>('ALL');
  const [selectedTripFilter, setSelectedTripFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFxModalOpen, setIsFxModalOpen] = useState(false);

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    title: '',
    category: 'Hotel / Lodging',
    amount: 1000,
    currency: 'USD',
    isGeneralOverhead: false,
    paymentStatus: 'Paid',
    paymentMethod: 'Wire Transfer',
    date: new Date().toISOString().split('T')[0],
    receiptRef: `REC-${Date.now().toString().slice(-4)}`,
  });

  const filteredExpenses = expenses.filter((e) => {
    if (filterType === 'PROJECT' && e.isGeneralOverhead) return false;
    if (filterType === 'OVERHEAD' && !e.isGeneralOverhead) return false;
    if (selectedTripFilter !== 'ALL' && e.tripId !== selectedTripFilter) return false;
    return true;
  });

  // Profitability calculations per project (combining legacy direct expenses + assigned supplier invoices)
  const projectFinancials = itineraries.map((trip) => {
    const tripExpensesUSD = expenses
      .filter((e) => e.tripId === trip.id && !e.isGeneralOverhead)
      .reduce((sum, e) => sum + convertCurrency(e.amount, e.currency, 'USD'), 0);

    const tripSupplierInvoicesUSD = supplierInvoices
      .filter((si) => si.tripId === trip.id)
      .reduce((sum, si) => sum + convertCurrency(si.amount, si.currency, 'USD'), 0);

    const totalCostUSD = tripExpensesUSD + tripSupplierInvoicesUSD;
    const revenueUSD = convertCurrency(trip.totalClientPrice, trip.currency, 'USD');
    const grossProfitUSD = revenueUSD - totalCostUSD;
    const marginPercent = revenueUSD > 0 ? (grossProfitUSD / revenueUSD) * 100 : 0;

    return {
      trip,
      revenueUSD,
      totalCostUSD,
      tripSupplierInvoicesUSD,
      tripExpensesUSD,
      grossProfitUSD,
      marginPercent: Math.round(marginPercent * 10) / 10,
    };
  });

  // Total Company Financials
  const totalCompanyRevenueUSD = projectFinancials.reduce((sum, p) => sum + p.revenueUSD, 0);
  const totalDirectProjectCostsUSD = projectFinancials.reduce((sum, p) => sum + p.totalCostUSD, 0);

  // Overheads: Legacy overhead expenses + Supplier Invoices designated to General Overhead
  const legacyGeneralOverheadsUSD = expenses
    .filter((e) => e.isGeneralOverhead)
    .reduce((sum, e) => sum + convertCurrency(e.amount, e.currency, 'USD'), 0);

  const overheadSupplierInvoicesUSD = supplierInvoices
    .filter((si) => !si.tripId || si.tripId === 'OVERHEAD' || si.tripId === 'GENERAL_OVERHEAD')
    .reduce((sum, si) => sum + convertCurrency(si.amount, si.currency, 'USD'), 0);

  const totalGeneralOverheadsUSD = legacyGeneralOverheadsUSD + overheadSupplierInvoicesUSD;
  const netCompanyProfitUSD = totalCompanyRevenueUSD - totalDirectProjectCostsUSD - totalGeneralOverheadsUSD;
  const netProfitMarginPercent = totalCompanyRevenueUSD > 0
    ? Math.round((netCompanyProfitUSD / totalCompanyRevenueUSD) * 1000) / 10
    : 0;

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;

    const exp: Expense = {
      id: `exp-${Date.now()}`,
      title: newExpense.title || 'Operational Expense',
      tripId: newExpense.isGeneralOverhead ? undefined : newExpense.tripId,
      supplierId: newExpense.supplierId || undefined,
      category: (newExpense.category as ExpenseCategory) || 'Hotel / Lodging',
      date: newExpense.date || new Date().toISOString().split('T')[0],
      amount: Number(newExpense.amount),
      currency: (newExpense.currency as CurrencyCode) || 'USD',
      convertedAmountUSD: convertCurrency(Number(newExpense.amount), (newExpense.currency as CurrencyCode) || 'USD', 'USD'),
      paymentStatus: (newExpense.paymentStatus as any) || 'Paid',
      paymentMethod: (newExpense.paymentMethod as any) || 'Wire Transfer',
      receiptRef: newExpense.receiptRef || `REC-${Date.now().toString().slice(-4)}`,
      isGeneralOverhead: Boolean(newExpense.isGeneralOverhead),
      notes: newExpense.notes,
    };

    addExpense(exp);
    setIsAddModalOpen(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Module 4: Cost Management
            </span>
            <span className="text-xs text-slate-500 font-medium">Per-Project &amp; Corporate Overheads</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Expense Tracking &amp; Margin Analysis
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Real-time project cost accounting, supplier fee audits, and general corporate overhead allocations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              const headers = ['Title', 'Category', 'TripCode', 'Amount', 'Currency', 'USD_Amount', 'PaymentMethod', 'Receipt', 'Overhead'];
              const rows = filteredExpenses.map((e) => {
                const trip = itineraries.find((t) => t.id === e.tripId);
                return [
                  `"${e.title.replace(/"/g, '""')}"`,
                  `"${e.category}"`,
                  `"${trip?.code || 'Overhead'}"`,
                  e.amount,
                  e.currency,
                  e.convertedAmountUSD,
                  `"${e.paymentMethod}"`,
                  `"${e.receiptRef || ''}"`,
                  e.isGeneralOverhead ? 'YES' : 'NO',
                ].join(',');
              });
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `tourops_expenses_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsFxModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Manage currency exchange rates"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Manage FX Rates</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Corporate Profitability Summary Cards */}
      {hasFullFinancialView && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Projects Revenue
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {formatMoney(totalCompanyRevenueUSD, 'USD')}
            </div>
            <div className="text-xs text-slate-500 mt-1">Gross client billing contracts</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Direct Project Costs
            </div>
            <div className="text-2xl font-black text-rose-700 mt-1">
              {formatMoney(totalDirectProjectCostsUSD, 'USD')}
            </div>
            <div className="text-xs text-slate-500 mt-1">Hotels, guides, charters &amp; transport</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              General Corporate Overheads
            </div>
            <div className="text-2xl font-black text-slate-700 mt-1">
              {formatMoney(totalGeneralOverheadsUSD, 'USD')}
            </div>
            <div className="text-xs text-slate-500 mt-1">Rent, insurances, licensing &amp; comms</div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-md border border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Net Operating Profit
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {formatMoney(netCompanyProfitUSD, 'USD')}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Net Margin: <strong className="text-emerald-400">{netProfitMarginPercent}%</strong>
            </div>
          </div>
        </div>

        {/* Project Profitability Breakdown Table */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-6">
          <h3 className="text-base font-bold text-slate-900">
            Per-Project Profitability &amp; Gross Margins
          </h3>
          <p className="text-xs text-slate-500">
            Direct comparison between invoiced package price and incurred supplier operational expenses per tour.
          </p>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Tour Code &amp; Title</th>
                  <th className="py-3 px-4">Invoiced Revenue (USD)</th>
                  <th className="py-3 px-4">Direct Costs (USD)</th>
                  <th className="py-3 px-4">Gross Profit</th>
                  <th className="py-3 px-4">Margin %</th>
                  <th className="py-3 px-4">Health Indicator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectFinancials.map((p) => {
                  const isHealthy = p.marginPercent >= 35;
                  const isModerate = p.marginPercent >= 20 && p.marginPercent < 35;

                  return (
                    <tr key={p.trip.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{p.trip.code}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{p.trip.title}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatMoney(p.revenueUSD, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 text-rose-700 font-semibold">
                        {formatMoney(p.totalCostUSD, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-black">
                        {formatMoney(p.grossProfitUSD, 'USD')}
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] ${
                            isHealthy
                              ? 'bg-emerald-100 text-emerald-800'
                              : isModerate
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.marginPercent}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isHealthy ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, p.marginPercent))}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* Expenses Ledger & Filter Section */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">
            Operational Cost Ledger ({filteredExpenses.length})
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Expenses
            </button>
            <button
              onClick={() => setFilterType('PROJECT')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterType === 'PROJECT'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Project Costs
            </button>
            <button
              onClick={() => setFilterType('OVERHEAD')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterType === 'OVERHEAD'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              General Overheads
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Expense Title</th>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6">Allocation (Trip / Overhead)</th>
                <th className="py-3 px-6">Amount (Native &amp; USD)</th>
                <th className="py-3 px-6">Method &amp; Receipt</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => {
                const trip = itineraries.find((t) => t.id === exp.tripId);
                const supplier = suppliers.find((s) => s.id === exp.supplierId);

                return (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      {exp.title}
                      {supplier && (
                        <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                          Supplier: {supplier.name}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      {exp.isGeneralOverhead ? (
                        <span className="text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                          General Corporate Overhead
                        </span>
                      ) : (
                        <span className="font-mono text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {trip?.code || 'Project Linked'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      {hasFullFinancialView || exp.isGeneralOverhead ? (
                        <>
                          <div className="font-bold text-slate-900">
                            {formatMoney(exp.amount, exp.currency)}
                          </div>
                          {exp.currency !== 'USD' && (
                            <div className="text-[10px] text-slate-400">
                              &asymp; {formatMoney(exp.convertedAmountUSD, 'USD')} USD
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400 font-medium">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      <div>{exp.paymentMethod}</div>
                      <div className="font-mono text-[10px] text-slate-400">{exp.receiptRef}</div>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Record Operational Expense</h3>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Belmond Hotel Caruso Final Balance Wire"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Amount</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Currency</label>
                  <select
                    value={newExpense.currency}
                    onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="ILS">ILS (₪)</option>
                    <option value="CHF">CHF (Fr)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="Hotel / Lodging">Hotel / Lodging</option>
                    <option value="Private Guide & Expert">Private Guide & Expert</option>
                    <option value="Vehicle & Chauffeur">Vehicle & Chauffeur</option>
                    <option value="Attractions & Permits">Attractions & Permits</option>
                    <option value="Meals & Wine">Meals & Wine</option>
                    <option value="Flights / Trains">Flights / Trains</option>
                    <option value="Office & Admin">Office & Admin</option>
                    <option value="Software & Marketing">Software & Marketing</option>
                    <option value="Insurance & Legal">Insurance & Legal</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Payment Method</label>
                  <select
                    value={newExpense.paymentMethod}
                    onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="Wire Transfer">Wire Transfer</option>
                    <option value="Company Card">Company Card</option>
                    <option value="Direct Debit">Direct Debit</option>
                    <option value="Petty Cash">Petty Cash</option>
                  </select>
                </div>
              </div>

              {/* Allocation */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="overheadCheck"
                    checked={newExpense.isGeneralOverhead}
                    onChange={(e) => setNewExpense({ ...newExpense, isGeneralOverhead: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <label htmlFor="overheadCheck" className="text-xs text-slate-700 font-bold">
                    This is General Company Overhead (Not tied to a specific client tour)
                  </label>
                </div>

                {!newExpense.isGeneralOverhead && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Link to Tour Project
                    </label>
                    <select
                      value={newExpense.tripId || ''}
                      onChange={(e) => setNewExpense({ ...newExpense, tripId: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="">-- Select Trip --</option>
                      {itineraries.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.code} - {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Record Expense
                </button>
              </div>
            </form>
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
