import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Shield,
  Key,
  User,
  LogOut,
  ChevronDown,
  Lock,
  Plane,
  ShieldAlert,
  Coins,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StaffLoginModal } from './StaffLoginModal';
import { StaffCredentialsModal } from '../tasks/StaffCredentialsModal';
import { ChangeOwnPasswordModal } from './ChangeOwnPasswordModal';
import { SecurityEmailNotificationBanner } from './SecurityEmailNotificationBanner';
import { FxRatesModal } from '../finance/FxRatesModal';
import { CompanyLogoModal } from './CompanyLogoModal';
import { StaffThumbnailModal } from './StaffThumbnailModal';
import { TeamAccessModal } from './TeamAccessModal';
import { Image as ImageIcon, Camera, Users, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onNewItineraryClick?: () => void;
  onNewTaskClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewItineraryClick, onNewTaskClick }) => {
  const {
    conflicts,
    setActiveView,
    exchangeRates,
    tasks,
    currentUser,
    isSystemAdmin,
    staff,
    switchUser,
    logoutUser,
    companyLogo,
    syncStatus,
    isSyncing,
    triggerManualSync,
    approvedMembers,
    syncError,
    dismissSyncError,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isTeamAccessModalOpen, setIsTeamAccessModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isFxModalOpen, setIsFxModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false);
  const [passwordModalTab, setPasswordModalTab] = useState<'PASSWORD' | 'PASSPORT'>('PASSWORD');

  const criticalConflicts = conflicts.filter((c) => c.severity === 'CRITICAL');
  const pendingReminders = tasks.filter(
    (t) => t.isReminder && t.status !== 'Completed'
  ).length;

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center space-x-3.5 flex-1 max-w-xl">
          {/* Company Logo at the Top of the App Screen */}
          <div className="flex items-center space-x-2 shrink-0">
            {companyLogo ? (
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(true)}
                className="h-10 max-w-[150px] px-2 py-1 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 flex items-center justify-center transition-all cursor-pointer group shadow-2xs"
                title="Company Logo • Click to change or update logo"
              >
                <img
                  src={companyLogo}
                  alt="Company Logo"
                  className="max-h-8 max-w-[130px] object-contain group-hover:scale-105 transition-transform"
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(true)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/70 hover:bg-amber-100 text-amber-950 text-xs font-bold transition-all cursor-pointer shadow-2xs group"
                title="Click to insert your company logo at the top of the app screen"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-extrabold text-[11px]">+ Company Logo</span>
                <span className="sm:hidden text-[11px] font-extrabold">+ Logo</span>
              </button>
            )}
          </div>

          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search itineraries, clients, vouchers, hotels, suppliers..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 placeholder-slate-400 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3.5">
          {/* Real-time FX Rates Ticker Button (Clickable for any staff to update at any time) */}
          <button
            type="button"
            onClick={() => setIsFxModalOpen(true)}
            className="hidden xl:flex items-center space-x-2 text-xs bg-slate-100/90 hover:bg-amber-50 hover:border-amber-300 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 transition-colors group cursor-pointer shadow-2xs"
            title="Click to update foreign exchange rates"
          >
            <span className="font-semibold text-slate-500 group-hover:text-amber-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              FX:
            </span>
            <span>1 USD = €{exchangeRates.EUR.rateAgainstUSD}</span>
            <span className="text-slate-300">|</span>
            <span>£{exchangeRates.GBP.rateAgainstUSD}</span>
            <span className="text-slate-300">|</span>
            <span>₪{exchangeRates.ILS.rateAgainstUSD}</span>
            <span className="ml-1 text-[10px] bg-white border border-slate-200 group-hover:border-amber-400 group-hover:bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-bold">
              Update
            </span>
          </button>

          {/* Compact FX button on smaller screens */}
          <button
            type="button"
            onClick={() => setIsFxModalOpen(true)}
            className="xl:hidden p-2 rounded-lg text-slate-600 hover:text-amber-800 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
            title="Update FX rates"
          >
            <Coins className="w-4 h-4 text-amber-500" />
          </button>

          {/* Conflict Detection Indicator Button */}
          {conflicts.length > 0 ? (
            <button
              onClick={() => setActiveView('conflicts')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                criticalConflicts.length > 0
                  ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 animate-pulse'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>
                {criticalConflicts.length > 0
                  ? `${criticalConflicts.length} Clash Detected!`
                  : `${conflicts.length} Conflicts`}
              </span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">No Clashes</span>
            </div>
          )}

          {/* Team Access Governance Button for Admins */}
          {isSystemAdmin && (
            <button
              type="button"
              onClick={() => setIsTeamAccessModalOpen(true)}
              title="Google Team Member Approvals (Cloud Firestore)"
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-slate-900 text-white hover:bg-slate-800 shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Team Approvals</span>
              {approvedMembers.filter((m) => m.status === 'pending').length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] rounded-full font-black animate-pulse">
                  {approvedMembers.filter((m) => m.status === 'pending').length}
                </span>
              )}
            </button>
          )}

          {/* Persistent Data Saved & Synced Status Badge - Only shows 'All Changes Saved' when confirmed by Firestore */}
          <button
            type="button"
            onClick={triggerManualSync}
            title={`Cloud Database Status: ${
              syncStatus === 'synced'
                ? 'All changes confirmed and saved to Cloud Firestore.'
                : syncStatus === 'saving' || isSyncing
                ? 'Saving changes to Cloud Firestore...'
                : syncStatus === 'error'
                ? `Sync error: ${syncError || 'Failed to save to Cloud Firestore'}. Click to retry.`
                : 'Offline cache active.'
            }`}
            className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              syncStatus === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                : syncStatus === 'saving' || isSyncing
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
          >
            {syncStatus === 'saving' || isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span className="text-[11px] font-semibold text-amber-700">Saving...</span>
              </>
            ) : syncStatus === 'error' ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span className="text-[11px] font-bold text-rose-700">Save Error (Retry)</span>
              </>
            ) : syncStatus === 'offline' ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] text-slate-600">Saved Locally</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-semibold text-emerald-800">All Changes Saved</span>
              </>
            )}
          </button>

          {/* Staff Reminders icon */}
          <button
            onClick={() => setActiveView('tasks')}
            title="Staff reminders"
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {pendingReminders > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {/* Current User & Administrator Profile Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2.5 p-1.5 pr-2.5 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200 bg-slate-50/60 cursor-pointer"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-xl object-cover shrink-0 ring-1 ring-amber-400"
                />
              ) : (
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                  {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'SU'}
                </div>
              )}

              <div className="text-left hidden md:block">
                <div className="text-xs font-extrabold text-slate-900 leading-tight flex items-center gap-1">
                  <span>{currentUser?.name || 'Staff User'}</span>
                </div>
                <div className="text-[10px] text-amber-800 font-bold leading-tight flex items-center gap-0.5">
                  {currentUser?.isAdmin ? (
                    <span className="flex items-center gap-0.5 text-amber-700">
                      <Shield className="w-2.5 h-2.5 fill-amber-600" />
                      <span>System Admin</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">Staff User</span>
                  )}
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile & Admin Governance Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200 py-2.5 z-50 animate-scale-in">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Active User Session
                    </span>
                    {currentUser?.isAdmin && (
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                        Administrator
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                    {currentUser?.name}
                  </h4>
                  <div className="text-xs text-slate-500 truncate">
                    {currentUser?.role} &bull; {currentUser?.department}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                    {currentUser?.email}
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  {/* Password Reset Warning if forced */}
                  {currentUser?.mustChangePassword && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setPasswordModalTab('PASSWORD');
                        setIsChangePasswordModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-xs font-black text-amber-950 bg-amber-100 border border-amber-300 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left animate-pulse"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Update Password (Required)</span>
                    </button>
                  )}

                  {/* Insert / Change Company Logo */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsLogoModalOpen(true);
                    }}
                    className="w-full px-3 py-2 text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Insert / Change Company Logo</span>
                  </button>

                  {/* Upload Profile Thumbnail */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsThumbnailModalOpen(true);
                    }}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Upload Profile Photo / Thumbnail</span>
                  </button>

                  {/* Change My Own Password */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setPasswordModalTab('PASSWORD');
                      setIsChangePasswordModalOpen(true);
                    }}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Change My Password</span>
                  </button>

                  {/* My Travel Passport Details */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setPasswordModalTab('PASSPORT');
                      setIsChangePasswordModalOpen(true);
                    }}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left"
                  >
                    <Plane className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>My Travel Passport Details</span>
                  </button>

                  {/* Update FX Exchange Rates (Accessible to Any Staff) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsFxModalOpen(true);
                    }}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Update FX Exchange Rates</span>
                  </button>

                  {/* System Administrator Team Approvals Shortcut */}
                  {isSystemAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsTeamAccessModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-between transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Google Team Approvals</span>
                      </div>
                      {approvedMembers.filter((m) => m.status === 'pending').length > 0 && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] rounded-full font-black">
                          {approvedMembers.filter((m) => m.status === 'pending').length}
                        </span>
                      )}
                    </button>
                  )}

                  {/* System Administrator Credentials Management Shortcut */}
                  {isSystemAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsCredentialsModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Staff Logins &amp; Passwords</span>
                    </button>
                  )}

                  {/* Switch Session / Login */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsLoginModalOpen(true);
                    }}
                    className="w-full px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Sign In as Another Staff Member</span>
                  </button>

                  {/* Log Out (Lock Console) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logoutUser();
                    }}
                    className="w-full px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Log Out (Lock Console)</span>
                  </button>
                </div>

                {/* Quick Role Simulator */}
                <div className="px-3 pt-2 pb-1 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Quick Role Simulator:
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {staff.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          switchUser(s.id);
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 text-[11px] rounded-xl flex items-center justify-between transition-colors cursor-pointer text-left ${
                          currentUser?.id === s.id
                            ? 'bg-slate-900 text-white font-extrabold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{s.name}</span>
                        {s.isAdmin && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black uppercase">
                            Admin
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Menu */}
          <div className="flex items-center space-x-2">
            {onNewItineraryClick && (
              <button
                onClick={onNewItineraryClick}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>New Itinerary</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Firestore Sync Error & Warning Notification Bar */}
      {syncError && (
        <div className="bg-rose-50 border-b border-rose-300 px-6 py-2.5 flex items-center justify-between text-xs text-rose-950 sticky top-16 z-20 shadow-xs animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
            <span>
              <strong className="font-extrabold text-rose-900">Firestore Persistence Warning:</strong> {syncError}
            </span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={triggerManualSync}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] shadow-xs transition-colors cursor-pointer"
            >
              Retry Sync
            </button>
            <button
              type="button"
              onClick={dismissSyncError}
              className="px-2 py-1 text-rose-600 hover:text-rose-900 font-bold hover:bg-rose-100 rounded-lg text-sm transition-colors cursor-pointer"
              title="Dismiss warning"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Live Email Security Alert Toast/Banner */}
      <SecurityEmailNotificationBanner />

      {/* Staff Login Modal */}
      <StaffLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Google Team Access & Approvals Governance Modal */}
      <TeamAccessModal
        isOpen={isTeamAccessModalOpen}
        onClose={() => setIsTeamAccessModalOpen(false)}
      />

      {/* Staff Credentials Governance Modal */}
      <StaffCredentialsModal
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
      />

      {/* Staff Change Own Password & Passport Modal */}
      <ChangeOwnPasswordModal
        isOpen={isChangePasswordModalOpen || Boolean(currentUser?.mustChangePassword)}
        onClose={() => setIsChangePasswordModalOpen(false)}
        initialTab={passwordModalTab}
        forceMode={Boolean(currentUser?.mustChangePassword)}
      />

      {/* Staff FX Exchange Rates Management Modal */}
      <FxRatesModal
        isOpen={isFxModalOpen}
        onClose={() => setIsFxModalOpen(false)}
      />

      {/* Insert Company Logo Modal */}
      <CompanyLogoModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
      />

      {/* Staff Upload Profile Thumbnail Modal */}
      <StaffThumbnailModal
        isOpen={isThumbnailModalOpen}
        onClose={() => setIsThumbnailModalOpen(false)}
        staffMember={currentUser}
      />
    </>
  );
};

