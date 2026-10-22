import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  Bus,
  UserCheck,
  Shield,
  Utensils,
  MapPin,
  Building,
  Info,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Layers,
  Sparkles,
  X,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Itinerary, GeneralProjectedCostItem, CurrencyCode } from '../../types';

interface GeneralProjectedCostsSectionProps {
  trip: Itinerary;
  onUpdateTrip: (updated: Itinerary) => void;
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'Transport & Fleet': Bus,
  'Guide / Tour Director': UserCheck,
  'Accommodations': Building,
  'Security & VIP Handling': Shield,
  'Catering & Dining': Utensils,
  'Attractions & Permits': MapPin,
  'General Logistics': Layers,
  'Other': DollarSign,
};

const COMMON_PRESETS = [
  {
    title: 'Dedicated VIP 35-Seat Executive Coach & Driver (Full Tour)',
    category: 'Transport & Fleet' as const,
    estimatedAmount: 4800,
    notes: 'Includes unlimited tour mileage, fuel, driver hotel lodging and daily per-diem.',
  },
  {
    title: 'Master Tour Director / Certified Lead Guide Honorarium',
    category: 'Guide / Tour Director' as const,
    estimatedAmount: 3500,
    notes: 'Licensed senior expert guide for full itinerary duration with personal headset transmitter system.',
  },
  {
    title: 'VIP Airport Meet & Assist with Fast-Track Tarmac Chauffeur',
    category: 'Security & VIP Handling' as const,
    estimatedAmount: 1200,
    notes: 'Priority immigration clearance, passport VIP lounge access and luggage porterage for entire party.',
  },
  {
    title: 'National Parks & UNESCO Sites All-Access Permits & Passes',
    category: 'Attractions & Permits' as const,
    estimatedAmount: 950,
    notes: 'Pre-arranged priority admission credentials and private docent rights across all itinerary locations.',
  },
  {
    title: 'Dedicated Security Detail & First-Aid Certified Chaperone',
    category: 'Security & VIP Handling' as const,
    estimatedAmount: 2200,
    notes: '24/7 discrete security presence and communications radio coordination.',
  },
];

