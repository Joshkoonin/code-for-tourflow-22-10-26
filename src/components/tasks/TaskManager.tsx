import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Filter,
  User,
  Sparkles,
  Trash2,
  Bell,
  Compass,
  Briefcase,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Mail,
  Send,
  Check,
  X,
  ExternalLink,
  Inbox,
  AlertOctagon,
  UserPlus,
  Key,
  Shield,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, TaskPriority, TaskStatus, StaffMember } from '../../types';
import { StaffCredentialsModal } from './StaffCredentialsModal';

const CURATED_STAFF_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
];

export const TaskManager: React.FC = () => {
  const {
    tasks,
    addTask,
    updateTask,
    toggleTaskStatus,
    deleteTask,
    deleteAllTasks,
    snoozeTask,
    unsnoozeTask,
    staff,
    addStaffMember,
    deleteStaffMember,
    itineraries,
    currentUser,
    isSystemAdmin,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assignedFilter, setAssignedFilter] = useState<string>('ALL');
  const [dueFilter, setDueFilter] = useState<'ALL' | 'DUE_TODAY' | 'OVERDUE' | 'EMAIL_PENDING' | 'SNOOZED'>('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isConfirmDeleteAllModalOpen, setIsConfirmDeleteAllModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  // Staff Credentials & Login Governance State
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [credentialsTargetStaff, setCredentialsTargetStaff] = useState<StaffMember | null>(null);

  // Helper for generating initials for staff without avatar
  const getInitials = (name: string): string => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // New staff form state (Avatar is completely optional)
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [newStaffDepartment, setNewStaffDepartment] = useState<StaffMember['department']>('Tour Directing');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffBio, setNewStaffBio] = useState('');
  const [newStaffSkills, setNewStaffSkills] = useState('');
  const [newStaffAvatar, setNewStaffAvatar] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('Password123!');
  const [newStaffIsApproved, setNewStaffIsApproved] = useState(true);
  const [newStaffFinancialView, setNewStaffFinancialView] = useState<'full' | 'restricted'>('full');
  const [showNewStaffPassword, setShowNewStaffPassword] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [selectedTaskForEmailPreview, setSelectedTaskForEmailPreview] = useState<Task | null>(null);
  const [taskToSnooze, setTaskToSnooze] = useState<Task | null>(null);
  const [snoozeDaysChoice, setSnoozeDaysChoice] = useState<number>(1);
  const [snoozeCustomDate, setSnoozeCustomDate] = useState<string>('');
  const [emailToast, setEmailToast] = useState<string | null>(null);
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(true);

  const showEmailToast = (msg: string) => {
    setEmailToast(msg);
    setTimeout(() => setEmailToast(null), 4500);
  };

  const handleGenerateNewStaffPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewStaffPassword(generated);
    setShowNewStaffPassword(true);
    showEmailToast('Generated strong secure password for new staff member!');
  };

  const handleOpenAddStaff = () => {
    if (!isSystemAdmin) {
      showEmailToast('Permission Denied: Only System Administrator Joshua Koonin can create new staff members.');
      return;
    }
    setNewStaffName('');
    setNewStaffRole('');
    setNewStaffDepartment('Tour Directing');
    setNewStaffEmail('');
    setNewStaffPhone('');
    setNewStaffBio('');
    setNewStaffSkills('');
    setNewStaffAvatar('');
    setNewStaffUsername('');
    setNewStaffPassword('Password123!');
    setNewStaffIsApproved(true);
    setNewStaffFinancialView('full');
    setShowNewStaffPassword(false);
    setStaffError(null);
    setIsAddStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSystemAdmin) {
      setStaffError('Permission Denied: Only System Administrator Joshua Koonin can create new staff members.');
      return;
    }
    if (!newStaffName.trim()) {
      setStaffError('Please enter the staff member name');
      return;
    }
    if (!newStaffEmail.trim()) {
      setStaffError('Please enter their work email address');
      return;
    }

    const skillsArray = newStaffSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const autoUsername =
      newStaffUsername.trim() ||
      newStaffName.trim().toLowerCase().replace(/\s+/g, '.');
    const autoPassword = newStaffPassword.trim() || 'Password123!';

    const created: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaffName.trim(),
      role: newStaffRole.trim() || 'Operations Specialist',
      department: newStaffDepartment,
      email: newStaffEmail.trim(),
      phone: newStaffPhone.trim() || '+972-54-000-0000',
      bio: newStaffBio.trim() || 'Operations team member managing bespoke itinerary logistics and client care.',
      skills: skillsArray.length > 0 ? skillsArray : ['Operations', 'Guest Care'],
      ...(newStaffAvatar.trim() ? { avatar: newStaffAvatar.trim() } : {}),
      username: autoUsername,
      password: autoPassword,
      isApproved: newStaffIsApproved,
      isAdmin: false,
      financialView: newStaffFinancialView,
    };

    const res = await addStaffMember(created);
    if (!res.success) {
      setStaffError(res.error || 'Failed to create staff member.');
      return;
    }

    showEmailToast(
      `Added new staff member: ${created.name} (@${created.username}) with login credentials set by Joshua Koonin.`
    );
    setIsAddStaffModalOpen(false);
  };

  const handleConfirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    if (!isSystemAdmin) {
      showEmailToast('Permission Denied: Only System Administrator Joshua Koonin can remove staff members.');
      setStaffToDelete(null);
      return;
    }
    if (staffToDelete.isAdmin || staffToDelete.id === 'staff-admin-joshua' || staffToDelete.email === 'josh@pizazzisrael.com') {
      showEmailToast('Cannot Delete: Joshua Koonin is the System Administrator and cannot be removed.');
      setStaffToDelete(null);
      return;
    }

    const name = staffToDelete.name;
    const res = await deleteStaffMember(staffToDelete.id);
    if (!res.success) {
      showEmailToast(res.error || 'Failed to remove staff member.');
      setStaffToDelete(null);
      return;
    }

    if (assignedFilter === staffToDelete.id) {
      setAssignedFilter('ALL');
    }
    showEmailToast(`Staff member "${name}" was deleted by System Administrator Joshua Koonin. Any assigned tasks were unassigned.`);
    setStaffToDelete(null);
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'High',
    status: 'Todo',
    assignedStaffId: staff[0]?.id || '',
    dueDate: new Date().toISOString().split('T')[0],
    isReminder: true,
    reminderTriggerDaysBeforeTrip: 3,
    category: 'Client Care',
    staffEmailReminderEnabled: true,
    staffEmailReminderStatus: 'Scheduled',
  });

  // Calculate tasks due today, overdue, or pending email reminder
  const dueTodayOrOverdueTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== 'Completed' && t.dueDate <= todayStr);
  }, [tasks, todayStr]);

  const tasksPendingEmail = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === 'Completed') return false;
      if (t.staffEmailReminderEnabled === false) return false;
      return t.staffEmailReminderStatus !== 'Sent' && t.dueDate <= todayStr;
    });
  }, [tasks, todayStr]);

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'ACTIVE' && t.status === 'Completed') return false;
    if (statusFilter === 'COMPLETED' && t.status !== 'Completed') return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (assignedFilter !== 'ALL' && t.assignedStaffId !== assignedFilter) return false;

    if (dueFilter === 'DUE_TODAY' && (t.dueDate !== todayStr || t.status === 'Completed')) return false;
    if (dueFilter === 'OVERDUE' && (t.dueDate >= todayStr || t.status === 'Completed')) return false;
    if (dueFilter === 'EMAIL_PENDING' && (t.staffEmailReminderStatus === 'Sent' || t.status === 'Completed')) return false;

    return true;
  });

  const urgentReminders = tasks.filter(
    (t) => t.status !== 'Completed' && (t.priority === 'Urgent' || t.isReminder)
  );

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title || '',
      description: newTask.description || '',
      tripId: newTask.tripId || undefined,
      assignedStaffId: newTask.assignedStaffId || staff[0]?.id,
      priority: (newTask.priority as TaskPriority) || 'High',
      status: (newTask.status as TaskStatus) || 'Todo',
      dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
      isReminder: Boolean(newTask.isReminder),
      reminderTriggerDaysBeforeTrip: Number(newTask.reminderTriggerDaysBeforeTrip) || 3,
      category: (newTask.category as any) || 'Client Care',
      staffEmailReminderEnabled: newTask.staffEmailReminderEnabled ?? true,
      staffEmailReminderStatus: newTask.staffEmailReminderEnabled ? 'Scheduled' : 'Disabled',
    };

    addTask(task);
    setIsAddModalOpen(false);

    const worker = staff.find((s) => s.id === task.assignedStaffId);
    showToastNotification(
      `Assigned "${task.title}" to ${worker?.name || 'staff profile'}. Email reminder scheduled for ${task.dueDate}.`
    );

    setNewTask({
      title: '',
      description: '',
      priority: 'High',
      status: 'Todo',
      assignedStaffId: staff[0]?.id || '',
      dueDate: new Date().toISOString().split('T')[0],
      isReminder: true,
      category: 'Client Care',
      staffEmailReminderEnabled: true,
      staffEmailReminderStatus: 'Scheduled',
    });
  };

  const handleReassignWorker = (taskId: string, newStaffId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const worker = staff.find((s) => s.id === newStaffId);
    updateTask({
      ...task,
      assignedStaffId: newStaffId,
      // If reassigned, keep reminder scheduled for the new worker
      staffEmailReminderStatus: task.staffEmailReminderStatus === 'Sent' ? 'Scheduled' : task.staffEmailReminderStatus,
    });
    showToastNotification(`Reassigned "${task.title}" to ${worker?.name || 'worker profile'}.`);
  };

  const showToastNotification = (msg: string) => {
    setEmailToast(msg);
    setTimeout(() => setEmailToast(null), 4500);
  };

  // DISPATCH SINGLE STAFF EMAIL REMINDER
  const handleSendStaffEmail = (task: Task) => {
    const worker = staff.find((s) => s.id === task.assignedStaffId);
    const trip = itineraries.find((t) => t.id === task.tripId);
    const recipientEmail = worker?.email || 'operations@tourops360.com';
    const subject = `[Action Required] Task Due: ${task.title} (${trip ? trip.code : 'Operations'})`;
    const body = `Dear ${worker?.name || 'Team Member'},

This is an automated due-date reminder from TourOps 360 for your assigned task:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK: ${task.title}
DUE DATE: ${task.dueDate}
PRIORITY: ${task.priority}
CATEGORY: ${task.category}
PROJECT: ${trip ? `${trip.code} - ${trip.title}` : 'General Tour Operations'}
ASSIGNED TO: ${worker?.name} (${recipientEmail})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESCRIPTION & ACTION REQUIRED:
${task.description || 'Please review task in TourOps 360 console.'}

Please log in to TourOps 360 to mark this task complete once fulfilled.

Best regards,
TourOps 360 Automated Task Dispatch Engine
support@tourops360.com`;

    // Trigger email via safe temporary anchor element (no window.open)
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const link = document.createElement('a');
    link.href = mailtoUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Update task state with sent record
    updateTask({
      ...task,
      staffEmailReminderStatus: 'Sent',
      staffEmailReminderSentAt: new Date().toISOString(),
    });

    if (selectedTaskForEmailPreview?.id === task.id) {
      setSelectedTaskForEmailPreview(null);
    }

    showToastNotification(`Email reminder successfully dispatched to ${worker?.name} (${recipientEmail})!`);
  };

  // BATCH DISPATCH ALL DUE TASK EMAIL REMINDERS
  const handleBatchDispatchDueTaskEmailReminders = () => {
    if (tasksPendingEmail.length === 0) {
      showToastNotification('All due tasks already have their email reminders dispatched!');
      return;
    }

    const recipientNames: string[] = [];
    tasksPendingEmail.forEach((task) => {
      const worker = staff.find((s) => s.id === task.assignedStaffId);
      if (worker && !recipientNames.includes(worker.name)) {
        recipientNames.push(worker.name);
      }
      updateTask({
        ...task,
        staffEmailReminderStatus: 'Sent',
        staffEmailReminderSentAt: new Date().toISOString(),
      });
    });

    showToastNotification(
      `Dispatched ${tasksPendingEmail.length} due-date email reminders to operations staff: ${recipientNames.join(', ')}.`
    );
  };

  // Automated departure checklist generator
  const handleAutoGenerateChecklist = () => {
    const activeTrip = itineraries[0];
    if (!activeTrip) return;

    const checklistItems = [
      {
        title: `Verify VIP Dietary Requirements & Chef Protocol (${activeTrip.code})`,
        desc: 'Confirm kosher mehadrin and allergen precautions with executive catering partners.',
        cat: 'Client Care' as const,
        priority: 'Urgent' as const,
        staffId: staff[0]?.id, // Elena Vance (Tour Directing)
      },
      {
        title: `Confirm VIP Tarmac Escort & Chauffeur Staging (${activeTrip.code})`,
        desc: 'Re-check flight tail number, pilot contact, and vehicle ramp clearance.',
        cat: 'Logistics' as const,
        priority: 'High' as const,
        staffId: staff[1]?.id, // David Cohen (Logistics)
      },
      {
        title: `Audit Final Balance Payment Clearance (${activeTrip.code})`,
        desc: 'Ensure wire transfer is settled prior to service delivery.',
        cat: 'Payment' as const,
        priority: 'Medium' as const,
        staffId: staff[2]?.id, // Sarah Jenkins (Finance)
      },
      {
        title: `Dispatch Final Vouchers to Suppliers & Guides (${activeTrip.code})`,
        desc: 'Confirm lone provider Dr. Avi Ron and Ehud Maybach Sprinter briefing.',
        cat: 'Supplier' as const,
        priority: 'High' as const,
        staffId: staff[3]?.id, // Marcus Brody (Supplier Relations)
      },
    ];

    checklistItems.forEach((item, index) => {
      addTask({
        id: `auto-task-${Date.now()}-${index}`,
        title: item.title,
        description: item.desc,
        tripId: activeTrip.id,
        clientId: activeTrip.clientId,
        assignedStaffId: item.staffId || staff[index % staff.length].id,
        priority: item.priority,
        status: 'Todo',
        dueDate: activeTrip.startDate,
        isReminder: true,
        reminderTriggerDaysBeforeTrip: 2,
        category: item.cat,
        staffEmailReminderEnabled: true,
        staffEmailReminderStatus: 'Scheduled',
      });
    });

    showToastNotification(`Generated departure checklist: 4 tasks assigned to operations staff with scheduled email reminders.`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {emailToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{emailToast}</span>
          </div>
          <button
            onClick={() => setEmailToast(null)}
            className="text-emerald-700 hover:text-emerald-950 font-black text-sm px-1.5"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
              Module 2: Operations Staff
            </span>
            <span className="text-xs text-slate-500 font-medium">Staff, Tasks &amp; Reminders Management</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Staff, Tasks &amp; Reminders
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Manage operations staff team members, assign tasks to worker profiles, balance team workloads, and automate pre-departure checklist triggers and due-date email reminders.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          {isSystemAdmin && (
            <button
              onClick={() => {
                setCredentialsTargetStaff(null);
                setIsCredentialsModalOpen(true);
              }}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Manage login usernames and passwords for approved staff members"
            >
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>Staff Logins &amp; Passwords</span>
            </button>
          )}
          <button
            onClick={handleOpenAddStaff}
            className={`px-3.5 py-2 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              isSystemAdmin
                ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
            }`}
            title={isSystemAdmin ? 'Add new staff member' : 'Only System Administrator Joshua Koonin can add staff'}
          >
            {isSystemAdmin ? (
              <UserPlus className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Add Staff Member {!isSystemAdmin && '(Admin Only)'}</span>
          </button>
          <button
            onClick={handleAutoGenerateChecklist}
            className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Auto generate standard pre-departure checklist"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Generate Departure Checklist</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Assign New Task</span>
          </button>
        </div>
      </div>

      {/* STAFF DUE-DATE EMAIL REMINDERS DISPATCH CENTER */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 rounded-3xl p-5 text-white shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500 text-slate-950">
                  Automated Staff Alerts
                </span>
                <span className="text-xs text-slate-400 font-medium">Due Date Email Engine</span>
              </div>
              <h2 className="text-base font-extrabold text-white mt-0.5">
                Staff Due-Date Email Reminders Dispatch Center
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBatchDispatchDueTaskEmailReminders}
              disabled={tasksPendingEmail.length === 0}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                tasksPendingEmail.length > 0
                  ? 'bg-blue-500 hover:bg-blue-400 text-slate-950 shadow-md shadow-blue-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {tasksPendingEmail.length > 0
                  ? `Dispatch Email Reminders (${tasksPendingEmail.length} Due)`
                  : 'All Due Reminders Sent'}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-400">Tasks Due / Overdue Today:</span>
            <span
              className={`font-black px-2 py-0.5 rounded-full text-xs ${
                dueTodayOrOverdueTasks.length > 0
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {dueTodayOrOverdueTasks.length}
            </span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-400">Pending Email Dispatches:</span>
            <span
              className={`font-black px-2 py-0.5 rounded-full text-xs ${
                tasksPendingEmail.length > 0
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {tasksPendingEmail.length}
            </span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 flex items-center justify-between">
            <span className="text-slate-400">Active Staff Profiles:</span>
            <span className="font-bold text-slate-300">{staff.length} Verified Staff Work Emails</span>
          </div>
        </div>
      </div>

      {/* WORKER PROFILES ROSTER (Task Assignment & Workload Distribution) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-amber-600" />
              <span>Operations Team Roster ({staff.length} Staff Members)</span>
            </h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold hidden md:inline-flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-600" />
              <span>Admin: <strong>Joshua Koonin</strong></span>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setCredentialsTargetStaff(null);
                setIsCredentialsModalOpen(true);
              }}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Manage logins and passwords for approved staff"
            >
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>Manage Logins &amp; Passwords</span>
            </button>
            <button
              onClick={handleOpenAddStaff}
              className={`px-3 py-1.5 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ${
                isSystemAdmin
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
              title={isSystemAdmin ? 'Add new staff member' : 'Only System Administrator Joshua Koonin can add staff'}
            >
              {isSystemAdmin ? <UserPlus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Add Staff Member</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {staff.map((worker) => {
            const workerTasks = tasks.filter((t) => t.assignedStaffId === worker.id);
            const activeCount = workerTasks.filter((t) => t.status !== 'Completed').length;
            const urgentCount = workerTasks.filter(
              (t) => t.status !== 'Completed' && t.priority === 'Urgent'
            ).length;
            const isSelected = assignedFilter === worker.id;
            const isJoshua = worker.isAdmin || worker.id === 'staff-admin-joshua' || worker.email === 'josh@pizazzisrael.com';

            return (
              <div
                key={worker.id}
                onClick={() => setAssignedFilter(isSelected ? 'ALL' : worker.id)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-amber-400 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2.5 gap-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      {worker.avatar && worker.avatar.trim() ? (
                        <img
                          src={worker.avatar.trim()}
                          alt={worker.name}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 uppercase ring-2 ring-slate-100 ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 shadow-2xs'
                          }`}
                        >
                          {getInitials(worker.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs truncate leading-snug">
                            {worker.name}
                          </h4>
                          {isJoshua && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-0.5 shrink-0 shadow-2xs">
                              <Shield className="w-2.5 h-2.5 fill-slate-950" />
                              Admin
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-amber-300 font-semibold' : 'text-slate-500'
                          }`}
                        >
                          {worker.role}
                        </div>
                        <div
                          className={`text-[9px] uppercase font-bold tracking-wider mt-0.5 ${
                            isSelected ? 'text-slate-400' : 'text-slate-400'
                          }`}
                        >
                          {worker.department}
                        </div>
                      </div>
                    </div>

                    {/* Delete staff member button or protected badge */}
                    {isJoshua ? (
                      <span
                        className="p-1.5 text-amber-500 shrink-0"
                        title="Joshua Koonin is the System Administrator and cannot be removed"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                    ) : isSystemAdmin ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStaffToDelete(worker);
                        }}
                        className={`p-1.5 rounded-xl transition-colors shrink-0 ${
                          isSelected
                            ? 'text-slate-400 hover:text-red-300 hover:bg-white/10'
                            : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title={`Delete ${worker.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span
                        className="p-1.5 text-slate-300 shrink-0"
                        title="Only System Administrator Joshua Koonin can remove staff"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-[11px] leading-relaxed line-clamp-2 ${
                      isSelected ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {worker.bio}
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {worker.skills?.slice(0, 2).map((skill, i) => (
                      <span
                        key={i}
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                          isSelected
                            ? 'bg-white/10 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Credentials / Login Info & Direct Action */}
                  <div
                    className={`mt-3 p-2 rounded-xl text-[10px] flex items-center justify-between border ${
                      isSelected
                        ? 'bg-white/5 border-white/10 text-slate-200'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="font-mono font-bold truncate flex items-center gap-1">
                        <span className="text-slate-400 font-sans font-normal text-[9px]">LOGIN:</span>
                        <span>@{worker.username || worker.email.split('@')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                            worker.isApproved !== false
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {worker.isApproved !== false ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCredentialsTargetStaff(worker);
                        setIsCredentialsModalOpen(true);
                      }}
                      className={`px-2 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 font-extrabold'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                      }`}
                      title={`Manage login and password for ${worker.name}`}
                    >
                      <Key className="w-3 h-3 text-amber-700" />
                      <span>Credentials</span>
                    </button>
                  </div>
                </div>

                {/* Footer workload badge */}
                <div
                  className={`mt-3 pt-3 border-t flex items-center justify-between text-xs ${
                    isSelected ? 'border-slate-800' : 'border-slate-100'
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold ${
                      activeCount > 0 ? (isSelected ? 'text-amber-300' : 'text-slate-900') : 'text-slate-400'
                    }`}
                  >
                    {activeCount} Active {activeCount === 1 ? 'Task' : 'Tasks'}
                  </span>
                  {urgentCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-red-600 text-white">
                      {urgentCount} Urgent
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Urgent Reminders Callout Box */}
      {urgentReminders.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-300 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-amber-950 font-bold text-sm">
              <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>Priority Staff Reminders &amp; Approaching Deadlines ({urgentReminders.length})</span>
            </div>
            <span className="text-xs font-semibold text-amber-800">Action Required</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentReminders.slice(0, 4).map((reminder) => {
              const staffMember = staff.find((s) => s.id === reminder.assignedStaffId);
              return (
                <div
                  key={reminder.id}
                  className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-amber-200/80 flex items-start justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-red-800">
                        {reminder.priority}
                      </span>
                      <span className="font-bold text-slate-900 line-clamp-1">{reminder.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>Due: <strong>{reminder.dueDate}</strong></span>
                      <span>&bull;</span>
                      <span>Worker: <strong>{staffMember?.name}</strong></span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleTaskStatus(reminder.id)}
                    className="p-1 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-md transition-colors"
                    title="Mark Done"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter:</span>
          </div>

          <select
            value={dueFilter}
            onChange={(e) => setDueFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-bold"
          >
            <option value="ALL">All Deadlines</option>
            <option value="DUE_TODAY">Due Today ({tasks.filter(t => t.status !== 'Completed' && t.dueDate === todayStr).length})</option>
            <option value="OVERDUE">Overdue ({tasks.filter(t => t.status !== 'Completed' && t.dueDate < todayStr).length})</option>
            <option value="EMAIL_PENDING">Staff Email Pending ({tasksPendingEmail.length})</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active (Incomplete)</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="ALL">All Worker Profiles</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.department})
              </option>
            ))}
          </select>

          {(assignedFilter !== 'ALL' || dueFilter !== 'ALL') && (
            <button
              onClick={() => {
                setAssignedFilter('ALL');
                setDueFilter('ALL');
              }}
              className="text-xs text-amber-700 font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {tasks.length > 0 && (
            <button
              onClick={() => setIsConfirmDeleteAllModalOpen(true)}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Delete all currently listed staff tasks"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Delete All Tasks ({tasks.length})</span>
            </button>
          )}
          <div className="text-slate-400 text-xs">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              {tasks.length === 0 ? 'No Staff Tasks Currently Listed' : 'No Tasks Match the Selected Filters'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {tasks.length === 0
                ? 'All staff tasks have been deleted and cleared. You can assign a new task manually or generate an automated pre-departure checklist.'
                : 'Try adjusting your deadline, status, or worker profile filters to view matching tasks.'}
            </p>
            {tasks.length === 0 ? (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Assign New Task</span>
                </button>
                <button
                  onClick={handleAutoGenerateChecklist}
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Departure Checklist</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                  setAssignedFilter('ALL');
                  setDueFilter('ALL');
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'Completed';
            const assignee = staff.find((s) => s.id === task.assignedStaffId);
            const trip = itineraries.find((t) => t.id === task.tripId);
            const isDueToday = task.dueDate === todayStr;
            const isOverdue = task.dueDate < todayStr && !isCompleted;

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  isCompleted ? 'bg-slate-50/70 text-slate-400' : 'hover:bg-amber-50/20'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    className={`mt-0.5 sm:mt-0 p-1 rounded-lg transition-colors shrink-0 ${
                      isCompleted
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-slate-300 hover:text-amber-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          task.priority === 'Urgent'
                            ? 'bg-red-100 text-red-800'
                            : task.priority === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {task.category}
                      </span>
                      {trip && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {trip.code}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                      {task.description}
                    </p>

                    {/* Due Date & Staff Email Reminder Badges */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          Due: <strong className={`${isOverdue ? 'text-red-600' : isDueToday ? 'text-amber-600' : 'text-slate-700'}`}>{task.dueDate}</strong>
                          {isOverdue && <span className="text-red-600 font-extrabold ml-1">(OVERDUE)</span>}
                          {isDueToday && <span className="text-amber-600 font-extrabold ml-1">(DUE TODAY)</span>}
                        </span>
                      </div>

                      {/* Staff Email Notification Badge */}
                      {task.staffEmailReminderStatus === 'Sent' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Email Sent to {assignee?.email}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-blue-600" />
                          <span>Due-Date Email Scheduled ({assignee?.email})</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Worker Profile Assignment Dropdown & Email Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
                  {/* Send Email Reminder Button */}
                  <button
                    onClick={() => setSelectedTaskForEmailPreview(task)}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    title={`Preview and dispatch email reminder to ${assignee?.name} (${assignee?.email})`}
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Send Email Reminder</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {assignee && (
                      assignee.avatar && assignee.avatar.trim() ? (
                        <img
                          src={assignee.avatar.trim()}
                          alt={assignee.name}
                          className="w-7 h-7 rounded-xl object-cover ring-1 ring-slate-200 hidden sm:block"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-900 border border-amber-300 font-bold text-[10px] items-center justify-center shrink-0 hidden sm:flex uppercase">
                          {getInitials(assignee.name)}
                        </div>
                      )
                    )}
                    <select
                      value={task.assignedStaffId}
                      onChange={(e) => handleReassignWorker(task.id, e.target.value)}
                      className="px-2.5 py-1 text-xs bg-slate-50 hover:bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500/20"
                      title="Reassign to worker profile"
                    >
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.department.split(' ')[0]})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Add Task Modal with Detailed Worker Profile Selection */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Assign Operations Task to Worker Profile</h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Confirm VIP dietary protocol with head chef"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Description</label>
                <textarea
                  rows={2}
                  placeholder="Operational context, voucher numbers, special notes..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              {/* Worker Profile Selection with Skills & Workload info */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">
                  Assign to Worker Profile
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                  {staff.map((worker) => {
                    const isSelected = newTask.assignedStaffId === worker.id;
                    const activeCount = tasks.filter(
                      (t) => t.assignedStaffId === worker.id && t.status !== 'Completed'
                    ).length;

                    return (
                      <div
                        key={worker.id}
                        onClick={() => setNewTask({ ...newTask, assignedStaffId: worker.id })}
                        className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center space-x-2.5 ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-400'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {worker.avatar && worker.avatar.trim() ? (
                          <img
                            src={worker.avatar.trim()}
                            alt={worker.name}
                            className="w-9 h-9 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-950 font-black text-xs flex items-center justify-center shrink-0 uppercase">
                            {getInitials(worker.name)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {worker.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {worker.department}
                          </div>
                          <div className="text-[9px] text-amber-800 font-semibold mt-0.5">
                            {activeCount} active tasks
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Category</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="Client Care">Client Care</option>
                    <option value="Vouchers">Vouchers</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Payment">Payment</option>
                    <option value="Supplier">Supplier</option>
                    <option value="Compliance">Compliance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Link to Itinerary Project</label>
                  <select
                    value={newTask.tripId || ''}
                    onChange={(e) => setNewTask({ ...newTask, tripId: e.target.value || undefined })}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="">-- General Operations --</option>
                    {itineraries.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} - {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-1.5">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="emailReminderCheck"
                    checked={newTask.staffEmailReminderEnabled}
                    onChange={(e) => setNewTask({ ...newTask, staffEmailReminderEnabled: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="emailReminderCheck" className="text-xs text-blue-950 font-bold flex items-center gap-1 cursor-pointer">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Send Automated Email Reminder to Staff Member on Due Date</span>
                  </label>
                </div>
                <p className="text-[11px] text-blue-700 pl-5">
                  An email reminder will automatically be dispatched to <strong className="text-blue-950">{staff.find((s) => s.id === newTask.assignedStaffId)?.name}</strong> at <span className="font-mono text-blue-900 underline font-semibold">{staff.find((s) => s.id === newTask.assignedStaffId)?.email}</span> when this task is due ({newTask.dueDate}).
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="reminderCheck"
                  checked={newTask.isReminder}
                  onChange={(e) => setNewTask({ ...newTask, isReminder: e.target.checked })}
                  className="rounded text-amber-600"
                />
                <label htmlFor="reminderCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Enable High-Priority Reminder Alert
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Email Preview & Dispatch Modal */}
      {selectedTaskForEmailPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900">
                    Email Dispatcher
                  </span>
                  <span className="text-xs text-slate-400 font-medium">TourOps 360 Staff Notification</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Preview Due-Date Staff Email Reminder
                </h3>
              </div>
              <button
                onClick={() => setSelectedTaskForEmailPreview(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Header Fields */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="font-bold text-slate-500">From:</span>
                <span className="font-medium text-slate-800">TourOps 360 Automated Task Dispatch &lt;notifications@tourops360.com&gt;</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="font-bold text-slate-500">To:</span>
                <div className="flex items-center space-x-2">
                  {(() => {
                    const recipient = staff.find((s) => s.id === selectedTaskForEmailPreview.assignedStaffId);
                    if (recipient?.avatar && recipient.avatar.trim()) {
                      return (
                        <img
                          src={recipient.avatar.trim()}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      );
                    }
                    return (
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold text-[9px] flex items-center justify-center uppercase">
                        {getInitials(recipient?.name || 'ST')}
                      </div>
                    );
                  })()}
                  <span className="font-bold text-slate-900">
                    {staff.find((s) => s.id === selectedTaskForEmailPreview.assignedStaffId)?.name}
                  </span>
                  <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-bold">
                    {staff.find((s) => s.id === selectedTaskForEmailPreview.assignedStaffId)?.email}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Subject:</span>
                <span className="font-bold text-slate-900 truncate">
                  [Action Required] Task Due: {selectedTaskForEmailPreview.title}
                </span>
              </div>
            </div>

            {/* Email Body Preview */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 text-xs leading-relaxed font-sans">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">
                  Dear {staff.find((s) => s.id === selectedTaskForEmailPreview.assignedStaffId)?.name},
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800">
                  {selectedTaskForEmailPreview.priority} Priority
                </span>
              </div>

              <p className="text-slate-600">
                This is an automated operational reminder from TourOps 360 that the following task is assigned to you and due on <strong className="text-slate-900">{selectedTaskForEmailPreview.dueDate}</strong>:
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">
                  {selectedTaskForEmailPreview.title}
                </div>
                <div className="text-slate-600 text-xs">
                  {selectedTaskForEmailPreview.description || 'No additional notes provided.'}
                </div>
                <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-500">
                  <span>Category: <strong>{selectedTaskForEmailPreview.category}</strong></span>
                  {selectedTaskForEmailPreview.tripId && (
                    <span>&bull; Project: <strong>{itineraries.find((t) => t.id === selectedTaskForEmailPreview.tripId)?.code}</strong></span>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Please review and fulfill this operational task, then update its status to Complete in the TourOps 360 console.
              </p>
            </div>

            {/* Dispatch Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Reminder Status: <strong className="text-slate-700">{selectedTaskForEmailPreview.staffEmailReminderStatus || 'Scheduled'}</strong>
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForEmailPreview(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSendStaffEmail(selectedTaskForEmailPreview)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email Reminder Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW STAFF MEMBER MODAL */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                    Add Operations Staff Member
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Register a new worker profile for task allocation and reminders
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveStaff} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {staffError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{staffError}</span>
                  </div>
                )}

                {/* Avatar Picker (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">
                      Profile Avatar (Optional)
                    </label>
                    <span className="text-[10px] text-slate-400">Not required &bull; Initials used if blank</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {newStaffAvatar && newStaffAvatar.trim() ? (
                      <img
                        src={newStaffAvatar.trim()}
                        alt="Selected avatar"
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-500 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 uppercase shadow-2xs">
                        {newStaffName.trim() ? getInitials(newStaffName) : <User className="w-5 h-5 text-slate-900" />}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setNewStaffAvatar('')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            !newStaffAvatar
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          No Avatar (Initials)
                        </button>
                        {CURATED_STAFF_AVATARS.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewStaffAvatar(url)}
                            className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                              newStaffAvatar === url
                                ? 'border-amber-500 ring-2 ring-amber-300 scale-105'
                                : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={url} alt={`Avatar option ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Optional image URL (leave empty for initials)..."
                        value={newStaffAvatar}
                        onChange={(e) => setNewStaffAvatar(e.target.value)}
                        className="w-full mt-1.5 px-2 py-1 text-[10px] border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Elena Vance"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Role / Job Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. VIP Tour Director"
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                    Department *
                  </label>
                  <select
                    value={newStaffDepartment}
                    onChange={(e) => setNewStaffDepartment(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white outline-none"
                  >
                    <option value="Tour Directing">Tour Directing</option>
                    <option value="Logistics & Dispatch">Logistics &amp; Dispatch</option>
                    <option value="Finance & Invoicing">Finance &amp; Invoicing</option>
                    <option value="Supplier Relations">Supplier Relations</option>
                    <option value="Executive Management">Executive Management</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. elena@tourops360.com"
                      value={newStaffEmail}
                      onChange={(e) => {
                        setNewStaffEmail(e.target.value);
                        if (!newStaffUsername && e.target.value.includes('@')) {
                          setNewStaffUsername(e.target.value.split('@')[0].toLowerCase());
                        }
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +972-54-889-2233"
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* LOGIN & PASSWORD CONFIGURATION SECTION */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      <span>Login &amp; Password Access</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                      Admin: Joshua Koonin
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                        Username / Handle *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={newStaffName ? newStaffName.toLowerCase().replace(/\s+/g, '.') : 'username'}
                        value={newStaffUsername}
                        onChange={(e) => setNewStaffUsername(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase">
                          Password *
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateNewStaffPassword}
                          className="text-[10px] text-amber-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Generate Strong</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showNewStaffPassword ? 'text' : 'password'}
                          required
                          value={newStaffPassword}
                          onChange={(e) => setNewStaffPassword(e.target.value)}
                          className="w-full px-3 py-1.5 pr-8 text-xs bg-white border border-amber-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500/20 outline-none"
                          placeholder="Password123!"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewStaffPassword(!showNewStaffPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showNewStaffPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newStaffIsApproved}
                        onChange={(e) => setNewStaffIsApproved(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Approved Staff Member (Authorize immediate login access)</span>
                    </label>
                  </div>

                  {/* Financial View Option */}
                  <div className="pt-2 border-t border-amber-200/60">
                    <label className="text-[10px] font-extrabold text-amber-950 uppercase tracking-wider block mb-1">
                      Financial Access Permission
                    </label>
                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800">
                        <input
                          type="radio"
                          name="newStaffFinancialView"
                          value="full"
                          checked={newStaffFinancialView === 'full'}
                          onChange={() => setNewStaffFinancialView('full')}
                          className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                        />
                        <span>Full financial view</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800">
                        <input
                          type="radio"
                          name="newStaffFinancialView"
                          value="restricted"
                          checked={newStaffFinancialView === 'restricted'}
                          onChange={() => setNewStaffFinancialView('restricted')}
                          className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                        />
                        <span>Restricted financial view</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                    Key Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VIP Protocol, Hebrew Fluency, Crisis Logistics"
                    value={newStaffSkills}
                    onChange={(e) => setNewStaffSkills(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                    Bio / Experience Summary
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief background and operational strengths..."
                    value={newStaffBio}
                    onChange={(e) => setNewStaffBio(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white outline-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Staff Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE STAFF MEMBER MODAL */}
      {staffToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Delete Staff Member?
                </h3>
                <p className="text-[11px] text-slate-500">
                  This action removes this profile from operations
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
              {staffToDelete.avatar && staffToDelete.avatar.trim() ? (
                <img
                  src={staffToDelete.avatar.trim()}
                  alt={staffToDelete.name}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-200 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 uppercase ring-2 ring-slate-200">
                  {getInitials(staffToDelete.name)}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-extrabold text-xs text-slate-900 truncate">
                  {staffToDelete.name}
                </div>
                <div className="text-[11px] text-slate-600 truncate">
                  {staffToDelete.role} &bull; {staffToDelete.department}
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate">
                  {staffToDelete.email}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-snug">
              Are you sure you want to delete <strong className="text-slate-900">{staffToDelete.name}</strong>? Any active tasks assigned to this employee will automatically be unassigned.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStaff}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Staff Member</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAFF CREDENTIALS & ACCESS GOVERNANCE MODAL */}
      <StaffCredentialsModal
        isOpen={isCredentialsModalOpen}
        onClose={() => {
          setIsCredentialsModalOpen(false);
          setCredentialsTargetStaff(null);
        }}
        targetStaffMember={credentialsTargetStaff}
      />
    </div>
  );
};
