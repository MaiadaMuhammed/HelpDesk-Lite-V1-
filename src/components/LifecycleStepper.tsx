/**
 * HelpDesk Lite (V1 MVP)
 * Visual 5-State Finite State Machine Stepper & Transition Controller
 */

import React from 'react';
import { TicketStatus, UserRole } from '../types/ticket';
import { CheckCircle2, Clock, PlayCircle, ShieldCheck, Lock, ArrowRight } from 'lucide-react';

interface LifecycleStepperProps {
  currentStatus: TicketStatus;
  allowedNextStates: TicketStatus[];
  userRole: UserRole;
  onTransition: (target: TicketStatus) => void;
  disabled?: boolean;
}

const STATES_ORDER = [
  {
    status: TicketStatus.NEW,
    label: 'New',
    sub: 'Triage Queue',
    icon: Clock,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    status: TicketStatus.ASSIGNED,
    label: 'Assigned',
    sub: 'Single Agent Claimed',
    icon: CheckCircle2,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    status: TicketStatus.IN_PROGRESS,
    label: 'In Progress',
    sub: 'Active Investigation',
    icon: PlayCircle,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    status: TicketStatus.RESOLVED,
    label: 'Resolved',
    sub: 'Solution Provided',
    icon: ShieldCheck,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    status: TicketStatus.CLOSED,
    label: 'Closed',
    sub: 'Terminal State',
    icon: Lock,
    badgeColor: 'bg-slate-200 text-slate-800 border-slate-400',
  },
];

export const LifecycleStepper: React.FC<LifecycleStepperProps> = ({
  currentStatus,
  allowedNextStates,
  onTransition,
  disabled = false,
}) => {
  const currentIndex = STATES_ORDER.findIndex((s) => s.status === currentStatus);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Lifecycle Sequence
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500">
            5-State Finite State Machine
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Current:</span>
          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-900 text-white">
            {currentStatus}
          </span>
        </div>
      </div>

      {/* Stepper Pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {STATES_ORDER.map((item, idx) => {
          const Icon = item.icon;
          const isCurrent = item.status === currentStatus;
          const isPast = idx < currentIndex && currentStatus !== TicketStatus.CLOSED;
          const isAllowedNext = allowedNextStates.includes(item.status);

          return (
            <div
              key={item.status}
              id={`state-step-${item.status.toLowerCase()}`}
              className={`rounded-lg p-2.5 border transition-colors flex flex-col justify-between ${
                isCurrent
                  ? 'border-slate-900 bg-slate-50/80'
                  : isAllowedNext
                  ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-500 hover:bg-emerald-50/60 cursor-pointer'
                  : isPast
                  ? 'border-slate-200/80 bg-slate-50/40 text-slate-600'
                  : 'border-slate-200/50 bg-white text-slate-400 opacity-60'
              }`}
              onClick={() => {
                if (isAllowedNext && !disabled) {
                  onTransition(item.status);
                }
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                      isCurrent
                        ? 'bg-slate-900 text-white'
                        : isPast
                        ? 'bg-slate-200 text-slate-700'
                        : isAllowedNext
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-slate-900' : 'text-slate-400'}`} />
                </div>
                <div className="text-xs font-semibold text-slate-900">
                  {item.label}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {item.sub}
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100">
                {isCurrent && (
                  <span className="text-[10px] font-medium text-indigo-600">
                    Active
                  </span>
                )}
                {isAllowedNext && (
                  <button
                    type="button"
                    disabled={disabled}
                    className="w-full py-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-medium rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Transition</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                )}
                {!isCurrent && !isAllowedNext && (
                  <span className="text-[10px] text-slate-400">
                    {idx < currentIndex ? 'Done' : 'Locked'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
