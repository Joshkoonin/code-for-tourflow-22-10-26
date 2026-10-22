import React, { useState } from 'react';
import {
  Calendar,
  CheckSquare,
  DollarSign,
  PieChart,
  Users,
  Compass,
  AlertTriangle,
  Building2,
  Receipt,
  Globe,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Share2,
  FileText,
  Briefcase,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GenerateClientLinkModal } from '../itinerary/GenerateClientLinkModal';

export const Navbar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    conflicts,
    tasks,
    itineraries,
    passports,
    activityCatalog,
    supplierInvoices,
    openClientPortal,
    resetToDefaults,
    companyLogo,
  } = useApp();

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const urgentTasksCount = tasks.filter(
    (t) => t.status !== 'Completed' && (t.priority === 'Urgent' || t.priority === 'High')
  ).length;

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: PieChart },
    { id: 'tours-calendar', label: 'Tours Calendar', icon: Calendar, count: itineraries.length },
    { id: 'itineraries', label: 'Itineraries & Trips', icon: Compass, count: itineraries.length },
    { id: 'tour-management', label: 'Tour Management Hub', icon: Briefcase, count: itineraries.length },
    { id: 'tour-gross-profit', label: 'Gross Profit per Tour', icon: TrendingUp },
    { id: 'passports', label: 'Tour Passports', icon: FileText, count: passports.length },
    { id: 'activities', label: 'Activities Library', icon: Sparkles, count: activityCatalog.length },
    { id: 'tasks', label: 'Staff, Tasks & Reminders', icon: CheckSquare, badge: urgentTasksCount > 0 ? urgentTasksCount : undefined, badgeColor: 'bg-amber-500' },
    { id: 'invoicing', label: 'Client Invoices', icon: DollarSign },
    { id: 'supplier-invoices', label: 'Supplier Invoices', icon: Receipt, count: supplierInvoices.length },
    { id: 'expenses', label: 'Expense Tracking & Profit', icon: Receipt },
    { id: 'pnl-reports', label: 'Multi-Period P&L Reports', icon: BarChart3 },
    { id: 'crm', label: 'Client CRM & History', icon: Users },
    { id: 'suppliers', label: 'Suppliers & Bookings', icon: Building2 },
    { id: 'conflicts', label: 'Clash & Conflict Hub', icon: AlertTriangle, badge: conflicts.length > 0 ? conflicts.length : undefined, badgeColor: 'bg-red-500' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800 shadow-xl select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          {companyLogo ? (
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10 overflow-hidden">
              <img
                src={companyLogo}
                alt="Company Logo"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Globe className="w-6 h-6 text-slate-950 stroke-[2.2]" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 truncate">
              TourOps <span className="text-amber-400 font-serif italic text-sm">360</span>
            </div>
            <div className="text-[11px] font-medium text-slate-400 truncate">Tourism Workflow OS</div>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Workflows
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400 group-hover:text-amber-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-full text-white ${item.badgeColor} animate-pulse`}
                >
                  {item.badge}
                </span>
              )}
              {item.count !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-5 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Live Client Portal
        </div>
        <div className="space-y-1.5">
          <button
            onClick={() => setIsLinkModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-amber-400 bg-slate-900 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-850 transition-all group"
            title="Generate live sharable link with real-time updates and QR code"
          >
            <div className="flex items-center space-x-2.5">
              <Share2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Generate Share Link</span>
            </div>
            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
              Link
            </span>
          </button>
          <button
            onClick={() => openClientPortal('trip-1')}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800 transition-all group"
          >
            <div className="flex items-center space-x-2.5">
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
              <span>Open Live View</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
              Live
            </span>
          </button>
        </div>
      </nav>

      {/* Generate Live Client Link Modal */}
      <GenerateClientLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
      />

      {/* System Footer info */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/50">
        <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between">
          <div className="text-xs">
            <div className="text-slate-300 font-medium">Demo Data</div>
            <div className="text-[10px] text-slate-400">Holy Land & Amalfi Tours</div>
          </div>
          <button
            onClick={resetToDefaults}
            title="Reset to initial sample tour data"
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
