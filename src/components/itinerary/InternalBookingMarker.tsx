import React from 'react';
import { CheckCircle2, Clock, AlertCircle, User, Calendar, ShieldCheck, ChevronDown } from 'lucide-react';
import { ActivityBookingStatus, StaffMember, Supplier } from '../../types';

export function normalizeBookingStatus(status?: string): 'to be booked' | 'booking requested' | 'confirmed' {
  if (!status) return 'to be booked';
  const s = status.toLowerCase();
  if (s === 'confirmed' || s === 'booked') return 'confirmed';
  if (s === 'booking requested' || s === 'requested') return 'booking requested';
  return 'to be booked';
}

export function getBookingStatusDetails(status?: string) {
  const norm = normalizeBookingStatus(status);
  switch (norm) {
    case 'confirmed':
      return {
        key: 'confirmed' as const,
        label: 'Confirmed',
        tagText: '✓ Confirmed',
        colorName: 'green',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        dotClass: 'bg-emerald-500',
        borderClass: 'border-emerald-300',
        bgSubtle: 'bg-emerald-50/70',
        cardHighlight: 'ring-1 ring-emerald-300 border-emerald-300',
        statusDescription: 'Supplier & Activity officially confirmed and locked in.',
      };
    case 'booking requested':
      return {
        key: 'booking requested' as const,
        label: 'Booking Requested',
        tagText: '⟳ Booking Requested',
        colorName: 'blue',
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
        dotClass: 'bg-blue-500',
        borderClass: 'border-blue-300',
        bgSubtle: 'bg-blue-50/70',
        cardHighlight: 'ring-1 ring-blue-300 border-blue-300',
        statusDescription: 'Request sent to supplier; awaiting confirmation voucher.',
      };
    case 'to be booked':
    default:
      return {
        key: 'to be booked' as const,
        label: 'To Be Booked',
        tagText: '⚠ To Be Booked',
        colorName: 'yellow',
        badgeClass: 'bg-yellow-100 text-yellow-950 border-yellow-300',
        dotClass: 'bg-yellow-500',
        borderClass: 'border-yellow-300',
        bgSubtle: 'bg-yellow-50/70',
        cardHighlight: 'ring-1 ring-yellow-300 border-yellow-300',
        statusDescription: 'Action pending. Needs reservation by assigned staff member.',
      };
  }
}

export function getActivityCardColorClasses(status?: string) {
  const norm = normalizeBookingStatus(status);
  switch (norm) {
    case 'confirmed':
      return {
        cardBg: 'bg-emerald-50/70 hover:bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-300',
        bannerBg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        badge: 'bg-emerald-500 text-white',
        borderAccent: 'border-l-4 border-l-emerald-500',
        dot: 'bg-emerald-500',
        label: 'Confirmed',
        colorName: 'green',
      };
    case 'booking requested':
      return {
        cardBg: 'bg-blue-50/70 hover:bg-blue-50/90 border-blue-300 ring-1 ring-blue-300',
        bannerBg: 'bg-blue-100 text-blue-950 border-blue-300',
        badge: 'bg-blue-500 text-white',
        borderAccent: 'border-l-4 border-l-blue-500',
        dot: 'bg-blue-500',
        label: 'Booking Requested',
        colorName: 'blue',
      };
    case 'to be booked':
    default:
      return {
        cardBg: 'bg-yellow-50/80 hover:bg-yellow-50 border-yellow-300 ring-1 ring-yellow-300',
        bannerBg: 'bg-yellow-100 text-yellow-950 border-yellow-300',
        badge: 'bg-yellow-500 text-slate-950',
        borderAccent: 'border-l-4 border-l-yellow-400',
        dot: 'bg-yellow-500',
        label: 'To Be Booked',
        colorName: 'yellow',
      };
  }
}

interface InternalBookingMarkerProps {
  status?: ActivityBookingStatus;
  assignedStaff?: StaffMember;
  deadline?: string;
  supplier?: Supplier;
  onStatusChange?: (newStatus: 'to be booked' | 'booking requested' | 'confirmed') => void;
  compact?: boolean;
}

export const InternalBookingMarker: React.FC<InternalBookingMarkerProps> = ({
  status,
  assignedStaff,
  deadline,
  supplier,
  onStatusChange,
  compact = false,
}) => {
  const normStatus = normalizeBookingStatus(status);
  const details = getBookingStatusDetails(normStatus);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 select-none">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs ${details.badgeClass}`}
          title={`Internal working marker: ${details.label} (${details.statusDescription})`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${details.dotClass} animate-pulse`} />
          <span>{details.label}</span>
        </span>

        {onStatusChange && (
          <select
            value={normStatus}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              onStatusChange(e.target.value as 'to be booked' | 'booking requested' | 'confirmed')
            }
            className={`text-[10px] font-bold py-0.5 px-1.5 rounded-md border cursor-pointer outline-none bg-white ${details.borderClass}`}
            title="Change internal working booking status"
          >
            <option value="to be booked">Yellow: To Be Booked</option>
            <option value="booking requested">Blue: Booking Requested</option>
            <option value="confirmed">Green: Confirmed</option>
          </select>
        )}

        {assignedStaff && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
            title={`Assigned to book: ${assignedStaff.name} (${assignedStaff.role})`}
          >
            <User className="w-2.5 h-2.5 text-slate-500" />
            <span className="truncate max-w-[90px]">{assignedStaff.name.split(' ')[0]}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors select-none ${details.bgSubtle} ${details.borderClass}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${details.badgeClass}`}
        >
          <span className={`w-2 h-2 rounded-full ${details.dotClass} animate-pulse`} />
          <span>{details.label}</span>
        </span>

        {assignedStaff ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-800 bg-white/90 px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
            {assignedStaff.avatar && assignedStaff.avatar.trim() ? (
              <img
                src={assignedStaff.avatar.trim()}
                alt={assignedStaff.name}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center uppercase">
                {assignedStaff.name ? assignedStaff.name[0] : 'S'}
              </span>
            )}
            <span>Assigned: <strong>{assignedStaff.name}</strong></span>
            <span className="text-[10px] text-slate-400 font-normal">({assignedStaff.department.split(' ')[0]})</span>
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-slate-400 italic">
            Unassigned staff
          </span>
        )}

        {deadline && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-white/70 px-2 py-0.5 rounded-md border border-slate-200">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Target: {deadline}</span>
          </span>
        )}

        {supplier && (
          <span className="text-[10px] font-semibold text-slate-500">
            &bull; Supplier: <strong className="text-slate-800">{supplier.name}</strong>
          </span>
        )}
      </div>

      {onStatusChange && (
        <div className="flex items-center space-x-1 shrink-0 pt-1 sm:pt-0">
          <span className="text-[10px] font-bold uppercase text-slate-500">Working Marker:</span>
          <select
            value={normStatus}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              onStatusChange(e.target.value as 'to be booked' | 'booking requested' | 'confirmed')
            }
            className={`text-xs font-bold py-1 px-2 rounded-lg border cursor-pointer outline-none bg-white shadow-2xs ${details.borderClass}`}
          >
            <option value="to be booked">🟡 To Be Booked</option>
            <option value="booking requested">🔵 Booking Requested</option>
            <option value="confirmed">🟢 Confirmed</option>
          </select>
        </div>
      )}
    </div>
  );
};
