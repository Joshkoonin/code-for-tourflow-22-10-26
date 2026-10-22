import React, { useState } from 'react';
import {
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Plane,
  FileText,
  Calendar,
  Globe,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ChangeOwnPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'PASSWORD' | 'PASSPORT';
  forceMode?: boolean; // When true (mustChangePassword), user must set new password
}

export const ChangeOwnPasswordModal: React.FC<ChangeOwnPasswordModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'PASSWORD',
  forceMode = false,
}) => {
  const { currentUser, changeOwnPassword, updateOwnPassport } = useApp();

  const [activeTab, setActiveTab] = useState<'PASSWORD' | 'PASSPORT'>(initialTab);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Passport state
  const [passportNumber, setPassportNumber] = useState(currentUser?.passportNumber || '');
  const [passportCountry, setPassportCountry] = useState(currentUser?.passportCountry || 'Israel');
  const [passportExpiry, setPassportExpiry] = useState(currentUser?.passportExpiry || '2030-12-31');

  // Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateStrong = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowNewPassword(true);
    setShowConfirmPassword(true);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // If in forced mode, current password check is bypassed or optional
    if (!forceMode && !currentPassword) {
      setErrorMessage('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.trim().length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match. Please verify both fields.');
      return;
    }

    const res = changeOwnPassword(forceMode ? (currentUser?.password || '') : currentPassword, newPassword.trim());
    if (res.success) {
      setSuccessMessage(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleSavePassport = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = updateOwnPassport({
      passportNumber: passportNumber.trim(),
      passportCountry: passportCountry.trim(),
      passportExpiry: passportExpiry,
    });

    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        setSuccessMessage(null);
        if (!forceMode) onClose();
      }, 1500);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${
              forceMode ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-white'
            }`}>
              {activeTab === 'PASSWORD' ? (
                <Key className="w-5 h-5 text-amber-400" />
              ) : (
                <Plane className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {forceMode
                  ? 'Password Reset Required'
                  : activeTab === 'PASSWORD'
                  ? 'Change My Password'
                  : 'My Travel Passport Details'}
              </h3>
              <p className="text-xs text-slate-500">
                Staff Profile: <strong>{currentUser?.name}</strong> (@{currentUser?.username || currentUser?.email.split('@')[0]})
              </p>
            </div>
          </div>
          {!forceMode && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Forced Mode Banner */}
        {forceMode && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 text-xs font-semibold flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="font-extrabold text-amber-900">Admin-Initiated Reset</div>
              <div>System Administrator <strong>Joshua Koonin</strong> has required a password reset for your account. Please set a new password to proceed.</div>
            </div>
          </div>
        )}

        {/* Navigation Tabs (Password vs Passport) */}
        {!forceMode && (
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('PASSWORD');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'PASSWORD'
                  ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>Change Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('PASSPORT');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'PASSPORT'
                  ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plane className="w-3.5 h-3.5 text-blue-600" />
              <span>Travel Passport Details</span>
            </button>
          </div>
        )}

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: CHANGE PASSWORD */}
        {activeTab === 'PASSWORD' && (
          <form onSubmit={handleChangePassword} className="space-y-3.5">
            {!forceMode && (
              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase block mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter existing password..."
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-extrabold text-slate-700 uppercase">
                  New Password *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateStrong}
                  className="text-[10px] text-amber-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Generate Strong</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 6 characters..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase block mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              {!forceMode && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Save New Password</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: PASSPORT DETAILS */}
        {activeTab === 'PASSPORT' && (
          <form onSubmit={handleSavePassport} className="space-y-3.5">
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200">
              Your passport details are securely recorded for luxury tour operations dispatch, private aviation ramp passes, and cross-border itinerary compliance.
            </p>

            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase block mb-1">
                Passport Number *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. IL-9844211 or US-77402199"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase block mb-1">
                  Issuing Country *
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Israel, USA, UK"
                    value={passportCountry}
                    onChange={(e) => setPassportCountry(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 uppercase block mb-1">
                  Passport Expiry Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={passportExpiry}
                    onChange={(e) => setPassportExpiry(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Passport Details</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
