import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  BookOpen,
  Plus,
  Check,
  Tag,
  Clock,
  MapPin,
  Compass,
  X,
  FileText,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SavedDescriptionSnippet } from '../../types';

interface SavedDescriptionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (snippet: SavedDescriptionSnippet) => void;
  initialKeyword?: string;
}

export const SavedDescriptionGeneratorModal: React.FC<SavedDescriptionGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  initialKeyword = '',
}) => {
  const { savedDescriptions, addSavedDescription } = useApp();

  const [keywordInput, setKeywordInput] = useState<string>(initialKeyword);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // New snippet state
  const [newTitle, setNewTitle] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [newCategory, setNewCategory] = useState<SavedDescriptionSnippet['category']>('Sightseeing');
  const [newLocation, setNewLocation] = useState('');
  const [newDuration, setNewDuration] = useState(3);
  const [newDescription, setNewDescription] = useState('');
  const [newCost, setNewCost] = useState(500);

  // Quick keyword tags
  const popularKeywords = [
    'old city',
    'masada',
    'dead sea',
    'culinary',
    'wine',
    'yacht',
    'desert jeep',
    'vip arrival',
    'shabbat',
    'galilee',
    'helicopter',
    'jaffa',
  ];

  const filteredSnippets = useMemo(() => {
    let list = savedDescriptions;

    if (selectedCategory !== 'ALL') {
      list = list.filter((s) => s.category === selectedCategory);
    }

    if (keywordInput.trim()) {
      const q = keywordInput.toLowerCase().trim();
      list = list.filter((s) => {
        const matchKey = s.keywords.some((k) => k.toLowerCase().includes(q));
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchDesc = s.description.toLowerCase().includes(q);
        const matchLoc = s.location.toLowerCase().includes(q);
        return matchKey || matchTitle || matchDesc || matchLoc;
      });
    }

    return list;
  }, [savedDescriptions, keywordInput, selectedCategory]);

  const handleCreateNewSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const parsedKeywords = newKeywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const snippet: SavedDescriptionSnippet = {
      id: `desc-${Date.now()}`,
      title: newTitle.trim(),
      keywords: parsedKeywords.length > 0 ? parsedKeywords : [newTitle.toLowerCase().trim()],
      category: newCategory,
      location: newLocation.trim() || 'Israel',
      defaultDurationHours: Number(newDuration) || 3,
      description: newDescription.trim(),
      costEstimate: Number(newCost) || 0,
    };

    addSavedDescription(snippet);
    setIsCreatingNew(false);
    onSelect(snippet);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-slate-950" />
                <span>Keyword Description Generator</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">Itinerary Library &amp; Snippets</span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Generate Saved Itinerary Descriptions by Keyword
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Type or select a keyword to instantly pull verified luxury itinerary descriptions, timings, and experience highlights.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Keyword Search & Actions */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type keyword: e.g. 'old city', 'masada', 'wine', 'yacht', 'culinary'..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <button
                onClick={() => setIsCreatingNew(!isCreatingNew)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  isCreatingNew
                    ? 'bg-slate-200 text-slate-800'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
                }`}
              >
                {isCreatingNew ? (
                  <span>Cancel Custom</span>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Save New Description</span>
                  </>
                )}
              </button>
            </div>

            {/* Popular Keyword Pills */}
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
              <span className="text-[11px] font-bold uppercase text-slate-400 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-600" />
                <span>Keywords:</span>
              </span>
              {popularKeywords.map((kw) => (
                <button
                  key={kw}
                  onClick={() => setKeywordInput(kw)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    keywordInput.toLowerCase() === kw
                      ? 'bg-slate-900 text-amber-300 ring-2 ring-amber-400'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  #{kw}
                </button>
              ))}
              {keywordInput && (
                <button
                  onClick={() => setKeywordInput('')}
                  className="text-xs text-rose-600 font-bold hover:underline ml-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Create New Saved Description Form */}
          {isCreatingNew && (
            <form
              onSubmit={handleCreateNewSnippet}
              className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-900 uppercase">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Save New Itinerary Description Template</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Private Sunset Cruise & Beach Dinner"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="sunset, yacht, cruise, beach, romantic"
                    value={newKeywords}
                    onChange={(e) => setNewKeywords(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
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
                  <label className="text-[11px] font-bold text-slate-600 uppercase">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Herzliya Marina, Tel Aviv"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase">
                    Default Duration (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Curated Client-Facing Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed, evocative client description that highlights exclusive elements and flow..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg leading-relaxed"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Save &amp; Insert Snippet
                </button>
              </div>
            </form>
          )}

          {/* Results List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase pb-1 border-b border-slate-100">
              <span>Matching Saved Descriptions ({filteredSnippets.length})</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Click &ldquo;Use Description&rdquo; to auto-populate
              </span>
            </div>

            {filteredSnippets.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-xs font-bold text-slate-700">
                  No saved descriptions match &ldquo;{keywordInput}&rdquo;
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try typing a different keyword like <strong>#old-city</strong>, <strong>#masada</strong>, or click <strong>+ Save New Description</strong> to create one.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredSnippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    className="p-4 bg-white hover:bg-amber-50/20 border border-slate-200 hover:border-amber-300 rounded-2xl transition-all shadow-xs space-y-3 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                            {snippet.category}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {snippet.defaultDurationHours} Hours
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {snippet.location}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                          {snippet.title}
                        </h4>
                      </div>

                      <button
                        onClick={() => {
                          onSelect(snippet);
                          onClose();
                        }}
                        className="px-4 py-2 bg-slate-900 group-hover:bg-amber-500 group-hover:text-slate-950 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5 self-start"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Use This Description</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      {snippet.description}
                    </p>

                    {/* Keywords tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                      <span className="font-semibold text-slate-400">Trigger Keywords:</span>
                      {snippet.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-mono font-semibold"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>{savedDescriptions.length} Curated Tourism Descriptions in Library</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
