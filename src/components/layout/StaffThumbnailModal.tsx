import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Trash2,
  Sparkles,
  Camera,
  RefreshCw,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StaffMember } from '../../types';

interface StaffThumbnailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMember?: StaffMember | null;
}

// Curated avatar thumbnails for staff member quick selection
const PRESET_STAFF_THUMBNAILS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
];

export const StaffThumbnailModal: React.FC<StaffThumbnailModalProps> = ({
  isOpen,
  onClose,
  staffMember,
}) => {
  const { currentUser, updateStaffThumbnail } = useApp();

  const targetStaff = staffMember || currentUser;

  const [inputUrl, setInputUrl] = useState(targetStaff?.avatar || '');
  const [previewError, setPreviewError] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep state synced with target staff
  React.useEffect(() => {
    if (targetStaff) {
      setInputUrl(targetStaff.avatar || '');
      setPreviewError(false);
    }
  }, [targetStaff?.id, targetStaff?.avatar]);

  if (!isOpen || !targetStaff) return null;

  const getInitials = (name: string): string => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setInputUrl(result);
      setPreviewError(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateStaffThumbnail(targetStaff.id, inputUrl.trim());
    if (result.success) {
      setSuccessToast(`Profile thumbnail for ${targetStaff.name} updated!`);
      setTimeout(() => {
        setSuccessToast(null);
        onClose();
      }, 1200);
    }
  };

  const handleClear = () => {
    setInputUrl('');
    updateStaffThumbnail(targetStaff.id, '');
    setSuccessToast(`Profile thumbnail cleared. Default initials displayed.`);
    setTimeout(() => {
      setSuccessToast(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-black">
              <Camera className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900">
                  Staff Profile
                </span>
                <span className="text-xs text-slate-400 font-medium">Avatar &amp; Photo</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">
                Upload Profile Thumbnail
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Upload or select a photo thumbnail for <strong>{targetStaff.name}</strong> ({targetStaff.role}). This thumbnail is used across operator headers, operations task rosters, email reminders, and concierge dossier views.
        </p>

        {/* Live Preview Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 min-w-0">
            {inputUrl && !previewError ? (
              <img
                src={inputUrl}
                alt={targetStaff.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-500 shadow-md shrink-0"
                onError={() => setPreviewError(true)}
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shrink-0 uppercase shadow-md ring-2 ring-slate-200">
                {getInitials(targetStaff.name)}
              </div>
            )}

            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Preview Profile Display</div>
              <div className="font-extrabold text-sm text-slate-900 truncate">
                {targetStaff.name}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {targetStaff.role} &bull; {targetStaff.department}
              </div>
              <div className="text-[11px] font-mono text-slate-400 truncate">
                {targetStaff.email}
              </div>
            </div>
          </div>

          {inputUrl && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Photo</span>
            </button>
          )}
        </div>

        {successToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* File Upload Button */}
          <div>
            <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
              Upload Thumbnail Image (From Your Computer)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-amber-950 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-amber-600" />
              <span>Click to Upload Photo / Thumbnail (PNG, JPG, WebP)</span>
            </button>
          </div>

          {/* Or Image URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase">
                Or Paste Image Web URL
              </label>
              {inputUrl && (
                <button
                  type="button"
                  onClick={() => setPreviewError(false)}
                  className="text-[10px] text-amber-700 hover:underline flex items-center gap-0.5"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh Preview
                </button>
              )}
            </div>
            <input
              type="url"
              placeholder="https://images.unsplash.com/... or image link"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setPreviewError(false);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
            />
          </div>

          {/* Quick Preset Photos */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Or Choose from Curated Professional Portraits:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setInputUrl('');
                  setPreviewError(false);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  !inputUrl
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                Initials Only
              </button>
              {PRESET_STAFF_THUMBNAILS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputUrl(url);
                    setPreviewError(false);
                  }}
                  className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    inputUrl === url
                      ? 'border-amber-500 ring-2 ring-amber-300 scale-105'
                      : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Option ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-amber-400" />
              <span>Use This Thumbnail</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
