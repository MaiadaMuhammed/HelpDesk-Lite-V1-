/**
 * HelpDesk Lite (V1 MVP)
 * HDL-06: Ticket State Machine Domain Models & Type Definitions
 */

import { DispatchedNotification } from './notification';
export * from './notification';

export enum TicketStatus {
  NEW = 'NEW',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketCategory {
  IT = 'IT',
  HR = 'HR',
  FACILITIES = 'FACILITIES',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum UserRole {
  REQUESTER = 'REQUESTER',
  AGENT = 'AGENT',
  MANAGER = 'MANAGER',
  SYSTEM = 'SYSTEM',
}

export enum AuditAction {
  TICKET_CREATED = 'TICKET_CREATED',
  STATE_TRANSITION = 'STATE_TRANSITION',
  ASSIGNMENT_CHANGE = 'ASSIGNMENT_CHANGE',
  PUBLIC_REPLY_ADDED = 'PUBLIC_REPLY_ADDED',
  PRIVATE_NOTE_ADDED = 'PRIVATE_NOTE_ADDED',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface TicketAttachment {
  id: string;
  name: string;
  sizeBytes: number; // Max 10MB (10 * 1024 * 1024)
  mimeType: string;
  url: string;
  uploadedAt: string;
}

export interface ActivityMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  isPrivateStaffNote: boolean; // Strict role-based isolation: requesters cannot view private staff notes
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  ticketId: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: AuditAction;
  fromState?: TicketStatus;
  toState?: TicketStatus;
  reason?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  assignedToId: string | null;
  assignedToName: string | null;
  attachments: TicketAttachment[];
  messages: ActivityMessage[];
  auditLogs: AuditLogEntry[];
  notifications?: DispatchedNotification[];
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  slaDueAt: string;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Custom Domain Error Classes
// -----------------------------------------------------------------------------

export class LifecycleError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'LifecycleError';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidStateTransitionError extends LifecycleError {
  public readonly fromState: TicketStatus;
  public readonly toState: TicketStatus;

  constructor(fromState: TicketStatus, toState: TicketStatus, details?: string) {
    const msg = details 
      ? `Illegal state transition from ${fromState} to ${toState}: ${details}`
      : `Illegal state transition: Cannot move ticket from '${fromState}' directly to '${toState}'.`;
    super(msg, 'ERR_INVALID_STATE_TRANSITION');
    this.name = 'InvalidStateTransitionError';
    this.fromState = fromState;
    this.toState = toState;
  }
}

export class UnauthorizedStateTransitionError extends LifecycleError {
  public readonly role: UserRole;
  public readonly fromState: TicketStatus;
  public readonly toState: TicketStatus;

  constructor(role: UserRole, fromState: TicketStatus, toState: TicketStatus) {
    super(
      `User with role '${role}' is not authorized to transition ticket from '${fromState}' to '${toState}'.`,
      'ERR_UNAUTHORIZED_TRANSITION'
    );
    this.name = 'UnauthorizedStateTransitionError';
    this.role = role;
    this.fromState = fromState;
    this.toState = toState;
  }
}

export class MissingAssigneeError extends LifecycleError {
  public readonly targetState: TicketStatus;

  constructor(targetState: TicketStatus) {
    super(
      `Cannot transition ticket to '${targetState}' without an assigned agent. Single ownership must be established.`,
      'ERR_MISSING_ASSIGNEE'
    );
    this.name = 'MissingAssigneeError';
    this.targetState = targetState;
  }
}

export class ImmutableStateError extends LifecycleError {
  public readonly state: TicketStatus;

  constructor(state: TicketStatus = TicketStatus.CLOSED) {
    super(
      `Ticket is in terminal state '${state}' and cannot undergo any further state modifications.`,
      'ERR_IMMUTABLE_TERMINAL_STATE'
    );
    this.name = 'ImmutableStateError';
    this.state = state;
  }
}
