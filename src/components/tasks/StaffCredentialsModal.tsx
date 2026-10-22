import React, { useState } from 'react';
import {
  Shield,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  UserCheck,
  AlertTriangle,
  Lock,
  Sparkles,
  Search,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StaffMember } from '../../types';

interface StaffCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStaffMember?: StaffMember | null;
}

export const StaffCredentialsModal: React.FC<StaffCredentialsModalProps> = ({
  isOpen,
  onClose,
  targetStaffMember,
}) => {
  const { staff, updateStaffCredentials, currentUser, isSystemAdmin, deleteStaffMember } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'ADMINS'>('ALL');
  const [copiedStaffId, setCopiedStaffId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [editingStaffId, setEditingStaffId] = useState<string | null>(
    targetStaffMember ? targetStaffMember.id : null
  );
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form field state for the active staff member being edited
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isApprovedInput, setIsApprovedInput] = useState(true);
  const [isAdminInput, setIsAdminInput] = useState(false);
  const [financialViewInput, setFinancialViewInput] = useState<'full' | 'restricted'>('full');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!isOpen || !isSystemAdmin) return null;

  const handleSelectStaffForEdit = (member: StaffMember) => {
    setEditingStaffId(member.id);
    setUsernameInput(member.username || member.email.split('@')[0] || 'staff');
    setPasswordInput(member.password || 'Password123!');
    setIsApprovedInput(member.isApproved ?? true);
    setIsAdminInput(Boolean(member.isAdmin));
    setFinancialViewInput(member.financialView || 'full');
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPasswordInput(generated);
    showToast('Generated strong secure password!');
  };

  const handleSaveCredentials = async (staffId: string) => {
    if (!usernameInput.trim()) {
      showToast('Error: Username cannot be blank');
      return;
    }
    if (!passwordInput.trim()) {
      showToast('Error: Password cannot be blank');
      return;
    }

    const res = await updateStaffCredentials(staffId, {
      username: usernameInput.trim(),
      password: passwordInput.trim(),
      isApproved: isApprovedInput,
      isAdmin: isAdminInput,
      financialView: financialViewInput,
    });

    if (res.success) {
      const member = staff.find((s) => s.id === staffId);
      showToast(`Updated login credentials for ${member?.name || 'staff member'}`);
      setEditingStaffId(null);
    } else {
      showToast(res.error || 'Failed to update credentials');
    }
  };

  const handleCopyCredentials = (member: StaffMember) => {
    const u = member.username || member.email;
    const p = member.password || 'Password123!';
    const text = `TourOps 360 Staff Access Credentials\nEmployee: ${member.name} (${member.role})\nLogin Username: ${u}\nWork Email: ${member.email}\nPassword: ${p}\nStatus: ${member.isApproved !== false ? 'Approved' : 'Pending Approval'}\nAdmin Privileges: ${member.isAdmin ? 'System Administrator' : 'Standard Operations Staff'}`;

    navigator.clipboard.writeText(text);
    setCopiedStaffId(member.id);
    showToast(`Copied login credentials for ${member.name} to clipboard!`);
    setTimeout(() => setCopiedStaffId(null), 3000);
  };

  const handleConfirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    setIsDeleting(true);
    const res = await deleteStaffMember(staffToDelete.id);
    setIsDeleting(false);
    if (res.success) {
      showToast(`Removed ${staffToDelete.name} permanently from live workspace.`);
      if (editingStaffId === staffToDelete.id) setEditingStaffId(null);
      setStaffToDelete(null);
    } else {
      showToast(res.error || 'Failed to remove staff member.');
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredStaff = staff.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      s.role.toLowerCase().includes(q);

    const matchesFilter =
      filterType === 'ALL' ||
      (filterType === 'APPROVED' && s.isApproved !== false) ||
      (filterType === 'PENDING' && s.isApproved === false) ||
      (filterType === 'ADMINS' && s.isAdmin);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 max-h-[92vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Shield className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Staff Login &amp; Password Access Governance
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized Administrator: <strong>Joshua Koonin</strong> &bull; Create and manage secure login credentials for approved staff
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {toastMessage && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs font-bold flex items-center justify-between shadow-xs animate-fade-in shrink-0">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-600" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-amber-800 font-bold">
              &times;
            </button>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff name, email, username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterType === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Staff ({staff.length})
            </button>
            <button
              onClick={() => setFilterType('APPROVED')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterType === 'APPROVED' ? 'bg-emerald-600 text-white font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approved ({staff.filter((s) => s.isApproved !== false).length})
            </button>
            <button
              onClick={() => setFilterType('PENDING')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterType === 'PENDING' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({staff.filter((s) => s.isApproved === false).length})
            </button>
            <button
              onClick={() => setFilterType('ADMINS')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterType === 'ADMINS' ? 'bg-slate-900 text-white font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admins ({staff.filter((s) => s.isAdmin).length})
            </button>
          </div>
        </div>

        {/* Staff Credential Cards List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredStaff.map((member) => {
            const isEditing = editingStaffId === member.id;
            const isPasswordRevealed = Boolean(visiblePasswords[member.id]);
            const isJoshua = member.isAdmin || member.email === 'josh@pizazzisrael.com';

            return (
              <div
                key={member.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isEditing
                    ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/40'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Member Overview */}
                  <div className="flex items-start space-x-3 min-w-0">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">
                          {member.name}
                        </h4>

                        {member.isAdmin && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5 fill-slate-950" />
                            <span>System Administrator</span>
                          </span>
                        )}

                        {member.isApproved !== false ? (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            Approved Access
                          </span>
                        ) : (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900">
                            Pending Approval
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {member.role} &bull; {member.department} &bull;{' '}
                        <span className="font-mono text-[11px] text-slate-600">{member.email}</span>
                      </div>

                      {member.lastLogin && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Last login: {member.lastLogin}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Credentials Info / Inline Action Bar */}
                  {!isEditing ? (
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs space-y-0.5 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-sans uppercase font-bold">Username:</span>
                          <span className="font-bold text-slate-900">{member.username || member.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-sans uppercase font-bold">Password:</span>
                          <span className="text-slate-800">
                            {isPasswordRevealed ? member.password || 'Password123!' : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(member.id)}
                            className="text-slate-400 hover:text-slate-700 ml-1"
                            title={isPasswordRevealed ? 'Hide Password' : 'Show Password'}
                          >
                            {isPasswordRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyCredentials(member)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          copiedStaffId === member.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Copy Login Details to Clipboard"
                      >
                        {copiedStaffId === member.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">
                          {copiedStaffId === member.id ? 'Copied' : 'Copy'}
                        </span>
                      </button>

                      {isSystemAdmin && (
                        <button
                          onClick={() => handleSelectStaffForEdit(member)}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          <span>Change Login / Password</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingStaffId(null)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveCredentials(member.id)}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Credentials</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Edit Form Drawer */}
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-amber-200 space-y-3 animate-fade-in bg-white p-4 rounded-xl border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-700 uppercase block mb-1">
                          Login Username / Handle *
                        </label>
                        <input
                          type="text"
                          required
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:bg-white outline-none"
                          placeholder="e.g. elena.vance"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-extrabold text-slate-700 uppercase">
                            Password *
                          </label>
                          <button
                            type="button"
                            onClick={handleGeneratePassword}
                            className="text-[10px] text-amber-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>Generate Strong</span>
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:bg-white outline-none pr-8"
                            placeholder="Enter password..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isApprovedInput}
                            disabled={isJoshua}
                            onChange={(e) => setIsApprovedInput(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Approved for System Login &amp; Operations Access</span>
                        </label>

                        {!isJoshua && (
                          <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isAdminInput}
                              onChange={(e) => setIsAdminInput(e.target.checked)}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                            />
                            <span>System Administrator Privileges</span>
                          </label>
                        )}
                      </div>

                      {/* System Administrator Financial View Setting */}
                      {isSystemAdmin && (
                        <div className="w-full mt-2 pt-2 border-t border-slate-200">
                          <label className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider block mb-1">
                            Financial Access Permission
                          </label>
                          <div className="flex items-center gap-4 text-xs">
                            <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800">
                              <input
                                type="radio"
                                name={`financialView-${member.id}`}
                                value="full"
                                checked={financialViewInput === 'full'}
                                onChange={() => setFinancialViewInput('full')}
                                className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                              />
                              <span>Full financial view</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800">
                              <input
                                type="radio"
                                name={`financialView-${member.id}`}
                                value="restricted"
                                checked={financialViewInput === 'restricted'}
                                onChange={() => setFinancialViewInput('restricted')}
                                className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                              />
                              <span>Restricted financial view</span>
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-500">
                        {isJoshua
                          ? '👑 Joshua Koonin is the Master System Administrator.'
                          : 'Staff member can login immediately with these credentials.'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Master Credentials Vault &bull; Managed exclusively by System Administrator Joshua Koonin</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Done &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
