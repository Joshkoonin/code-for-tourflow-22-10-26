import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Mail,
  Key,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({ isOpen, onClose }) => {
  const {
    staff,
    currentUser,
    loginUser,
    switchUser,
    requestPasswordResetCode,
    verifyResetCodeAndSetPassword,
    changeOwnPassword,
  } = useApp();

  type AuthMode = 'LOGIN' | 'FORGOT_REQUEST' | 'FORGOT_VERIFY' | 'FORCED_RESET';
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');

  // Login form state
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [resetUsernameOrEmail, setResetUsernameOrEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [targetEmailDispatched, setTargetEmailDispatched] = useState<string | null>(null);

  // Forced reset state (when user logged in successfully but mustChangePassword === true)
  const [pendingForcedUser, setPendingForcedUser] = useState<any | null>(null);

  // Alerts
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!usernameOrEmail.trim()) {
      setErrorMessage('Please enter your login username or work email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    const result = await loginUser(usernameOrEmail.trim(), password);
    if (result.success && result.user) {
      if (result.user.mustChangePassword) {
        setPendingForcedUser(result.user);
        setAuthMode('FORCED_RESET');
        setErrorMessage(null);
        setSuccessMessage('Administrator Joshua Koonin requires a password update for your account.');
        return;
      }

      setSuccessMessage(result.message);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleQuickSwitch = (staffId: string) => {
    setErrorMessage(null);
    const member = staff.find((s) => s.id === staffId);
    if (!member) return;

    if (member.isApproved === false) {
      setErrorMessage(`Account for ${member.name} is pending approval by System Administrator Joshua Koonin.`);
      return;
    }

    if (member.mustChangePassword) {
      switchUser(staffId);
      setPendingForcedUser(member);
      setAuthMode('FORCED_RESET');
      setSuccessMessage(`Password update required for ${member.name}. Please set a new password.`);
      return;
    }

    switchUser(staffId);
    setSuccessMessage(`Switched session to ${member.name} (${member.role})`);
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1000);
  };

  // STEP 1: Request 6-digit Code to approved email
  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetUsernameOrEmail.trim()) {
      setErrorMessage('Please enter your username or registered work email.');
      return;
    }

    setIsSubmitting(true);
    const res = requestPasswordResetCode(resetUsernameOrEmail.trim());
    setIsSubmitting(false);

    if (res.success) {
      setTargetEmailDispatched(res.email || resetUsernameOrEmail);
      setSuccessMessage(res.message);
      setAuthMode('FORGOT_VERIFY');
    } else {
      setErrorMessage(res.message);
    }
  };

  // STEP 2: Verify Code and Set New Password
  const handleVerifyAndResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetCode.trim()) {
      setErrorMessage('Please enter the 6-digit security verification code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.trim().length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('New passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    const res = verifyResetCodeAndSetPassword(resetUsernameOrEmail.trim(), resetCode.trim(), newPassword.trim());
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        setSuccessMessage(null);
        setAuthMode('LOGIN');
        onClose();
      }, 1500);
    } else {
      setErrorMessage(res.message);
    }
  };

  // Forced Reset by Administrator Handler
  const handleForcedPasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword || newPassword.trim().length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    const res = changeOwnPassword(pendingForcedUser?.password || '', newPassword.trim());
    if (res.success) {
      setSuccessMessage('Password reset complete! Welcome back to TourOps 360.');
      setTimeout(() => {
        setSuccessMessage(null);
        setPendingForcedUser(null);
        setAuthMode('LOGIN');
        onClose();
      }, 1500);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleGenerateStrong = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    setConfirmNewPassword(generated);
    setShowNewPassword(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${
              authMode === 'LOGIN' ? 'bg-slate-900 text-white' : 'bg-amber-500 text-slate-950'
            }`}>
              {authMode === 'LOGIN' ? (
                <Lock className="w-5 h-5 text-amber-400" />
              ) : authMode === 'FORCED_RESET' ? (
                <ShieldCheck className="w-5 h-5 text-slate-950" />
              ) : (
                <Key className="w-5 h-5 text-slate-950" />
              )}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {authMode === 'LOGIN'
                  ? 'Staff Authentication & Session'
                  : authMode === 'FORGOT_REQUEST'
                  ? 'Forgot Password Verification'
                  : authMode === 'FORGOT_VERIFY'
                  ? 'Enter Security Code'
                  : 'Mandatory Password Reset'}
              </h3>
              <p className="text-xs text-slate-500">
                {authMode === 'LOGIN'
                  ? 'TourOps 360 Verified Staff Access'
                  : '6-digit email security code verification'}
              </p>
            </div>
          </div>
          {authMode !== 'FORCED_RESET' && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Current Active User Banner (in LOGIN mode) */}
        {authMode === 'LOGIN' && (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-xl object-cover shrink-0 ring-1 ring-slate-300"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0">
                  {currentUser?.name?.slice(0, 2).toUpperCase() || 'AD'}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-extrabold text-slate-900 truncate">
                  {currentUser?.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {currentUser?.role}
                </div>
              </div>
            </div>

            {currentUser?.isAdmin ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1 shrink-0">
                <Shield className="w-2.5 h-2.5 fill-slate-950" />
                <span>Admin</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 shrink-0">
                Staff
              </span>
            )}
          </div>
        )}

        {/* Notifications */}
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

        {/* 1. STANDARD LOGIN FORM */}
        {authMode === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase block mb-1">
                Username or Work Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. joshua or elena@tourops360.com"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-extrabold text-slate-700 uppercase">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('FORGOT_REQUEST');
                    setResetUsernameOrEmail(usernameOrEmail);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <span>Sign In to TourOps 360</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </form>
        )}

        {/* 2. FORGOT PASSWORD STEP 1: REQUEST CODE */}
        {authMode === 'FORGOT_REQUEST' && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 leading-relaxed">
              Enter your login username or registered work email. TourOps 360 will dispatch a <strong>6-digit security verification code</strong> to your approved email address.
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase block mb-1">
                Your Username or Approved Work Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. elena@tourops360.com or elena"
                  value={resetUsernameOrEmail}
                  onChange={(e) => setResetUsernameOrEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send 6-Digit Security Code</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD STEP 2: VERIFY CODE & SET NEW PASSWORD */}
        {authMode === 'FORGOT_VERIFY' && (
          <form onSubmit={handleVerifyAndResetPassword} className="space-y-3.5">
            <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-2xl text-xs text-amber-950 space-y-1">
              <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                <Mail className="w-4 h-4 text-amber-600" />
                <span>Verification Code Dispatched</span>
              </div>
              <div>
                We sent a 6-digit security code to: <strong className="font-mono text-slate-900">{targetEmailDispatched}</strong>. Check your inbox (or simulated alert banner at top).
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-700 uppercase block mb-1">
                6-Digit Security Code *
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-9 pr-3 py-2 text-base bg-slate-50 border border-amber-400 rounded-xl font-mono font-black tracking-widest text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
              </div>
            </div>

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
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password..."
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('FORGOT_REQUEST');
                  setErrorMessage(null);
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Resend Code
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('LOGIN');
                    setErrorMessage(null);
                  }}
                  className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Verify Code &amp; Reset</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 4. MANDATORY FORCED RESET (Initiated by Administrator Joshua Koonin) */}
        {authMode === 'FORCED_RESET' && (
          <form onSubmit={handleForcedPasswordSave} className="space-y-3.5">
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 space-y-1">
              <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Administrator Required Reset</span>
              </div>
              <div>
                System Administrator <strong>Joshua Koonin</strong> has required a password reset for <strong>{pendingForcedUser?.name}</strong>. Please choose a new secure password.
              </div>
            </div>

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
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password..."
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Update Password &amp; Continue</span>
            </button>
          </form>
        )}

        {/* Quick Profile Switching Helpers (only in LOGIN mode) */}
        {authMode === 'LOGIN' && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                One-Click Role Simulator:
              </span>
              <span className="text-[10px] text-amber-700 font-semibold">Testing Shortcuts</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Quick Switch to Joshua Koonin (Admin) */}
              <button
                type="button"
                onClick={() => {
                  const josh = staff.find((s) => s.isAdmin || s.email === 'josh@pizazzisrael.com');
                  if (josh) handleQuickSwitch(josh.id);
                }}
                className="p-2 bg-amber-50 hover:bg-amber-100/80 border border-amber-300 rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="font-extrabold text-[11px] text-amber-950 flex items-center gap-1">
                  <span>👑</span>
                  <span>Joshua Koonin</span>
                </div>
                <div className="text-[9px] text-amber-800 font-bold uppercase mt-0.5">
                  System Administrator
                </div>
              </button>

              {/* Quick Switch to Elena Vance (Staff) */}
              <button
                type="button"
                onClick={() => {
                  const elena = staff.find((s) => s.name.includes('Elena'));
                  if (elena) handleQuickSwitch(elena.id);
                }}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all cursor-pointer"
              >
                <div className="font-extrabold text-[11px] text-slate-900">
                  Elena Vance
                </div>
                <div className="text-[9px] text-slate-500 uppercase mt-0.5">
                  Standard Staff
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

