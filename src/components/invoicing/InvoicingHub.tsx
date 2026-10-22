import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Receipt,
  CheckCircle2,
  Clock,
  Printer,
  CreditCard,
  Building,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Trash2,
  Coins,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CurrencyCode, Invoice, PaymentRecord } from '../../types';
import { FxRatesModal } from '../finance/FxRatesModal';

export const InvoicingHub: React.FC = () => {
  const {
    invoices,
    exchangeRates,
    updateExchangeRate,
    clients,
    itineraries,
    recordPayment,
    addInvoice,
    deleteInvoice,
    deleteAllInvoices,
    generateInvoiceFromItinerary,
    formatMoney,
    convertCurrency,
  } = useApp();

  const [activeCurrencyView, setActiveCurrencyView] = useState<CurrencyCode>('USD');
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Invoice | null>(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [isFxModalOpen, setIsFxModalOpen] = useState(false);
  const [invoiceToast, setInvoiceToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setInvoiceToast(msg);
    setTimeout(() => setInvoiceToast(null), 4000);
  };

  // New payment form state
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Wire' | 'Credit Card' | 'Stripe' | 'AMEX'>('Bank Wire');
  const [paymentRef, setPaymentRef] = useState<string>('');

  // Currency editing state
  const [editingRateCode, setEditingRateCode] = useState<CurrencyCode | null>(null);
  const [editingRateValue, setEditingRateValue] = useState<number>(1);

  // Total invoice stats
  const totalInvoicedUSD = invoices.reduce(
    (sum, inv) => sum + convertCurrency(inv.totalAmount, inv.currency, 'USD'),
    0
  );
  const totalPaidUSD = invoices.reduce(
    (sum, inv) => sum + convertCurrency(inv.amountPaid, inv.currency, 'USD'),
    0
  );
  const totalOutstandingUSD = totalInvoicedUSD - totalPaidUSD;

  const handleOpenPayment = (inv: Invoice) => {
    setPaymentInvoice(inv);
    setPaymentAmount(inv.balanceDue);
    setPaymentRef(`REF-${Math.floor(100000 + Math.random() * 900000)}`);
    setIsRecordPaymentOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice || paymentAmount <= 0) return;

    recordPayment(paymentInvoice.id, {
      date: new Date().toISOString().split('T')[0],
      amount: Number(paymentAmount),
      currency: paymentInvoice.currency,
      convertedAmountUSD: convertCurrency(paymentAmount, paymentInvoice.currency, 'USD'),
      paymentMethod,
      reference: paymentRef,
      notes: `Recorded via TourOps Invoicing Hub`,
    });

    setIsRecordPaymentOpen(false);
    setPaymentInvoice(null);
  };

  const handleSaveRate = (code: CurrencyCode) => {
    updateExchangeRate(code, Number(editingRateValue));
    setEditingRateCode(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Module 3A: Client Finance
            </span>
            <span className="text-xs text-slate-500 font-medium">Multi-Currency &amp; FX Integration</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Client Invoices &amp; Payment Ledger
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Auto-generate client trip invoices, record installments, and convert transactions with live local currency exchange rates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs font-semibold">
            <span className="px-2.5 text-slate-400 text-[11px] uppercase">Display Base:</span>
            {(['USD', 'EUR', 'GBP', 'ILS'] as CurrencyCode[]).map((curr) => (
              <button
                key={curr}
                onClick={() => setActiveCurrencyView(curr)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeCurrencyView === curr
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          {itineraries.length > 0 && (
            <button
              onClick={() => {
                const tripToInvoice = itineraries[0];
                const inv = generateInvoiceFromItinerary(tripToInvoice.id);
                showToast(`Generated Invoice #${inv.invoiceNumber} for "${tripToInvoice.title}"`);
              }}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Generate From Itinerary</span>
            </button>
          )}

          {invoices.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Delete all client invoices from the system? This action cannot be undone.')) {
                  deleteAllInvoices();
                  showToast('All client invoices have been deleted.');
                }
              }}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Delete all existing client invoices"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete All Invoices</span>
            </button>
          )}
        </div>
      </div>

      {invoiceToast && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-950 text-xs font-bold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{invoiceToast}</span>
          </div>
          <button onClick={() => setInvoiceToast(null)} className="text-blue-700 hover:text-blue-950 font-bold cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Real-Time Currency Exchange Rates Ticker Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              Live Local Currency Rates (USD Base)
            </span>
            <span className="text-slate-400 hidden sm:inline">&bull; Real-time conversion engine</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsFxModalOpen(true)}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Open full Foreign Exchange (FX) rate manager"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Manage FX Rates</span>
            </button>
            <span className="text-[11px] text-slate-400 hidden md:inline">or click any rate card below</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {(Object.keys(exchangeRates) as CurrencyCode[]).map((code) => {
            const rateObj = exchangeRates[code];
            const isEditing = editingRateCode === code;

            return (
              <div
                key={code}
                onClick={() => {
                  if (!isEditing && code !== 'USD') {
                    setEditingRateCode(code);
                    setEditingRateValue(rateObj.rateAgainstUSD);
                  }
                }}
                className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  code === 'USD'
                    ? 'bg-white/10 border-white/20 cursor-default'
                    : isEditing
                    ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {code} ({rateObj.symbol})
                </div>
                {isEditing ? (
                  <div className="mt-1 flex items-center justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      step="0.01"
                      value={editingRateValue}
                      onChange={(e) => setEditingRateValue(Number(e.target.value))}
                      className="w-16 px-1 py-0.5 text-xs bg-slate-950 text-white border border-amber-400 rounded-md text-center"
                    />
                    <button
                      onClick={() => handleSaveRate(code)}
                      className="px-1.5 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-md"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <div className="text-xs font-mono font-bold text-white mt-0.5">
                    {rateObj.rateAgainstUSD.toFixed(code === 'JPY' ? 1 : 2)}
                  </div>
                )}
                <div className="text-[9px] text-slate-400 truncate mt-0.5">{rateObj.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Health Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Invoiced Volume
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatMoney(convertCurrency(totalInvoicedUSD, 'USD', activeCurrencyView), activeCurrencyView)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Across all confirmed client contracts</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Collected Receipts (Paid)
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {formatMoney(convertCurrency(totalPaidUSD, 'USD', activeCurrencyView), activeCurrencyView)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {Math.round((totalPaidUSD / (totalInvoicedUSD || 1)) * 100)}% collection efficiency
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Outstanding Receivables
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {formatMoney(convertCurrency(totalOutstandingUSD, 'USD', activeCurrencyView), activeCurrencyView)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Due before departures commence</div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Client Tax Invoices &amp; Installments ({invoices.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Invoice #</th>
                <th className="py-3.5 px-6">Client &amp; Trip</th>
                <th className="py-3.5 px-6">Issue / Due Date</th>
                <th className="py-3.5 px-6">Total Amount</th>
                <th className="py-3.5 px-6">Paid / Balance Due</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const client = clients.find((c) => c.id === inv.clientId);
                const trip = itineraries.find((t) => t.id === inv.tripId);
                const isPaid = inv.status === 'Paid';

                return (
                  <tr key={inv.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{client?.name || 'Client'}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {trip?.code || 'Trip'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div>Issued: {inv.issueDate}</div>
                      <div className="text-amber-800 font-semibold mt-0.5">Due: {inv.dueDate}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">
                        {formatMoney(inv.totalAmount, inv.currency)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        &asymp; {formatMoney(convertCurrency(inv.totalAmount, inv.currency, activeCurrencyView), activeCurrencyView)} ({activeCurrencyView})
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-emerald-700">
                        Paid: {formatMoney(inv.amountPaid, inv.currency)}
                      </div>
                      <div className="text-amber-700 font-bold mt-0.5">
                        Due: {formatMoney(inv.balanceDue, inv.currency)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedInvoiceForModal(inv)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                        title="View Official Invoice PDF"
                      >
                        View &amp; Print
                      </button>
                      {!isPaid && (
                        <>
                          <button
                            onClick={() => {
                              const client = clients.find((c) => c.id === inv.clientId);
                              const trip = itineraries.find((t) => t.id === inv.tripId);
                              const text = `Dear ${client?.name || 'Valued Client'},\n\nThis is a cordial reminder from TourOps 360 regarding Invoice #${inv.invoiceNumber} for your upcoming tour "${trip?.title || 'Private Tour'}".\n\nOutstanding balance due: ${formatMoney(inv.balanceDue, inv.currency)}.\nDue Date: ${inv.dueDate}.\n\nPayment may be remitted via wire transfer to:\nBeneficiary: TourOps 360 Client Trust Account\nIBAN: GB29BARC20201539482109\nSWIFT: BARCGB22\n\nWarm regards,\nTourOps Concierge`;
                              navigator.clipboard.writeText(text);
                              alert(`Payment reminder copied to clipboard for ${client?.name}!\n\n"${text.slice(0, 120)}..."`);
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                            title="Copy polite payment reminder message"
                          >
                            Send Reminder
                          </button>
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors cursor-pointer"
                          >
                            Record Payment
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete client invoice #${inv.invoiceNumber}?`)) {
                            deleteInvoice(inv.id);
                            showToast(`Invoice #${inv.invoiceNumber} was deleted.`);
                          }
                        }}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs transition-colors inline-flex items-center cursor-pointer"
                        title="Delete this client invoice"
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

        {invoices.length === 0 && (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
              <Receipt className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No Client Invoices Found</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              All existing client invoice records have been deleted. You can generate fresh invoices directly from your active itineraries at any time.
            </p>
            {itineraries.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    const firstTrip = itineraries[0];
                    const newInv = generateInvoiceFromItinerary(firstTrip.id);
                    showToast(`Generated Invoice #${newInv.invoiceNumber} from itinerary "${firstTrip.title}"`);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Generate Invoice from {itineraries[0].code}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isRecordPaymentOpen && paymentInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Record Client Payment / Installment
            </h3>
            <p className="text-xs text-slate-500">
              Invoice #{paymentInvoice.invoiceNumber} &bull; Outstanding Balance:{' '}
              <strong className="text-amber-800 font-bold">
                {formatMoney(paymentInvoice.balanceDue, paymentInvoice.currency)}
              </strong>
            </p>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">
                  Payment Amount ({paymentInvoice.currency})
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={paymentInvoice.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="Bank Wire">Bank Wire Transfer</option>
                  <option value="AMEX">American Express (Centurion / Platinum)</option>
                  <option value="Credit Card">Visa / Mastercard</option>
                  <option value="Stripe">Stripe Gateway</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">
                  Wire / Transaction Reference
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WIRE-BARCLAYS-98102"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Confirm &amp; Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Invoice View & Print Modal */}
      {selectedInvoiceForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 my-8 space-y-6">
            {/* Header with Print Action */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200 no-print">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Official Client Invoice View
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setSelectedInvoiceForModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Invoice Document */}
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    TourOps <span className="text-amber-600 font-serif italic">360</span>
                  </h2>
                  <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                    <div>Luxury Destination Management &amp; Expeditions Ltd.</div>
                    <div>VAT ID: TO-EU-981204481 &bull; License #TO-2026-VIP</div>
                    <div>billing@tourops360.com &bull; +44 20 7946 0912</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-slate-900">
                    {selectedInvoiceForModal.invoiceNumber}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Date: {selectedInvoiceForModal.issueDate}
                  </div>
                  <div className="text-xs font-bold text-amber-800">
                    Due Date: {selectedInvoiceForModal.dueDate}
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Billed To:
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {clients.find((c) => c.id === selectedInvoiceForModal.clientId)?.name}
                </div>
                <div className="text-slate-600 mt-0.5">
                  {clients.find((c) => c.id === selectedInvoiceForModal.clientId)?.email}
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoiceForModal.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 font-medium text-slate-800">{item.description}</td>
                        <td className="p-3 text-center text-slate-600">{item.quantity}</td>
                        <td className="p-3 text-right text-slate-600">
                          {formatMoney(item.unitPrice, selectedInvoiceForModal.currency)}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          {formatMoney(item.amount, selectedInvoiceForModal.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatMoney(selectedInvoiceForModal.subtotal, selectedInvoiceForModal.currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxes &amp; Tourism Levies:</span>
                    <span>{formatMoney(selectedInvoiceForModal.taxAmount, selectedInvoiceForModal.currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Contract Amount:</span>
                    <span>{formatMoney(selectedInvoiceForModal.totalAmount, selectedInvoiceForModal.currency)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-emerald-700">
                    <span>Amount Paid:</span>
                    <span>- {formatMoney(selectedInvoiceForModal.amountPaid, selectedInvoiceForModal.currency)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-amber-800 text-sm pt-1 border-t border-slate-200">
                    <span>Balance Due:</span>
                    <span>{formatMoney(selectedInvoiceForModal.balanceDue, selectedInvoiceForModal.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Wire Instructions */}
              <div className="p-4 bg-slate-900 text-slate-300 rounded-2xl text-xs space-y-1">
                <div className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">
                  International Bank Wire Transfer Instructions
                </div>
                <div>Beneficiary: TourOps 360 Client Custody Trust Account</div>
                <div>IBAN: GB29BARC20201539482109 &bull; SWIFT/BIC: BARCGB22</div>
                <div>Please include Invoice Number #{selectedInvoiceForModal.invoiceNumber} on wire memo.</div>
              </div>
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
