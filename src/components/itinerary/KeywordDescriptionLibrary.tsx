import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  Sparkles,
  BookOpen,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  MapPin,
  Building,
  DollarSign,
  Copy,
  CheckCircle2,
  Filter,
  ArrowRight,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SavedDescriptionSnippet } from '../../types';

export const KeywordDescriptionLibrary: React.FC = () => {
  const {
    savedDescriptions,
    addSavedDescription,
    updateSavedDescription,
    deleteSavedDescription,
    suppliers,
    setActiveView,
    formatMoney,
  } = useApp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal / Form state for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formKeywordInput, setFormKeywordInput] = useState('');
  const [formKeywords, setFormKeywords] = useState<string[]>([]);
  const [formCategory, setFormCategory] = useState<SavedDescriptionSnippet['category']>('Sightseeing');
  const [formLocation, setFormLocation] = useState('');
  const [formDuration, setFormDuration] = useState<number>(3);
  const [formCost, setFormCost] = useState<number>(350);
  const [formDescription, setFormDescription] = useState('');
  const [formSupplierId, setFormSupplierId] = useState('');

  // Sandbox / Live Testing State
  const [sandboxInput, setSandboxInput] = useState('masada helicopter');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Extract all unique keywords across all snippets
  const allUniqueKeywords = useMemo(() => {
    const set = new Set<string>();
    savedDescriptions.forEach((s) => {
      s.keywords.forEach((k) => set.add(k.toLowerCase().trim()));
    });
    return Array.from(set).sort();
  }, [savedDescriptions]);

  // Filtered snippets
  const filteredSnippets = useMemo(() => {
    return savedDescriptions.filter((s) => {
      if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
      if (selectedTag !== 'ALL' && !s.keywords.some((k) => k.toLowerCase() === selectedTag.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchDesc = s.description.toLowerCase().includes(q);
        const matchLoc = s.location.toLowerCase().includes(q);
        const matchKeyword = s.keywords.some((k) => k.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchLoc && !matchKeyword) return false;
      }
      return true;
    });
  }, [savedDescriptions, selectedCategory, selectedTag, searchQuery]);

  // Sandbox matched snippet
  const sandboxResult = useMemo(() => {
    if (!sandboxInput.trim()) return null;
    const tokens = sandboxInput.toLowerCase().trim().split(/\s+/);
    return savedDescriptions.find((s) => {
      return tokens.some((token) =>
        s.keywords.some((k) => k.toLowerCase().includes(token)) ||
        s.title.toLowerCase().includes(token) ||
        s.description.toLowerCase().includes(token)
      );
    });
  }, [sandboxInput, savedDescriptions]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingSnippetId(null);
    setFormTitle('');
    setFormKeywords(['vip experience', 'heritage']);
    setFormKeywordInput('');
    setFormCategory('Sightseeing');
    setFormLocation('Jerusalem, Israel');
    setFormDuration(3);
    setFormCost(400);
    setFormDescription('');
    setFormSupplierId('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (snippet: SavedDescriptionSnippet) => {
    setEditingSnippetId(snippet.id);
    setFormTitle(snippet.title);
    setFormKeywords([...snippet.keywords]);
    setFormKeywordInput('');
    setFormCategory(snippet.category);
    setFormLocation(snippet.location);
    setFormDuration(snippet.defaultDurationHours);
    setFormCost(snippet.costEstimate || 0);
    setFormDescription(snippet.description);
    setFormSupplierId(snippet.recommendedSupplierId || '');
    setIsModalOpen(true);
  };

  // Add keyword chip to form
  const handleAddKeywordChip = () => {
    const trimmed = formKeywordInput.trim().toLowerCase();
    if (trimmed && !formKeywords.includes(trimmed)) {
      setFormKeywords([...formKeywords, trimmed]);
      setFormKeywordInput('');
    }
  };

  const handleRemoveKeywordChip = (keywordToRemove: string) => {
    setFormKeywords(formKeywords.filter((k) => k !== keywordToRemove));
  };

  // Save form
  const handleSaveSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) return;

    // If there is any leftover text in keyword input, add it
    let finalKeywords = [...formKeywords];
    if (formKeywordInput.trim()) {
      const extra = formKeywordInput.trim().toLowerCase();
      if (!finalKeywords.includes(extra)) finalKeywords.push(extra);
    }
    if (finalKeywords.length === 0) {
      finalKeywords = [formTitle.trim().toLowerCase()];
    }

    if (editingSnippetId) {
      const updated: SavedDescriptionSnippet = {
        id: editingSnippetId,
        title: formTitle.trim(),
        keywords: finalKeywords,
        category: formCategory,
        location: formLocation.trim() || 'Israel',
        defaultDurationHours: Number(formDuration) || 2,
        costEstimate: Number(formCost) || 0,
        description: formDescription.trim(),
        recommendedSupplierId: formSupplierId || undefined,
      };
      updateSavedDescription(updated);
      showToast(`Updated "${updated.title}" with ${finalKeywords.length} keywords`);
    } else {
      const created: SavedDescriptionSnippet = {
        id: `desc-${Date.now()}`,
        title: formTitle.trim(),
        keywords: finalKeywords,
        category: formCategory,
        location: formLocation.trim() || 'Israel',
        defaultDurationHours: Number(formDuration) || 2,
        costEstimate: Number(formCost) || 0,
        description: formDescription.trim(),
        recommendedSupplierId: formSupplierId || undefined,
      };
      addSavedDescription(created);
      showToast(`Created new snippet "${created.title}" with keywords: [${finalKeywords.join(', ')}]`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    deleteSavedDescription(id);
    showToast(`Removed "${title}" from keyword library`);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Copied description to clipboard!');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 flex items-center gap-1">
              <Tag className="w-3 h-3 text-amber-700" />
              <span>Itinerary Library</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">Keywords &amp; Saved Descriptions Manager</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Keywords &amp; Saved Descriptions Library
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Define triggers and keywords to automatically generate verified luxury descriptions, timings, and partner supplier assignments in your itineraries.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveView('itineraries')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Go to Itineraries</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add New Keywords &amp; Description</span>
          </button>
        </div>
      </div>

      {/* STAT SUMMARY BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Saved Descriptions</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{savedDescriptions.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Curated itinerary experiences</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Keywords</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{allUniqueKeywords.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Search &amp; trigger tags mapped</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categories Covered</div>
          <div className="text-2xl font-black text-slate-900 mt-1">6</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Sightseeing, Dining, Transport, etc.</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Partner Suppliers</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{suppliers.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Including verified lone providers</div>
        </div>
      </div>

      {/* KEYWORD GENERATOR LIVE TESTING SANDBOX */}
      <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-100 rounded-3xl border border-amber-300/60 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-amber-500 text-slate-950 rounded-xl">
              <Sparkles className="w-4 h-4 fill-slate-950" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Interactive Keyword Matching Simulator
              </h3>
              <p className="text-xs text-slate-600">
                Type any keyword or phrase below to test how TourOps 360 expands it into full luxury itinerary copy:
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
            Live Preview
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={sandboxInput}
              onChange={(e) => setSandboxInput(e.target.value)}
              placeholder="Test typing a keyword: 'dead sea', 'helicopter', 'yacht', 'masada', 'wine'..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-amber-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['masada helicopter', 'old city', 'yacht capri', 'wine tasting', 'dead sea'].map((sample) => (
              <button
                key={sample}
                onClick={() => setSandboxInput(sample)}
                className="px-2.5 py-1.5 bg-white hover:bg-amber-100 border border-slate-200 hover:border-amber-300 rounded-lg text-[10px] font-bold text-slate-700 transition-colors shrink-0"
              >
                &ldquo;{sample}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {sandboxResult ? (
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-slate-900">{sandboxResult.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900">
                  {sandboxResult.category}
                </span>
                <span className="text-xs text-slate-400">&bull; {sandboxResult.location}</span>
                <span className="text-xs text-slate-500 font-semibold">&bull; {sandboxResult.defaultDurationHours}h</span>
              </div>
              <button
                onClick={() => handleCopyText(sandboxResult.description, 'sandbox')}
                className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 flex items-center gap-1"
              >
                {copiedId === 'sandbox' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'sandbox' ? 'Copied' : 'Copy Generated Text'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-sans italic bg-slate-50 p-3 rounded-xl border border-slate-100">
              &ldquo;{sandboxResult.description}&rdquo;
            </p>
            <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
              <span className="font-bold text-slate-700">Matched by Keywords:</span>
              <div className="flex flex-wrap gap-1">
                {sandboxResult.keywords.map((k) => (
                  <span key={k} className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold">
                    #{k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 p-3.5 rounded-xl border border-dashed border-amber-200 text-xs text-slate-500 text-center">
            No description matched &ldquo;{sandboxInput}&rdquo;. Try another keyword or add a new snippet below with this keyword!
          </div>
        )}
      </div>

      {/* KEYWORD TAGS CLOUD BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Browse by Registered Keywords ({allUniqueKeywords.length})
            </h3>
          </div>
          {selectedTag !== 'ALL' && (
            <button
              onClick={() => setSelectedTag('ALL')}
              className="text-xs text-amber-700 font-bold hover:underline"
            >
              Clear Tag Filter
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
          <button
            onClick={() => setSelectedTag('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              selectedTag === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Keywords ({savedDescriptions.length})
          </button>
          {allUniqueKeywords.map((tag) => {
            const count = savedDescriptions.filter((s) =>
              s.keywords.some((k) => k.toLowerCase() === tag.toLowerCase())
            ).length;
            const isSelected = selectedTag.toLowerCase() === tag.toLowerCase();

            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? 'ALL' : tag)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold ring-2 ring-amber-400 shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-200'
                }`}
              >
                <span>#{tag}</span>
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search descriptions, locations, titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="Sightseeing">Sightseeing</option>
            <option value="Dining">Dining</option>
            <option value="Transport">Transport</option>
            <option value="Culture">Culture</option>
            <option value="Leisure">Leisure</option>
            <option value="Adventure">Adventure</option>
          </select>
        </div>

        <div className="text-slate-400 text-xs font-medium">
          Showing {filteredSnippets.length} of {savedDescriptions.length} descriptions
        </div>
      </div>

      {/* SNIPPETS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSnippets.map((snippet) => {
          const supplier = suppliers.find((s) => s.id === snippet.recommendedSupplierId);

          return (
            <div
              key={snippet.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header title & category */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {snippet.category}
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 mt-1.5 line-clamp-2 leading-snug">
                      {snippet.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(snippet)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Edit keywords and description"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(snippet.id, snippet.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete description"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Location, Duration & Cost info */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{snippet.location}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{snippet.defaultDurationHours}h default</span>
                  </span>
                  {snippet.costEstimate ? (
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <span>Est. ${snippet.costEstimate}</span>
                    </span>
                  ) : null}
                </div>

                {/* Description Body */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-4 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                  {snippet.description}
                </p>

                {/* Recommended Supplier */}
                {supplier && (
                  <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[11px] flex items-center justify-between">
                    <span className="text-amber-900 font-medium flex items-center gap-1 truncate">
                      <Building className="w-3 h-3 text-amber-700 shrink-0" />
                      <span className="truncate">{supplier.name}</span>
                    </span>
                    {supplier.isLoneProvider && (
                      <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black bg-amber-500 text-slate-950 shrink-0">
                        LONE
                      </span>
                    )}
                  </div>
                )}

                {/* KEYWORDS TAG CHIPS */}
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                    Trigger Keywords ({snippet.keywords.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {snippet.keywords.map((k) => (
                      <span
                        key={k}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200/60"
                      >
                        #{k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSandboxInput(snippet.keywords[0] || snippet.title)}
                  className="text-xs text-amber-800 font-bold hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Test in Sandbox</span>
                </button>

                <button
                  onClick={() => handleCopyText(snippet.description, snippet.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  {copiedId === snippet.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT KEYWORDS & DESCRIPTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900">
                  {editingSnippetId ? 'Edit Entry' : 'New Keyword Entry'}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {editingSnippetId ? 'Edit Keywords & Description' : 'Add New Keywords & Saved Description'}
                </h3>
                <p className="text-xs text-slate-500">
                  Add keywords so operators can trigger this ready-to-use luxury copy anytime during itinerary planning.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSnippet} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Experience Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subterranean Western Wall Tunnels & Ancient Aqueduct"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              {/* KEYWORD TAG CHIPS BUILDER */}
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950 uppercase flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-700" />
                    <span>Keywords (Tags that trigger this description)</span>
                  </label>
                  <span className="text-[10px] text-amber-800 font-semibold">
                    Press Enter or click &ldquo;Add&rdquo;
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type keyword: e.g. 'masada', 'helicopter', 'wine'..."
                    value={formKeywordInput}
                    onChange={(e) => setFormKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeywordChip();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-xl font-bold text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeywordChip}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-colors"
                  >
                    Add Keyword
                  </button>
                </div>

                {/* Display Current Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formKeywords.map((k) => (
                    <span
                      key={k}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white text-slate-900 border border-amber-300 shadow-2xs flex items-center gap-1"
                    >
                      <span>#{k}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeywordChip(k)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {formKeywords.length === 0 && (
                    <span className="text-xs text-amber-800 italic">No keywords added yet. Add at least one keyword!</span>
                  )}
                </div>

                {/* Quick Suggestion Chips */}
                <div className="pt-2 border-t border-amber-200/60">
                  <span className="text-[10px] text-amber-900 font-bold mr-1.5">Popular Tags:</span>
                  <div className="inline-flex flex-wrap gap-1">
                    {['old city', 'masada', 'dead sea', 'culinary', 'wine', 'yacht', 'desert jeep', 'galilee', 'vip arrival'].map((sug) => (
                      <button
                        type="button"
                        key={sug}
                        onClick={() => {
                          if (!formKeywords.includes(sug)) {
                            setFormKeywords([...formKeywords, sug]);
                          }
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100/70 hover:bg-amber-200 text-amber-900 font-semibold"
                      >
                        +{sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  >
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Dining">Dining</option>
                    <option value="Transport">Transport</option>
                    <option value="Culture">Culture</option>
                    <option value="Leisure">Leisure</option>
                    <option value="Adventure">Adventure</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Location</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Jerusalem, Israel"
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Default Duration</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Estimated Cost ($ USD)</label>
                  <input
                    type="number"
                    min={0}
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Recommended Partner Supplier</label>
                  <select
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  >
                    <option value="">-- None / Self-Managed --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.isLoneProvider ? '★ (LONE PROVIDER)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Luxury Itinerary Description (Rich Text)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Comprehensive description highlighting private curator access, VIP perks, attire guidelines, historical depth..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {editingSnippetId ? 'Save Changes' : 'Create Keyword Snippet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
