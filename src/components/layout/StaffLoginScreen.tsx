import React, { useState } from 'react';
import {
  Compass,
  Lock,
  User,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Mail,
  Sparkles,
  RefreshCw,
  LogOut,
  Clock,
  Key,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StaffLoginScreen: React.FC = () => {
  const {
    staff,
    firebaseUser,
    approvedMember,
    isApproved,
    isAuthLoading,
    authError,
    signInWithGoogle,
    signOutUser,
    loginUser,
    requestPasswordResetCode,
    verifyResetCodeAndSetPassword,
    latestSecurityAlertEmail,
  } = useApp();

  type AuthMode = 'GOOGLE' | 'LEGACY_LOGIN' | 'FORGOT_REQUEST' | 'FORGOT_VERIFY';
  const [authMode, setAuthMode] = useState<AuthMode>('GOOGLE');

  // Form states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetUsernameOrEmail, setResetUsernameOrEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(authError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in was interrupted or failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLegacyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!usernameOrEmail.trim()) {
      setErrorMessage('Please enter your staff username or work email.');
      return;
    }
    setIsSubmitting(true);
    const result = await loginUser(usernameOrEmail.trim(), password);
    setIsSubmitting(false);

    if (result.success && result.user) {
      setSuccessMessage(`Welcome back, ${result.user.name}!`);
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleRequestResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!resetUsernameOrEmail.trim()) {
      setErrorMessage('Please enter your username or registered work email.');
      return;
    }
    const res = requestPasswordResetCode(resetUsernameOrEmail.trim());
    if (res.success) {
      setAuthMode('FORGOT_VERIFY');
      setSuccessMessage(`Security code dispatched to ${res.email || 'your email'}`);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleVerifyResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!resetCode.trim()) {
      setErrorMessage('Please enter the 6-digit security reset code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Password confirmation does not match.');
      return;
    }
    const res = verifyResetCodeAndSetPassword(resetUsernameOrEmail.trim(), resetCode.trim(), newPassword.trim());
    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        setAuthMode('LEGACY_LOGIN');
        setUsernameOrEmail(resetUsernameOrEmail);
        setPassword(newPassword);
      }, 1500);
    } else {
      setErrorMessage(res.message);
    }
  };

  // If user is already authenticated with Google but awaiting administrator approval
  if (firebaseUser && !isApproved) {
    const isRejected = approvedMember?.status === 'rejected';

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-slate-950">
        <div className="w-full max-w-lg relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold">
              <Compass className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span>TourOps 360 Workspace</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {isRejected ? 'Access Revoked' : 'Access Pending Approval'}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm mx-auto">
              {isRejected
                ? 'Your access to this workspace has been revoked by an administrator.'
                : 'Your Google account has been registered. Only approved team members can access this workspace.'}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-6">
            {/* User Profile Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center space-x-4">
              {firebaseUser.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || 'Google Profile'}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400/40"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 font-black text-lg flex items-center justify-center">
                  {firebaseUser.displayName ? firebaseUser.displayName.slice(0, 2).toUpperCase() : 'GO'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-slate-900 text-base truncate">
                  {firebaseUser.displayName || 'Google User'}
                </h3>
                <p className="text-xs text-slate-500 font-mono truncate">{firebaseUser.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isRejected
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{isRejected ? 'Access Revoked' : 'Pending Approval'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Explanatory Notice */}
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-950">
              <div className="flex items-center space-x-2 font-bold text-amber-900">
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Next Steps for Workspace Access:</span>
              </div>
              <p>
                Administrator <strong>Joshua Koonin (josh@pizazzisrael.com)</strong> has been notified of your access request. Once approved, you will have immediate live access to itineraries, bookings, and team operations.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Check Status / Reload</span>
              </button>

              <button
                type="button"
                onClick={signOutUser}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Sign Out &amp; Use Another Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-slate-950">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold shadow-xs">
            <Compass className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>TourOps 360 Workspace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Team Workspace Access
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
            Sign in with your approved Google account to access live itineraries, suppliers, client CRM, and staff operations.
          </p>
        </div>

        {/* Card Body */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between text-white text-xs">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Google Workspace SSO
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
              Cloud Firestore Live
            </span>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2 text-rose-800 text-xs font-semibold animate-fadeIn">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {authMode === 'GOOGLE' && (
              <div className="space-y-6">
                {/* Hero Google Sign-In Button */}
                <button
                  type="button"
                  disabled={isSubmitting || isAuthLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-4 px-6 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-amber-400 text-slate-900 font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-3.5 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting || isAuthLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />
                      <span>Signing in with Google...</span>
                    </>
                  ) : (
                    <>
                      {/* Google G Logo SVG */}
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Sign in with Google</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </>
                  )}
                </button>

                {/* Secure Governance Highlights */}
                <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">Approved Team Only</span>
                    Admin controls membership in real-time.
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-0.5">Real-Time Firestore</span>
                    Live shared workspace for all approved members.
                  </div>
                </div>

                {/* Administrator Notice */}
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-start space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Root Administrator account: <strong>josh@pizazzisrael.com</strong> (Joshua Koonin). Authorized admins can approve colleagues, assign roles, and revoke access instantly.
                  </p>
                </div>

                {/* Legacy Password Login Option */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setAuthMode('LEGACY_LOGIN')}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
                  >
                    Or sign in using local staff profile credentials
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2: Legacy Staff Credentials Form */}
            {authMode === 'LEGACY_LOGIN' && (
              <form onSubmit={handleLegacyLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Staff Username or Work Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      required
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      placeholder="e.g. joshua or josh@pizazzisrael.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('FORGOT_REQUEST')}
                      className="text-xs text-amber-700 hover:text-amber-800 font-bold hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password123!"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Sign In Locally</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthMode('GOOGLE')}
                    className="w-full py-2.5 text-xs text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                  >
                    &larr; Back to Google Workspace SSO
                  </button>
                </div>
              </form>
            )}

            {/* Mode 3: Forgot Password Request */}
            {authMode === 'FORGOT_REQUEST' && (
              <form onSubmit={handleRequestResetCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={resetUsernameOrEmail}
                    onChange={(e) => setResetUsernameOrEmail(e.target.value)}
                    placeholder="josh@pizazzisrael.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-md cursor-pointer"
                >
                  Send Verification Code
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('GOOGLE')}
                  className="w-full py-2 text-xs text-slate-500 font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            )}

            {/* Mode 4: Verify Code & Set New Password */}
            {authMode === 'FORGOT_VERIFY' && (
              <form onSubmit={handleVerifyResetCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    6-Digit Security Code
                  </label>
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter code..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-center tracking-widest text-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer"
                >
                  Save New Password
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
