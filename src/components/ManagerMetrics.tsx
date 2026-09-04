/**
 * HelpDesk Lite (V1 MVP)
 * Manager Dashboard Live Metric Cards:
 * - Unassigned counts
 * - Overdue breaches
 * - FRT (First Response Time)
 */

import React from 'react';
import { Ticket, TicketStatus } from '../types/ticket';
import { Inbox, AlertTriangle, Timer, CheckCircle } from 'lucide-react';

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
  // Tickets with firstResponseAt - createdAt in minutes
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
      : 24; // baseline fallback if newly launched

  const activeTotal = tickets.filter(
    (t) => t.status !== TicketStatus.CLOSED
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Unassigned Queue */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Unassigned Triage
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {unassignedCount}
          </div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Awaiting agent claim
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <Inbox className="w-5 h-5" />
        </div>
      </div>

      {/* Metric 2: Overdue SLA Breaches */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Overdue Breaches
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {overdueBreaches}
          </div>
          <div className="text-[11px] text-rose-700 mt-1 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Exceeded SLA target
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* Metric 3: First Response Time */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Avg First Response (FRT)
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {avgFRTMinutes} <span className="text-sm font-semibold text-slate-500">min</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Target: &lt; 45 min
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
          <Timer className="w-5 h-5" />
        </div>
      </div>

      {/* Metric 4: Active Volume */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Active Tickets
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {activeTotal}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
            Across IT, HR, Facilities
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
          <CheckCircle className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
