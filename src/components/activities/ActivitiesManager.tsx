import React, { useState, useMemo } from 'react';
import {
  Compass,
  Plus,
  Search,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Check,
  X,
  Filter,
  DollarSign,
  Building,
  Tag,
  ArrowRight,
  BookOpen,
  Keyboard,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActivityCatalogItem } from '../../types';

export const ActivitiesManager: React.FC = () => {
  const {
    activityCatalog,
    addActivityCatalogItem,
    updateActivityCatalogItem,
    deleteActivityCatalogItem,
    suppliers,
    setActiveView,
    hasFullFinancialView,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [durationFilter, setDurationFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActivityCatalogItem | null>(null);

  // Dedicated Keyword Linking Modal State (triggered when clicking on activity in library)
  const [keywordModalItem, setKeywordModalItem] = useState<ActivityCatalogItem | null>(null);
  const [keywordInput, setKeywordInput] = useState<string>('');

  // Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDurationHours, setFormDurationHours] = useState<number>(2.0);
  const [formCategory, setFormCategory] = useState<string>('');
  const [formLocation, setFormLocation] = useState('');
  const [formCostEstimate, setFormCostEstimate] = useState<number>(0);
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formKeyword, setFormKeyword] = useState('');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open keyword modal when clicking on activity card in library
  const handleOpenKeywordModal = (item: ActivityCatalogItem) => {
    setKeywordModalItem(item);
    setKeywordInput(item.keyword || '');
  };

  const handleSaveKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywordModalItem) return;

    const cleanKeyword = keywordInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const updated: ActivityCatalogItem = {
      ...keywordModalItem,
      keyword: cleanKeyword || undefined,
    };
    updateActivityCatalogItem(updated);

    if (cleanKeyword) {
      showToast(`Linked keyword "${cleanKeyword}" to "${keywordModalItem.name}". Hold Shift + type "${cleanKeyword}" in any itinerary to auto-insert!`);
    } else {
      showToast(`Removed keyword from "${keywordModalItem.name}"`);
    }
    setKeywordModalItem(null);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormDescription('');
    setFormDurationHours(2.5);
    setFormCategory('');
    setFormLocation('');
    setFormCostEstimate(250);
    setFormSupplierId('');
    setFormKeyword('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ActivityCatalogItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormDurationHours(item.durationHours);
    setFormCategory(item.category || '');
    setFormLocation(item.location || '');
    setFormCostEstimate(item.costEstimate || 0);
    setFormSupplierId(item.supplierId || '');
    setFormKeyword(item.keyword || '');
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDescription.trim()) return;

    const cleanKeyword = formKeyword.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

    if (editingItem) {
      const updated: ActivityCatalogItem = {
        ...editingItem,
        name: formName.trim(),
        description: formDescription.trim(),
        durationHours: Number(formDurationHours) || 1,
        category: formCategory.trim() || undefined,
        location: formLocation.trim() || undefined,
        costEstimate: Number(formCostEstimate) || undefined,
        supplierId: formSupplierId || undefined,
        keyword: cleanKeyword || undefined,
      };
      updateActivityCatalogItem(updated);
      showToast(`Updated activity "${updated.name}"`);
    } else {
      const created: ActivityCatalogItem = {
        id: `act-${Date.now()}`,
        name: formName.trim(),
        description: formDescription.trim(),
        durationHours: Number(formDurationHours) || 1,
        category: formCategory.trim() || undefined,
        location: formLocation.trim() || undefined,
        costEstimate: Number(formCostEstimate) || undefined,
        supplierId: formSupplierId || undefined,
        currency: 'USD',
        included: true,
        keyword: cleanKeyword || undefined,
      };
      addActivityCatalogItem(created);
      showToast(`Added new activity "${created.name}" (${created.durationHours} hrs)`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: string, name: string) => {
    deleteActivityCatalogItem(id);
    showToast(`Deleted activity "${name}"`);
  };

  const filteredActivities = useMemo(() => {
    return activityCatalog.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        categoryFilter === 'ALL' || item.category === categoryFilter;

      const matchesDuration =
        durationFilter === 'ALL' ||
        (durationFilter === 'SHORT' && item.durationHours <= 2) ||
        (durationFilter === 'MEDIUM' && item.durationHours > 2 && item.durationHours <= 4) ||
        (durationFilter === 'FULL' && item.durationHours > 4);

      return matchesSearch && matchesCategory && matchesDuration;
    });
  }, [activityCatalog, searchQuery, categoryFilter, durationFilter]);

  const formatDurationDisplay = (hours: number) => {
    const wholeH = Math.floor(hours);
    const mins = Math.round((hours - wholeH) * 60);
    if (mins === 0) return `${wholeH} hr${wholeH > 1 ? 's' : ''}`;
    if (wholeH === 0) return `${mins} mins`;
    return `${wholeH}h ${mins}m`;
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Master Activities Catalog
            </span>
            <span className="text-xs text-slate-500 font-medium">Itinerary Insertion Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Activities, Descriptions &amp; Length Library
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure reusable master activities with full narrative descriptions and scheduled durations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Activity</span>
          </button>
        </div>
      </div>

      {/* PRO-TIP BANNER: SHIFT + KEYWORD SHORTCUT */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl p-5 border border-amber-500/30 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Tag className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  Shift + Keyword Fast Auto-Insert
                </span>
                <span className="text-xs font-semibold text-amber-300">Click any activity below to link a keyword</span>
              </div>
              <h2 className="text-base font-extrabold text-white">
                Click any activity in this library to link a keyword, then hold <kbd className="px-1.5 py-0.5 bg-slate-800 text-amber-400 border border-amber-400/50 rounded font-mono text-xs">Shift</kbd> and type it in any itinerary!
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Click an activity card below to assign its keyword shortcut (e.g. <span className="text-amber-300 font-mono font-bold">masada</span>, <span className="text-amber-300 font-mono font-bold">deadsea</span>, <span className="text-amber-300 font-mono font-bold">wine</span>). When in the itinerary builder, hold <strong className="text-amber-300 font-bold">Shift</strong> while typing that keyword to instantly auto-insert the complete activity with description, length, and booking status prompt!
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => setActiveView('itineraries')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <span>Design Itineraries</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search activity name, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="ALL">All Categories</option>
            <option value="Sightseeing">Sightseeing</option>
            <option value="Dining">Dining</option>
            <option value="Transport">Transport</option>
            <option value="Culture">Culture</option>
            <option value="Leisure">Leisure</option>
            <option value="Adventure">Adventure</option>
          </select>

          <select
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="ALL">All Lengths</option>
            <option value="SHORT">Short (≤ 2 Hours)</option>
            <option value="MEDIUM">Medium (2 – 4 Hours)</option>
            <option value="FULL">Half / Full Day (&gt; 4 Hours)</option>
          </select>

          {(searchQuery || categoryFilter !== 'ALL' || durationFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
                setDurationFilter('ALL');
              }}
              className="text-xs text-amber-700 font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing {filteredActivities.length} of {activityCatalog.length} catalog activities
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActivities.map((act) => {
          const supplier = suppliers.find((s) => s.id === act.supplierId);
          return (
            <div
              key={act.id}
              onClick={() => handleOpenKeywordModal(act)}
              className="bg-white rounded-3xl border-2 border-slate-200 hover:border-amber-400 p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group cursor-pointer relative"
              title="Click activity to set or edit its Shift-typing keyword shortcut"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    {act.category ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {act.category}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-400 border border-slate-200/60">
                        General
                      </span>
                    )}
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-800 transition-colors">
                      {act.name}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEditModal(act)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit full activity details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(act.id, act.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete activity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Duration Badge & Details */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-extrabold flex items-center gap-1 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Length: {formatDurationDisplay(act.durationHours)}</span>
                  </span>

                  {hasFullFinancialView && Boolean(act.costEstimate) && (
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-slate-500" />
                      <span>Est. ${act.costEstimate}</span>
                    </span>
                  )}
                </div>

                {/* Prominent Linked Keyword Badge */}
                <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="text-[11px] font-bold text-amber-950">Linked Keyword:</span>
                    {act.keyword ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 font-mono font-black text-xs border border-amber-300 flex items-center gap-1">
                        <span>Shift + &quot;{act.keyword}&quot;</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-700 italic font-semibold">
                        (None &ndash; click to link)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-amber-800 font-extrabold underline group-hover:text-amber-950">
                    {act.keyword ? 'Edit Keyword' : '+ Set Keyword'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {act.description}
                </p>

                {act.location && (
                  <div className="text-[11px] text-slate-400 font-medium">
                    📍 {act.location}
                  </div>
                )}

                {supplier && (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
                    <span className="truncate">Supplier: <strong>{supplier.name}</strong></span>
                    {supplier.isLoneProvider && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-800 shrink-0">
                        Lone Provider
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Quick Action Cue */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-mono flex items-center gap-1">
                  <Keyboard className="w-3.5 h-3.5 text-amber-600" />
                  <span>{act.keyword ? `Hold Shift & type "${act.keyword}"` : 'Click to link keyword'}</span>
                </span>
                <span className="font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  <span>Auto-Insert Ready</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredActivities.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No matching activities found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or add a new activity to populate your library.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-sm"
          >
            Add New Activity
          </button>
        </div>
      )}

      {/* Add / Edit Activity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingItem ? 'Edit Activity Details' : 'Add New Activity to Catalog'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Defines the name, full description, and scheduled length of time.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Activity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masada Fortress & Dead Sea Sunrise Expedition"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Full Narrative Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Comprehensive client itinerary narrative and operational description..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl leading-relaxed focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Length of Time (Hours) *</label>
                  <select
                    value={formDurationHours}
                    onChange={(e) => setFormDurationHours(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-xs bg-amber-50/70 border border-amber-300 rounded-xl font-bold text-amber-950 focus:bg-white outline-none"
                  >
                    <option value={0.5}>30 Minutes (0.5 hrs)</option>
                    <option value={1.0}>1.0 Hour</option>
                    <option value={1.5}>1.5 Hours (1h 30m)</option>
                    <option value={2.0}>2.0 Hours</option>
                    <option value={2.5}>2.5 Hours (2h 30m)</option>
                    <option value={3.0}>3.0 Hours</option>
                    <option value={3.5}>3.5 Hours (3h 30m)</option>
                    <option value={4.0}>4.0 Hours (Half Day)</option>
                    <option value={5.0}>5.0 Hours</option>
                    <option value={6.0}>6.0 Hours</option>
                    <option value={7.0}>7.0 Hours</option>
                    <option value={8.0}>8.0 Hours (Full Day)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Category / Type (Optional)</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white outline-none"
                  >
                    <option value="">-- None / Unclassified --</option>
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Dining">Dining</option>
                    <option value="Transport">Transport</option>
                    <option value="Culture">Culture</option>
                    <option value="Leisure">Leisure</option>
                    <option value="Adventure">Adventure</option>
                  </select>
                </div>
              </div>

              <div className={hasFullFinancialView ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Jerusalem, Old City"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>

                {hasFullFinancialView && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase">Cost Estimate (USD)</label>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      placeholder="e.g. 350"
                      value={formCostEstimate}
                      onChange={(e) => setFormCostEstimate(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none font-bold"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Preferred Direct Supplier (Optional)</label>
                <select
                  value={formSupplierId}
                  onChange={(e) => setFormSupplierId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white outline-none"
                >
                  <option value="">-- No Specific Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isLoneProvider ? '★ (LONE PROVIDER)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Linked Keyword Shortcut (Optional)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-700">
                    Shift +
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. masada, deadsea, wine"
                    value={formKeyword}
                    onChange={(e) => setFormKeyword(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full pl-16 pr-3 py-2 text-xs font-mono font-bold bg-amber-50/50 border border-amber-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-900"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Type while holding Shift in any itinerary to auto-insert this activity.
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> In the itinerary builder, holding <strong>Shift</strong> and typing the keyword &quot;{formKeyword || 'keyword'}&quot; will automatically insert this exact title, narrative description, and calculated {formDurationHours} hours duration with booking status prompt!
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED CLICK-ON-ACTIVITY KEYWORD LINKING MODAL */}
      {keywordModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Link Keyword Shortcut
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Fast auto-insert into any itinerary by holding Shift while typing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setKeywordModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-lg"
              >
                &times;
              </button>
            </div>

            {/* Selected Activity Preview */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                {keywordModalItem.category ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                    {keywordModalItem.category}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    Activity
                  </span>
                )}
                <span className="text-xs font-bold text-slate-700 font-mono">
                  {keywordModalItem.durationHours} hrs duration
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">
                {keywordModalItem.name}
              </h4>
              <p className="text-[11px] text-slate-600 line-clamp-2">
                {keywordModalItem.description}
              </p>
            </div>

            {/* Keyword Form */}
            <form onSubmit={handleSaveKeyword} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wide block mb-1">
                  Assign Keyword *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-amber-700 font-bold text-xs pointer-events-none">
                    <span>Shift +</span>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. masada, deadsea, wine, kotel"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full pl-16 pr-3 py-2.5 text-sm font-mono font-bold bg-amber-50/60 border-2 border-amber-400 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/30 outline-none text-slate-950 placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  In any itinerary builder view, hold <strong className="text-slate-800">Shift</strong> and type <span className="font-mono font-bold text-amber-900 bg-amber-100 px-1 rounded">&quot;{keywordInput || 'keyword'}&quot;</span> to automatically add this activity!
                </p>
              </div>

              {/* Quick suggestions */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                  Quick keyword suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    keywordModalItem.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
                    ...(keywordModalItem.category ? [keywordModalItem.category.toLowerCase().replace(/[^a-z0-9]/g, '')] : []),
                    ...(keywordModalItem.location ? [keywordModalItem.location.split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]/g, '')] : []),
                  ]
                    .filter(Boolean)
                    .map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setKeywordInput(sug)}
                        className="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-950 border border-slate-200 transition-colors"
                      >
                        +{sug}
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {keywordModalItem.keyword ? (
                  <button
                    type="button"
                    onClick={() => {
                      setKeywordInput('');
                      updateActivityCatalogItem({ ...keywordModalItem, keyword: undefined });
                      showToast(`Removed keyword from "${keywordModalItem.name}"`);
                      setKeywordModalItem(null);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                  >
                    Remove Keyword
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const item = keywordModalItem;
                      setKeywordModalItem(null);
                      handleOpenEditModal(item);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Full Edit Details &rarr;
                  </button>
                )}

                <div className="flex items-center space-x-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setKeywordModalItem(null)}
                    className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Save Keyword
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
