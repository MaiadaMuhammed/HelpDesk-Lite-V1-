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
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold tracking-wider text-slate-500 uppercase">
            HDL-06 Finite State Machine (5-State FSM)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict sequential lifecycle with single ownership and terminal lock
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Current State:</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-xs">
            {currentStatus}
          </span>
        </div>
      </div>

      {/* Stepper Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {STATES_ORDER.map((item, idx) => {
          const Icon = item.icon;
          const isCurrent = item.status === currentStatus;
          const isPast = idx < currentIndex && currentStatus !== TicketStatus.CLOSED;
          const isAllowedNext = allowedNextStates.includes(item.status);

          return (
            <div
              key={item.status}
              id={`state-step-${item.status.toLowerCase()}`}
              className={`relative rounded-lg p-3.5 border transition-all ${
                isCurrent
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                  : isAllowedNext
                  ? 'border-emerald-400 bg-emerald-50/40 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer'
                  : isPast
                  ? 'border-slate-200 bg-slate-50 text-slate-500'
                  : 'border-slate-200 bg-white text-slate-400 opacity-75'
              }`}
              onClick={() => {
                if (isAllowedNext && !disabled) {
                  onTransition(item.status);
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isCurrent
                        ? 'bg-indigo-600 text-white'
                        : isPast
                        ? 'bg-slate-200 text-slate-700'
                        : isAllowedNext
                        ? 'bg-emerald-600 text-white animate-pulse'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      {item.label}
                      <Icon className="w-3.5 h-3.5 inline text-slate-500" />
                    </div>
                    <div className="text-[10px] text-slate-500">{item.sub}</div>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                {isCurrent && (
                  <span className="inline-flex items-center text-[11px] font-medium text-indigo-700">
                    Active State
                  </span>
                )}
                {isAllowedNext && (
                  <button
                    type="button"
                    disabled={disabled}
                    className="w-full mt-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded flex items-center justify-center gap-1 shadow-xs transition-colors"
                  >
                    <span>Transition</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {!isCurrent && !isAllowedNext && (
                  <span className="text-[10px] text-slate-400">
                    {idx < currentIndex ? 'Completed' : 'Locked'}
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
