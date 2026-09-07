/**
 * HelpDesk Lite - Smart UI Helpers & SLA Calculation Engine
 */

import { Ticket, TicketStatus, TicketPriority, User, UserRole } from '../types/ticket';

export type QueueViewPreset = 'ALL' | 'MY_TICKETS' | 'UNASSIGNED' | 'URGENT';

export interface SlaCalculation {
  isClosedOrResolved: boolean;
  isBreached: boolean;
  isNearBreach: boolean;
  label: string;
  shortLabel: string;
  badgeClass: string;
  progressPercent: number; // 0 to 100
}

/**
 * Calculates humanized SLA countdown, elapsed percentage, and urgency badge
 */
export function getSlaCalculation(ticket: Ticket): SlaCalculation {
  const now = Date.now();
  const created = new Date(ticket.createdAt).getTime();
  const due = new Date(ticket.slaDueAt).getTime();
  const isClosedOrResolved =
    ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED;

  const totalWindow = Math.max(due - created, 1);
  const elapsed = Math.max(now - created, 0);
  const progressPercent = Math.min(Math.round((elapsed / totalWindow) * 100), 100);

  if (isClosedOrResolved) {
    const resolvedTime = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : now;
    const wasBreached = resolvedTime > due;

    return {
      isClosedOrResolved: true,
      isBreached: wasBreached,
      isNearBreach: false,
      label: wasBreached ? 'Resolved (SLA Breached)' : 'Resolved within SLA',
      shortLabel: wasBreached ? 'Breached' : 'SLA Met',
      badgeClass: wasBreached
        ? 'bg-rose-50 text-rose-700 border-rose-200/60'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      progressPercent: wasBreached ? 100 : Math.min(Math.round(((resolvedTime - created) / totalWindow) * 100), 100),
    };
  }

  const remainingMs = due - now;

  if (remainingMs <= 0) {
    const overdueMs = Math.abs(remainingMs);
    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
    const overdueMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));

    const timeStr = overdueHours > 0 ? `${overdueHours}h ${overdueMinutes}m` : `${overdueMinutes}m`;

    return {
      isClosedOrResolved: false,
      isBreached: true,
      isNearBreach: true,
      label: `Overdue by ${timeStr}`,
      shortLabel: `-${timeStr}`,
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold animate-pulse',
      progressPercent: 100,
    };
  }

  // Still active within SLA window
  const hoursLeft = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutesLeft = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  let timeStr = '';
  if (hoursLeft >= 24) {
    const days = Math.floor(hoursLeft / 24);
    const remHours = hoursLeft % 24;
    timeStr = `${days}d ${remHours}h left`;
  } else if (hoursLeft > 0) {
    timeStr = `${hoursLeft}h ${minutesLeft}m left`;
  } else {
    timeStr = `${minutesLeft}m left`;
  }

  const isNearBreach = remainingMs < 4 * 60 * 60 * 1000; // Under 4 hours

  return {
    isClosedOrResolved: false,
    isBreached: false,
    isNearBreach,
    label: `Due in ${timeStr}`,
    shortLabel: timeStr,
    badgeClass: isNearBreach
      ? 'bg-amber-50 text-amber-800 border border-amber-200/70'
      : 'bg-slate-100 text-slate-600 border border-slate-200/60',
    progressPercent,
  };
}

/**
 * Filter tickets according to smart queue preset view
 */
export function filterByQueuePreset(
  tickets: Ticket[],
  preset: QueueViewPreset,
  currentUser: User
): Ticket[] {
  switch (preset) {
    case 'MY_TICKETS':
      if (currentUser.role === UserRole.REQUESTER) {
        return tickets.filter(
          (t) =>
            t.requesterId === currentUser.id ||
            t.requesterEmail.toLowerCase() === currentUser.email.toLowerCase()
        );
      }
      return tickets.filter((t) => t.assignedToId === currentUser.id);

    case 'UNASSIGNED':
      return tickets.filter(
        (t) => t.status === TicketStatus.NEW || (!t.assignedToId && t.status !== TicketStatus.CLOSED)
      );

    case 'URGENT':
      return tickets.filter((t) => {
        const isCritical = t.priority === TicketPriority.CRITICAL || (t.priority as string) === 'URGENT';
        const isOverdue =
          t.status !== TicketStatus.RESOLVED &&
          t.status !== TicketStatus.CLOSED &&
          new Date(t.slaDueAt).getTime() < Date.now();
        return isCritical || isOverdue;
      });

    case 'ALL':
    default:
      return tickets;
  }
}

/**
 * Common quick canned responses for high productivity communication
 */
export const QUICK_STAFF_REPLIES = [
  'Investigating application & server diagnostic logs now.',
  'Could you share a screenshot or screen recording of the error?',
  'Hotfix deployed. Please sign out and sign back in to verify.',
  'Issue resolved and verified against system SLA requirements.',
  'Escalated to network infrastructure team for routing inspection.',
];

export const QUICK_REQUESTER_REPLIES = [
  'Still experiencing the issue on my workstation.',
  'Issue appears to be fixed now, thank you for the quick help!',
  'Attached the requested log files and screenshots.',
  'Available for a quick screen share if needed.',
];