export const GeneralProjectedCostsSection: React.FC<GeneralProjectedCostsSectionProps> = ({
  trip,
  onUpdateTrip,
}) => {
  const { hasFullFinancialView, suppliers, convertCurrency, formatMoney } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GeneralProjectedCostItem['category']>('Transport & Fleet');
  const [supplierId, setSupplierId] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState<number>(1500);
  const [currency, setCurrency] = useState<CurrencyCode>(trip.currency || 'USD');
  const [assignedDays, setAssignedDays] = useState<number>(trip.days?.length || 1);
  const [notes, setNotes] = useState('');

  // If user lacks financial permissions, show restricted notice or nothing
  if (!hasFullFinancialView) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" />
          <span>Projected Financial Cost Projections &amp; Margin Estimation are restricted to <strong>Full Financial View</strong> staff.</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded text-slate-700">
          Restricted View
        </span>
      </div>
    );
  }

  const generalCosts: GeneralProjectedCostItem[] = trip.generalProjectedCosts || [];

  // Specific item projected costs (sum of act.costEstimate from all days)
  const specificItemsTotalUSD = useMemo(() => {
    let total = 0;
    trip.days.forEach((day) => {
      day.activities?.forEach((act) => {
        if (act.costEstimate) {
          total += convertCurrency(act.costEstimate, act.currency || trip.currency, 'USD');
        }
      });
    });
    return total;
  }, [trip.days, trip.currency, convertCurrency]);

  // General projected costs sum
  const generalCostsTotalUSD = useMemo(() => {
    return generalCosts.reduce((sum, item) => {
      return sum + convertCurrency(item.estimatedAmount, item.currency, 'USD');
    }, 0);
  }, [generalCosts, convertCurrency]);

  // Total projected costs
  const totalProjectedCostsUSD = specificItemsTotalUSD + generalCostsTotalUSD;

  // Tour contract / quoted price in USD
  const tourContractPriceUSD = convertCurrency(trip.totalClientPrice, trip.currency, 'USD');

  // Projected Gross Profit & Margin
  const projectedGrossProfitUSD = tourContractPriceUSD - totalProjectedCostsUSD;
  const projectedGrossMarginPercent = tourContractPriceUSD > 0
    ? Math.round((projectedGrossProfitUSD / tourContractPriceUSD) * 1000) / 10
    : 0;

  const handleOpenAddModal = (preset?: typeof COMMON_PRESETS[0]) => {
    if (preset) {
      setTitle(preset.title);
      setCategory(preset.category);
      setEstimatedAmount(preset.estimatedAmount);
      setNotes(preset.notes);
    } else {
      setTitle('');
      setCategory('Transport & Fleet');
      setEstimatedAmount(2500);
      setNotes('');
    }
    setSupplierId('');
    setCurrency(trip.currency || 'USD');
    setAssignedDays(trip.days?.length || 1);
    setEditingItemId(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: GeneralProjectedCostItem) => {
    setEditingItemId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setSupplierId(item.supplierId || '');
    setEstimatedAmount(item.estimatedAmount);
    setCurrency(item.currency);
    setAssignedDays(item.assignedDays || trip.days?.length || 1);
    setNotes(item.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || estimatedAmount <= 0) return;

    let updatedList: GeneralProjectedCostItem[];

    if (editingItemId) {
      updatedList = generalCosts.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              title: title.trim(),
              category,
              supplierId: supplierId || undefined,
              estimatedAmount: Number(estimatedAmount),
              currency,
              assignedDays: Number(assignedDays) || undefined,
              notes: notes.trim() || undefined,
            }
          : item
      );
    } else {
      const newItem: GeneralProjectedCostItem = {
        id: `gpc-${Date.now()}`,
        title: title.trim(),
        category,
        supplierId: supplierId || undefined,
        estimatedAmount: Number(estimatedAmount),
        currency,
        assignedDays: Number(assignedDays) || undefined,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString().split('T')[0],
      };
      updatedList = [...generalCosts, newItem];
    }

    onUpdateTrip({
      ...trip,
      generalProjectedCosts: updatedList,
      lastUpdated: new Date().toISOString(),
    });

    setIsAddModalOpen(false);
    setEditingItemId(null);
  };

  const handleDeleteItem = (id: string) => {
    const updatedList = generalCosts.filter((item) => item.id !== id);
    onUpdateTrip({
      ...trip,
      generalProjectedCosts: updatedList,
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 animate-fade-in">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-black">
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900">
                Proposed Itinerary Quotation
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Full Financial View Access
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
              Projected Tour Profit &amp; General Projected Costs
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenAddModal()}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Add General Projected Cost</span>
        </button>
      </div>

      {/* Isolation Notice Banner */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">Quotation Planning Only &bull; Isolated from Actual Ledger:</span>
          <p className="text-[11px] text-amber-900/90 leading-relaxed">
            These projected item and general costs (bus, guide, permits) are stored solely for this proposed itinerary to allow full financial view members to quote and calculate projected profit. They <strong>do NOT affect actual agency business expenses, profit margin %, or the executive dashboard</strong> until the tour is confirmed and supplier invoices are officially added.
          </p>
        </div>
      </div>

      {/* Projected Financial KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Client Package Price
          </span>
          <div className="text-lg font-black text-slate-900 mt-1">
            {formatMoney(tourContractPriceUSD, 'USD')}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {trip.totalClientPrice.toLocaleString()} {trip.currency}
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Specific Activities Costs
          </span>
          <div className="text-lg font-black text-slate-900 mt-1">
            {formatMoney(specificItemsTotalUSD, 'USD')}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Sum of scheduled day items
          </span>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            General Tour Costs
          </span>
          <div className="text-lg font-black text-slate-900 mt-1">
            {formatMoney(generalCostsTotalUSD, 'USD')}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {generalCosts.length} items (Bus, Guide, etc.)
          </span>
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Projected Gross Profit
          </span>
          <div className="text-lg font-black text-emerald-700 mt-1">
            {projectedGrossProfitUSD >= 0 ? '+' : ''}{formatMoney(projectedGrossProfitUSD, 'USD')}
          </div>
          <span className="text-[10px] text-emerald-800 font-semibold mt-0.5 block">
            Quoted price - Projected costs
          </span>
        </div>

        <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
            Projected Margin %
          </span>
          <div className="text-lg font-black text-amber-400 mt-1">
            {projectedGrossMarginPercent}%
          </div>
          <span className="text-[10px] text-slate-300 mt-0.5 block">
            Target &gt; 35% margin
          </span>
        </div>
      </div>

      {/* General Projected Costs Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>General Projected Cost Items ({generalCosts.length})</span>
          </h4>
          <span className="text-xs text-slate-500 font-medium">
            Fleet, tour directors, chaperones, permits &amp; whole-journey disbursements
          </span>
        </div>

        {generalCosts.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
            <Bus className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800">
                No general projected costs added to this itinerary yet
              </p>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                Add tour-level projected expenses such as coach hire, master guide honorarium, or VIP logistics to calculate your proposed gross margin.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Quick Add Preset:</span>
              {COMMON_PRESETS.slice(0, 3).map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleOpenAddModal(p)}
                  className="px-2.5 py-1 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-950 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  + {p.title.split(' ')[0]} {p.title.split(' ')[1]} (${p.estimatedAmount})
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Cost Item &amp; Details</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Assigned Supplier</th>
                  <th className="px-4 py-3 text-right">Projected Cost</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generalCosts.map((item) => {
                  const Icon = CATEGORY_ICONS[item.category] || DollarSign;
                  const sup = suppliers.find((s) => s.id === item.supplierId);
                  const amountUSD = convertCurrency(item.estimatedAmount, item.currency, 'USD');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="w-3.5 h-3.5 text-amber-700" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {item.title}
                            </div>
                            {item.notes && (
                              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                {item.notes}
                              </div>
                            )}
                            {item.assignedDays && (
                              <div className="text-[10px] text-amber-800 font-medium mt-0.5">
                                Allocated across {item.assignedDays} tour days
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.category}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {sup ? (
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{sup.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Direct / Unspecified</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                        <div>
                          {item.estimatedAmount.toLocaleString()} {item.currency}
                        </div>
                        {item.currency !== 'USD' && (
                          <div className="text-[10px] text-slate-400">
                            ~{formatMoney(amountUSD, 'USD')}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Projected Cost"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove Projected Cost"
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
        )}
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingItemId ? 'Edit General Projected Cost' : 'Add General Projected Cost'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tour-wide projection for {trip.title} (Bus, Guide, Logistics)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Item Description / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dedicated 35-Seat Executive Coach (5 Days)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="Transport & Fleet">🚌 Transport &amp; Fleet</option>
                    <option value="Guide / Tour Director">👤 Guide / Tour Director</option>
                    <option value="Accommodations">🏨 Accommodations</option>
                    <option value="Security & VIP Handling">🛡️ Security &amp; VIP Handling</option>
                    <option value="Catering & Dining">🍽️ Catering &amp; Dining</option>
                    <option value="Attractions & Permits">🎟️ Attractions &amp; Permits</option>
                    <option value="General Logistics">📦 General Logistics</option>
                    <option value="Other">💼 Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Assigned Supplier (Optional)
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="">-- No Direct Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Estimated Projected Cost *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="10"
                    value={estimatedAmount}
                    onChange={(e) => setEstimatedAmount(Number(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="ILS">ILS (₪)</option>
                    <option value="CHF">CHF (Fr)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Operational Notes &amp; Specifications
                </label>
                <textarea
                  rows={2}
                  placeholder="Special stipulations, vehicle size, driver overtime provisions, etc..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>{editingItemId ? 'Update Projected Cost' : 'Save Projected Cost'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
