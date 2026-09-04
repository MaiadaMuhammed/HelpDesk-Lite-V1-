/**
 * HelpDesk Lite (V1 MVP)
 * HDL-06: Ticket State Machine & Lifecycle Engine
 */

import {
  Ticket,
  TicketStatus,
  User,
  UserRole,
  AuditAction,
  AuditLogEntry,
  InvalidStateTransitionError,
  UnauthorizedStateTransitionError,
  MissingAssigneeError,
  ImmutableStateError,
} from '../types/ticket';

/**
 * State Transition Rule definition
 */
export interface StateTransitionRule {
  from: TicketStatus;
  to: TicketStatus;
  allowedRoles: UserRole[];
  requiresAssignee: boolean;
  description: string;
}

/**
 * Transition Table: Explicit allowed state transitions and their authorization rules
 */
export const ALLOWED_TRANSITIONS: readonly StateTransitionRule[] = [
  // 1. Triage & Assignment: NEW -> ASSIGNED
  {
    from: TicketStatus.NEW,
    to: TicketStatus.ASSIGNED,
    allowedRoles: [UserRole.AGENT, UserRole.MANAGER, UserRole.SYSTEM],
    requiresAssignee: true,
    description: 'Assign single agent ownership from the triage queue',
  },
  // 2. Unassign back to pool: ASSIGNED -> NEW
  {
    from: TicketStatus.ASSIGNED,
    to: TicketStatus.NEW,
    allowedRoles: [UserRole.AGENT, UserRole.MANAGER],
    requiresAssignee: false,
    description: 'Release ticket back to unassigned queue',
  },
  // 3. Work initiation: ASSIGNED -> IN_PROGRESS
  {
    from: TicketStatus.ASSIGNED,
    to: TicketStatus.IN_PROGRESS,
    allowedRoles: [UserRole.AGENT, UserRole.MANAGER],
    requiresAssignee: true,
    description: 'Begin active investigation and engineering work',
  },
  // 4. Work pause / reassignment: IN_PROGRESS -> ASSIGNED
  {
    from: TicketStatus.IN_PROGRESS,
    to: TicketStatus.ASSIGNED,
    allowedRoles: [UserRole.AGENT, UserRole.MANAGER],
    requiresAssignee: true,
    description: 'Halt active work and return to agent assignment queue',
  },
  // 5. Resolution: IN_PROGRESS -> RESOLVED
  {
    from: TicketStatus.IN_PROGRESS,
    to: TicketStatus.RESOLVED,
    allowedRoles: [UserRole.AGENT, UserRole.MANAGER],
    requiresAssignee: true,
    description: 'Provide solution and mark ticket as resolved',
  },
  // 6. Reopen: RESOLVED -> IN_PROGRESS
  {
    from: TicketStatus.RESOLVED,
    to: TicketStatus.IN_PROGRESS,
    allowedRoles: [UserRole.REQUESTER, UserRole.MANAGER, UserRole.AGENT],
    requiresAssignee: true,
    description: 'Reopen ticket if issue recurs or requester rejects resolution',
  },
  // 7. Final Closure: RESOLVED -> CLOSED
  {
    from: TicketStatus.RESOLVED,
    to: TicketStatus.CLOSED,
    allowedRoles: [UserRole.REQUESTER, UserRole.MANAGER, UserRole.SYSTEM],
    requiresAssignee: false,
    description: 'Finalize and close resolved ticket into permanent terminal state',
  },
];

/**
 * Options for transitioning state
 */
export interface TransitionOptions {
  reason?: string;
  newAssignee?: {
    id: string;
    name: string;
  } | null;
  metadata?: Record<string, unknown>;
  timestamp?: string; // Optional custom timestamp (defaults to ISO now)
}

/**
 * Result returned by transitionTicketState
 */
export interface TransitionResult {
  ticket: Ticket;
  auditEntry: AuditLogEntry;
}

/**
 * Lookup matching rule for a specific transition
 */
export function findTransitionRule(
  from: TicketStatus,
  to: TicketStatus
): StateTransitionRule | undefined {
  return ALLOWED_TRANSITIONS.find(
    (rule) => rule.from === from && rule.to === to
  );
}

/**
 * Check if a state transition is theoretically allowed
 */
export function isAllowedTransition(from: TicketStatus, to: TicketStatus): boolean {
  if (from === TicketStatus.CLOSED) {
    return false;
  }
  return ALLOWED_TRANSITIONS.some((r) => r.from === from && r.to === to);
}

/**
 * Get all available next target states from a current state
 */
export function getAvailableNextStates(
  currentStatus: TicketStatus,
  actorRole?: UserRole
): TicketStatus[] {
  if (currentStatus === TicketStatus.CLOSED) {
    return [];
  }

  const rules = ALLOWED_TRANSITIONS.filter((r) => r.from === currentStatus);
  if (!actorRole) {
    return rules.map((r) => r.to);
  }

  return rules
    .filter((r) => r.allowedRoles.includes(actorRole))
    .map((r) => r.to);
}

/**
 * Validates whether a state transition can take place.
 * Throws specific domain LifecycleError subclasses if validation fails.
 */
