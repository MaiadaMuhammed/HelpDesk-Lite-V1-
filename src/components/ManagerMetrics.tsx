/**
 * HelpDesk Lite (V1 MVP)
 * Manager Dashboard Live Metric Cards:
 * - Unassigned counts
 * - Overdue breaches
 * - FRT (First Response Time)
 */

import React from 'react';
import { Ticket, TicketStatus } from '../types/ticket';
import { Inbox, AlertTriangle, Timer, CheckCircle2 } from 'lucide-react';

interface ManagerMetricsProps {
  tickets: Ticket[];
}

export const ManagerMetrics: React.FC<ManagerMetricsProps> = ({ tickets }) => {
  // 1. Unassigned count: status === NEW or (assignedToId === null && status !== CLOSED)
  const unassignedCount = tickets.filter(
    (t) => t.status === TicketStatus.NEW || (!t.assignedToId && t.status !== TicketStatus.CLOSED)
  ).length;

  // 2. Overdue breaches: now > slaDueAt and status is not RESOLVED or CLOSED
  const now = new Date();
  const overdueBreaches = tickets.filter((t) => {
    if (t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED) {
      return false;
    }
    return new Date(t.slaDueAt).getTime() < now.getTime();
  }).length;

  // 3. First Response Time (FRT) calculation
  const ticketsWithFRT = tickets.filter((t) => t.firstResponseAt !== null);
  const avgFRTMinutes =
    ticketsWithFRT.length > 0
      ? Math.round(
          ticketsWithFRT.reduce((acc, t) => {
            const created = new Date(t.createdAt).getTime();
            const first = new Date(t.firstResponseAt!).getTime();
            return acc + (first - created) / (1000 * 60);
          }, 0) / ticketsWithFRT.length
        )
      : 24;

  const activeTotal = tickets.filter(
    (t) => t.status !== TicketStatus.CLOSED
  ).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Metric 1: Unassigned Queue */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Unassigned
          </span>
          <Inbox className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-semibold text-slate-900 tracking-tight mt-1.5">
          {unassignedCount}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Awaiting agent claim</span>
        </div>
      </div>

      {/* Metric 2: Overdue SLA Breaches */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Overdue SLA
          </span>
          <AlertTriangle className="w-4 h-4 text-rose-500" />
        </div>
        <div className={`text-2xl font-semibold tracking-tight mt-1.5 ${overdueBreaches > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
          {overdueBreaches}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${overdueBreaches > 0 ? 'bg-rose-500' : 'bg-emerald-400'}`} />
          <span>{overdueBreaches > 0 ? 'Target exceeded' : 'Within SLA target'}</span>
        </div>
      </div>

      {/* Metric 3: First Response Time */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Avg Response
          </span>
          <Timer className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-semibold text-slate-900 tracking-tight mt-1.5">
          {avgFRTMinutes} <span className="text-xs font-normal text-slate-500">min</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Benchmark &lt; 45m</span>
        </div>
      </div>

      {/* Metric 4: Active Volume */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Active Tickets
          </span>
          <CheckCircle2 className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-semibold text-slate-900 tracking-tight mt-1.5">
          {activeTotal}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Queue in progress</span>
        </div>
      </div>
    </div>
  );
};

