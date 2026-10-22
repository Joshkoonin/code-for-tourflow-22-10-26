import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Trash2,
  Clock,
  Mail,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  Sparkles,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApprovedTeamMember } from '../../types';

interface TeamAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamAccessModal: React.FC<TeamAccessModalProps> = ({ isOpen, onClose }) => {
  const {
    approvedMembers,
    approveMember,
    rejectMember,
    deleteApprovedMember,
    isSystemAdmin,
    currentUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen || !isSystemAdmin) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const pendingMembers = approvedMembers.filter((m) => m.status === 'pending');

  const filteredMembers = approvedMembers.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      m.displayName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.role && m.role.toLowerCase().includes(q));

    const matchesTab =
      filterTab === 'ALL' ||
      (filterTab === 'PENDING' && m.status === 'pending') ||
      (filterTab === 'APPROVED' && m.status === 'approved');

    return matchesSearch && matchesTab;
  });

  const handleApprove = async (
    member: ApprovedTeamMember,
    role: 'admin' | 'staff' = 'staff',
    financialView: 'full' | 'restricted' = 'full'
  ) => {
    setActionLoadingId(member.uid);
    try {
      await approveMember(member.uid, role, financialView);
      showToast(`Approved access for ${member.displayName || member.email} as ${role} (${financialView === 'full' ? 'Full financial view' : 'Restricted financial view'})!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to approve member');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateFinancialView = async (
    member: ApprovedTeamMember,
    financialView: 'full' | 'restricted'
  ) => {
    setActionLoadingId(member.uid);
    try {
      await approveMember(member.uid, member.role || 'staff', financialView);
      showToast(`Updated financial view for ${member.displayName || member.email} to ${financialView === 'full' ? 'Full financial view' : 'Restricted financial view'}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update financial permission');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevoke = async (member: ApprovedTeamMember) => {
    if (member.email === 'josh@pizazzisrael.com') {
      showToast('Cannot revoke root administrator account');
      return;
    }
    setActionLoadingId(member.uid);
    try {
      await rejectMember(member.uid);
      showToast(`Revoked access for ${member.displayName || member.email}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke access');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (member: ApprovedTeamMember) => {
    if (member.email === 'josh@pizazzisrael.com') {
      showToast('Cannot delete root administrator account');
      return;
    }
    if (!window.confirm(`Permanently remove ${member.displayName || member.email} from workspace access?`)) {
      return;
    }
    setActionLoadingId(member.uid);
    try {
      await deleteApprovedMember(member.uid);
      showToast(`Removed ${member.displayName || member.email} from workspace`);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove member');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 max-h-[92vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Google Workspace Team Access &amp; Approvals
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-950 border border-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Cloud Firestore Live
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized Administrator: <strong>{currentUser?.name || 'Joshua Koonin'}</strong> &bull; Only approved Google accounts can access shared workspace data
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center space-x-2 text-amber-900 text-xs font-semibold animate-fadeIn">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members by name or Google email..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Members ({approvedMembers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTab === 'PENDING'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : pendingMembers.length > 0
                  ? 'text-amber-700 bg-amber-100 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pending Approval</span>
              {pendingMembers.length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-600 text-white text-[10px] rounded-full font-black">
                  {pendingMembers.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('APPROVED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'APPROVED'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approved ({approvedMembers.filter((m) => m.status === 'approved').length})
            </button>
          </div>
        </div>

        {/* Member Cards List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[250px]">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">No team members found</p>
              <p className="text-xs text-slate-400 mt-1">
                When new colleagues sign in with their Google account, their request will appear here for your approval.
              </p>
            </div>
          ) : (
            filteredMembers.map((member) => {
              const isJosh = member.email === 'josh@pizazzisrael.com';
              const isPending = member.status === 'pending';
              const isApproved = member.status === 'approved';
              const isLoading = actionLoadingId === member.uid;

              return (
                <div
                  key={member.uid}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPending
                      ? 'bg-amber-50/70 border-amber-300 shadow-xs ring-1 ring-amber-300/50'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {member.photoURL ? (
                      <img
                        src={member.photoURL}
                        alt={member.displayName}
                        className="w-10 h-10 rounded-xl object-cover shrink-0 ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center shrink-0">
                        {member.displayName ? member.displayName.slice(0, 2).toUpperCase() : 'GM'}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">
                          {member.displayName}
                        </h4>
                        {isJosh && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                            Root Administrator
                          </span>
                        )}
                        {!isJosh && member.role === 'admin' && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-950 border border-amber-300">
                            Admin
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isPending
                              ? 'bg-amber-200 text-amber-900 border border-amber-400 font-extrabold animate-pulse'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {member.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <span className="font-mono text-slate-600">{member.email}</span>
                        {member.approvedAt && (
                          <span>&bull; Approved: {new Date(member.approvedAt).toLocaleDateString()}</span>
                        )}
                        {member.lastLoginAt && (
                          <span>&bull; Last Login: {new Date(member.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap justify-end">
                    {isPending && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleApprove(member, 'staff', 'full')}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          title="Approve as Staff with Full financial view"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Staff (Full)</span>
                        </button>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleApprove(member, 'staff', 'restricted')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          title="Approve as Staff with Restricted financial view"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Staff (Restricted)</span>
                        </button>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleApprove(member, 'admin', 'full')}
                          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          title="Approve as Administrator"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Admin</span>
                        </button>
                      </div>
                    )}

                    {isApproved && !isJosh && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                          <label className="text-[10px] text-slate-500 font-bold px-1.5 uppercase">Financial:</label>
                          <select
                            disabled={isLoading}
                            value={member.financialView || 'full'}
                            onChange={(e) => handleUpdateFinancialView(member, e.target.value as 'full' | 'restricted')}
                            className="text-xs font-bold text-slate-800 bg-white border-0 rounded-lg px-2 py-1 outline-none cursor-pointer shadow-2xs"
                            title="Set financial view for this user"
                          >
                            <option value="full">Full financial view</option>
                            <option value="restricted">Restricted financial view</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleRevoke(member)}
                          title="Revoke active workspace access"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-200"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {!isJosh && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleDelete(member)}
                        title="Permanently remove user"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              All approved team members share the same live workspace synchronized via Cloud Firestore.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer transition-all self-end"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