export function validateStateTransition(
  ticket: Ticket,
  targetStatus: TicketStatus,
  actor: User,
  options?: TransitionOptions
): StateTransitionRule {
  // Rule 1: Terminal State Immutability
  if (ticket.status === TicketStatus.CLOSED) {
    throw new ImmutableStateError(TicketStatus.CLOSED);
  }

  // Rule 2: Self-transition is a no-op / invalid
  if (ticket.status === targetStatus) {
    throw new InvalidStateTransitionError(
      ticket.status,
      targetStatus,
      `Ticket is already in state '${targetStatus}'.`
    );
  }

  // Rule 3: Check allowed transition in state machine graph
  const rule = findTransitionRule(ticket.status, targetStatus);
  if (!rule) {
    throw new InvalidStateTransitionError(ticket.status, targetStatus);
  }

  // Rule 4: Role Authorization Check
  if (!rule.allowedRoles.includes(actor.role)) {
    throw new UnauthorizedStateTransitionError(actor.role, ticket.status, targetStatus);
  }

  // Rule 5: Single Ownership / Assignee Enforcement
  const willHaveAssignee = options?.newAssignee !== undefined
    ? options.newAssignee !== null
    : ticket.assignedToId !== null;

  if (rule.requiresAssignee && !willHaveAssignee) {
    throw new MissingAssigneeError(targetStatus);
  }

  return rule;
}

/**
 * Core State Machine Transition Function
 * Pure, immutable execution of ticket lifecycle state change.
 * Appends audit logging metadata and maintains single-ownership invariants.
 */
export function transitionTicketState(
  ticket: Ticket,
  targetStatus: TicketStatus,
  actor: User,
  options: TransitionOptions = {}
): TransitionResult {
  // 1. Run strict validation
  const rule = validateStateTransition(ticket, targetStatus, actor, options);

  const now = options.timestamp || new Date().toISOString();
  const previousStatus = ticket.status;

  // 2. Determine updated assignee
  let assignedToId = ticket.assignedToId;
  let assignedToName = ticket.assignedToName;

  if (options.newAssignee !== undefined) {
    assignedToId = options.newAssignee ? options.newAssignee.id : null;
    assignedToName = options.newAssignee ? options.newAssignee.name : null;
  } else if (targetStatus === TicketStatus.NEW) {
    // Releasing to NEW resets assignee
    assignedToId = null;
    assignedToName = null;
  } else if (targetStatus === TicketStatus.ASSIGNED && !assignedToId && actor.role === UserRole.AGENT) {
    // Agent self-assigning when moving from NEW -> ASSIGNED
    assignedToId = actor.id;
    assignedToName = actor.name;
  }

  // Double check assignee rule with newly derived assignee
  if (rule.requiresAssignee && !assignedToId) {
    throw new MissingAssigneeError(targetStatus);
  }

  // 3. Construct append-only AuditLogEntry
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const auditEntry: AuditLogEntry = {
    id: auditId,
    ticketId: ticket.id,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: AuditAction.STATE_TRANSITION,
    fromState: previousStatus,
    toState: targetStatus,
    reason: options.reason || `Transitioned from ${previousStatus} to ${targetStatus}`,
    metadata: {
      ruleDescription: rule.description,
      previousAssigneeId: ticket.assignedToId,
      newAssigneeId: assignedToId,
      ...options.metadata,
    },
    timestamp: now,
  };

  // 4. Update status-specific timestamp flags
  let resolvedAt = ticket.resolvedAt;
  let closedAt = ticket.closedAt;

  if (targetStatus === TicketStatus.RESOLVED) {
    resolvedAt = now;
  } else if (targetStatus === TicketStatus.IN_PROGRESS && previousStatus === TicketStatus.RESOLVED) {
    // Reopened ticket clears resolvedAt until re-resolved
    resolvedAt = null;
  }

  if (targetStatus === TicketStatus.CLOSED) {
    closedAt = now;
  }

  // 5. Return updated immutable Ticket entity
  const updatedTicket: Ticket = {
    ...ticket,
    status: targetStatus,
    assignedToId,
    assignedToName,
    resolvedAt,
    closedAt,
    updatedAt: now,
    auditLogs: [...ticket.auditLogs, auditEntry],
  };

  return {
    ticket: updatedTicket,
    auditEntry,
  };
}

/**
 * Assigns or reassigns a single agent to a ticket with append-only audit trail
 */
export function assignTicket(
  ticket: Ticket,
  assignee: { id: string; name: string } | null,
  actor: User,
  reason?: string
): TransitionResult {
  if (ticket.status === TicketStatus.CLOSED) {
    throw new ImmutableStateError(TicketStatus.CLOSED);
  }

  if (actor.role !== UserRole.MANAGER && actor.role !== UserRole.AGENT) {
    throw new UnauthorizedStateTransitionError(
      actor.role,
      ticket.status,
      ticket.status
    );
  }

  const now = new Date().toISOString();
  const previousAssigneeId = ticket.assignedToId;
  const previousAssigneeName = ticket.assignedToName;

  // If ticket was NEW and is being assigned, promote to ASSIGNED
  let targetStatus = ticket.status;
  if (ticket.status === TicketStatus.NEW && assignee) {
    targetStatus = TicketStatus.ASSIGNED;
  } else if (!assignee && (ticket.status === TicketStatus.ASSIGNED)) {
    targetStatus = TicketStatus.NEW;
  }

  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const auditEntry: AuditLogEntry = {
    id: auditId,
    ticketId: ticket.id,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: AuditAction.ASSIGNMENT_CHANGE,
    fromState: ticket.status,
    toState: targetStatus,
    reason: reason || (assignee ? `Assigned to ${assignee.name}` : 'Unassigned back to queue'),
    metadata: {
      previousAssigneeId,
      previousAssigneeName,
      newAssigneeId: assignee?.id ?? null,
      newAssigneeName: assignee?.name ?? null,
    },
    timestamp: now,
  };

  const updatedTicket: Ticket = {
    ...ticket,
    status: targetStatus,
    assignedToId: assignee?.id ?? null,
    assignedToName: assignee?.name ?? null,
    updatedAt: now,
    auditLogs: [...ticket.auditLogs, auditEntry],
  };

  return {
    ticket: updatedTicket,
    auditEntry,
  };
}
