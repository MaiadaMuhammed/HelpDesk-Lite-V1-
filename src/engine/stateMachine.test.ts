/**
 * HelpDesk Lite (V1 MVP)
 * HDL-06: State Machine & Lifecycle Engine Test Suite
 * Covers: Valid transitions, blocked illegal jumps, role authorization, single ownership guards, terminal immutability.
 */

import {
  Ticket,
  TicketStatus,
  TicketCategory,
  TicketPriority,
  User,
  UserRole,
  AuditAction,
  InvalidStateTransitionError,
  UnauthorizedStateTransitionError,
  MissingAssigneeError,
  ImmutableStateError,
} from '../types/ticket';
import {
  transitionTicketState,
  assignTicket,
  getAvailableNextStates,
} from './stateMachine';
import {
  dispatchStatusChangeNotification,
  dispatchAssignmentNotification,
  dispatchNewMessageNotification,
  dispatchManualTestNotification,
} from '../services/notificationService';
import { simulatePollCycle } from '../services/pollingService';
import {
  generateUnifiedHistoryCSV,
  generateActivityThreadCSV,
  generateAuditTrailCSV,
  escapeCSVCell,
  getUnifiedTicketHistory,
} from '../services/csvExportService';
import { NotificationTrigger, DeliveryStatus } from '../types/notification';

// -----------------------------------------------------------------------------
// Test Fixtures
// -----------------------------------------------------------------------------

export const mockRequester: User = {
  id: 'usr_req_01',
  name: 'Sarah Jenkins',
  email: 'sarah.jenkins@company.local',
  role: UserRole.REQUESTER,
};

export const mockAgent: User = {
  id: 'usr_agent_01',
  name: 'Alex Rivera',
  email: 'alex.rivera@company.local',
  role: UserRole.AGENT,
};

export const mockAgentTwo: User = {
  id: 'usr_agent_02',
  name: 'Marcus Vance',
  email: 'marcus.vance@company.local',
  role: UserRole.AGENT,
};

export const mockManager: User = {
  id: 'usr_mgr_01',
  name: 'Elena Rostova',
  email: 'elena.rostova@company.local',
  role: UserRole.MANAGER,
};

export function createMockTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'tkt_test_100',
    title: 'VPN connection dropping intermittently',
    description: 'Every 15 minutes Cisco AnyConnect loses handshake.',
    category: TicketCategory.IT,
    priority: TicketPriority.HIGH,
    status: TicketStatus.NEW,
    requesterId: mockRequester.id,
    requesterName: mockRequester.name,
    requesterEmail: mockRequester.email,
    assignedToId: null,
    assignedToName: null,
    attachments: [],
    messages: [],
    auditLogs: [],
    firstResponseAt: null,
    resolvedAt: null,
    closedAt: null,
    slaDueAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// -----------------------------------------------------------------------------
// Assertions Helper for Universal Environment Execution
// -----------------------------------------------------------------------------

export interface TestCaseResult {
  name: string;
  category: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestCaseResult[];
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function assertThrows<T extends Error>(
  fn: () => void,
  expectedErrorClass: new (...args: any[]) => T,
  expectedCode?: string
): void {
  let thrown = false;
  try {
    fn();
  } catch (err: unknown) {
    thrown = true;
    if (!(err instanceof expectedErrorClass)) {
      throw new Error(
        `Expected error of type ${expectedErrorClass.name}, but caught: ${
          err instanceof Error ? err.name : String(err)
        }`
      );
    }
    if (expectedCode && (err as any).code !== expectedCode) {
      throw new Error(
        `Expected error code '${expectedCode}', but got '${(err as any).code}'`
      );
    }
  }
  if (!thrown) {
    throw new Error(`Expected function to throw ${expectedErrorClass.name}, but no error was thrown.`);
  }
}

// -----------------------------------------------------------------------------
// Test Definition Registry
// -----------------------------------------------------------------------------

interface TestDef {
  category: string;
  name: string;
  fn: () => void;
}

export const TEST_SUITE: TestDef[] = [
  // 1. HAPPY PATH PROGRESSION
  {
    category: 'Happy Path Lifecycle',
    name: 'TC-01: Progresses through full lifecycle NEW -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED',
    fn: () => {
      const ticket = createMockTicket();

      // Step 1: NEW -> ASSIGNED
      const res1 = transitionTicketState(ticket, TicketStatus.ASSIGNED, mockAgent, {
        newAssignee: { id: mockAgent.id, name: mockAgent.name },
      });
      assert(res1.ticket.status === TicketStatus.ASSIGNED, 'Must be ASSIGNED');
      assert(res1.ticket.assignedToId === mockAgent.id, 'Must be assigned to Alex');
      assert(res1.ticket.auditLogs.length === 1, 'Audit log length must be 1');

      // Step 2: ASSIGNED -> IN_PROGRESS
      const res2 = transitionTicketState(res1.ticket, TicketStatus.IN_PROGRESS, mockAgent);
      assert(res2.ticket.status === TicketStatus.IN_PROGRESS, 'Must be IN_PROGRESS');
      assert(res2.ticket.assignedToId === mockAgent.id, 'Assignee must persist');
      assert(res2.ticket.auditLogs.length === 2, 'Audit log length must be 2');

      // Step 3: IN_PROGRESS -> RESOLVED
      const res3 = transitionTicketState(res2.ticket, TicketStatus.RESOLVED, mockAgent, {
        reason: 'Renewed SSL certificate and flushed DNS cache.',
      });
      assert(res3.ticket.status === TicketStatus.RESOLVED, 'Must be RESOLVED');
      assert(res3.ticket.resolvedAt !== null, 'resolvedAt timestamp must be set');
      assert(res3.ticket.auditLogs.length === 3, 'Audit log length must be 3');

      // Step 4: RESOLVED -> CLOSED (Requester approves)
      const res4 = transitionTicketState(res3.ticket, TicketStatus.CLOSED, mockRequester, {
        reason: 'Confirmed VPN works smoothly now.',
      });
      assert(res4.ticket.status === TicketStatus.CLOSED, 'Must be CLOSED');
      assert(res4.ticket.closedAt !== null, 'closedAt timestamp must be set');
      assert(res4.ticket.auditLogs.length === 4, 'Audit log length must be 4');
    },
  },

  // 2. BIDIRECTIONAL LOOPS
  {
    category: 'Bidirectional Loops',
    name: 'TC-02: Allows de-escalation ASSIGNED -> NEW (unassigning to pool)',
    fn: () => {
      const ticket = createMockTicket({
        status: TicketStatus.ASSIGNED,
        assignedToId: mockAgent.id,
        assignedToName: mockAgent.name,
      });

      const res = transitionTicketState(ticket, TicketStatus.NEW, mockManager, {
        reason: 'Agent out sick, returning to triage pool',
      });

      assert(res.ticket.status === TicketStatus.NEW, 'Status must be NEW');
      assert(res.ticket.assignedToId === null, 'Assignee must be reset to null');
      assert(res.ticket.assignedToName === null, 'Assignee name must be null');
    },
  },
  {
    category: 'Bidirectional Loops',
    name: 'TC-03: Allows pausing work IN_PROGRESS -> ASSIGNED',
    fn: () => {
      const ticket = createMockTicket({
        status: TicketStatus.IN_PROGRESS,
        assignedToId: mockAgent.id,
        assignedToName: mockAgent.name,
      });

      const res = transitionTicketState(ticket, TicketStatus.ASSIGNED, mockAgent, {
        reason: 'Awaiting hardware arrival from vendor',
      });

      assert(res.ticket.status === TicketStatus.ASSIGNED, 'Status must be ASSIGNED');
      assert(res.ticket.assignedToId === mockAgent.id, 'Assignee remains assigned');
    },
  },
  {
    category: 'Bidirectional Loops',
    name: 'TC-04: Allows reopening RESOLVED -> IN_PROGRESS by Requester or Manager',
    fn: () => {
      const ticket = createMockTicket({
        status: TicketStatus.RESOLVED,
        assignedToId: mockAgent.id,
        assignedToName: mockAgent.name,
        resolvedAt: new Date().toISOString(),
      });

      const res = transitionTicketState(ticket, TicketStatus.IN_PROGRESS, mockRequester, {
        reason: 'VPN is still dropping when connected through Wi-Fi',
      });

      assert(res.ticket.status === TicketStatus.IN_PROGRESS, 'Status must return to IN_PROGRESS');
      assert(res.ticket.resolvedAt === null, 'resolvedAt timestamp must be reset upon reopen');
      assert(res.ticket.assignedToId === mockAgent.id, 'Assigned agent remains in charge');
    },
  },

  // 3. BLOCKED ILLEGAL STATE JUMPS
  {
    category: 'Illegal State Transitions',
    name: 'TC-05: Blocks illegal skip NEW -> IN_PROGRESS',
    fn: () => {
      const ticket = createMockTicket();
      assertThrows(
        () => transitionTicketState(ticket, TicketStatus.IN_PROGRESS, mockAgent),
        InvalidStateTransitionError,
        'ERR_INVALID_STATE_TRANSITION'
      );
    },
  },
  {
    category: 'Illegal State Transitions',
    name: 'TC-06: Blocks illegal skip NEW -> RESOLVED',
    fn: () => {
      const ticket = createMockTicket();
      assertThrows(
        () => transitionTicketState(ticket, TicketStatus.RESOLVED, mockAgent),
        InvalidStateTransitionError,
        'ERR_INVALID_STATE_TRANSITION'
      );
    },
  },
  {
    category: 'Illegal State Transitions',
    name: 'TC-07: Blocks illegal skip NEW -> CLOSED',
    fn: () => {
      const ticket = createMockTicket();
      assertThrows(
        () => transitionTicketState(ticket, TicketStatus.CLOSED, mockManager),
        InvalidStateTransitionError,
        'ERR_INVALID_STATE_TRANSITION'
      );
    },
  },
  {
    category: 'Illegal State Transitions',
    name: 'TC-08: Blocks illegal skip ASSIGNED -> RESOLVED without active work',
    fn: () => {
      const ticket = createMockTicket({
        status: TicketStatus.ASSIGNED,
        assignedToId: mockAgent.id,
        assignedToName: mockAgent.name,
      });
      assertThrows(
        () => transitionTicketState(ticket, TicketStatus.RESOLVED, mockAgent),
        InvalidStateTransitionError,
        'ERR_INVALID_STATE_TRANSITION'
      );
    },
  },
  {
    category: 'Illegal State Transitions',
    name: 'TC-09: Blocks illegal skip IN_PROGRESS -> CLOSED (must go through RESOLVED)',
    fn: () => {
      const ticket = createMockTicket({
        status: TicketStatus.IN_PROGRESS,
        assignedToId: mockAgent.id,
        assignedToName: mockAgent.name,
      });
      assertThrows(
        () => transitionTicketState(ticket, TicketStatus.CLOSED, mockManager),
        InvalidStateTransitionError,
        'ERR_INVALID_STATE_TRANSITION'
      );
    },
  },

  // 4. TERMINAL STATE IMMUTABILITY
  {
    category: 'Terminal Immutability',
    name: 'TC-10: Throws ImmutableStateError on any modification to CLOSED tickets',
    fn: () => {
      const ticket = createMockTicket({
        status: TicketStatus.CLOSED,
        assignedToId: mockAgent.id,
        assignedToName: mockAgent.name,
        closedAt: new Date().toISOString(),
      });

      // Attempting to transition to ANY state should fail with ImmutableStateError
      const statesToTry = [
        TicketStatus.NEW,
        TicketStatus.ASSIGNED,
        TicketStatus.IN_PROGRESS,
        TicketStatus.RESOLVED,
        TicketStatus.CLOSED,
      ];

      for (const target of statesToTry) {
        assertThrows(
          () => transitionTicketState(ticket, target, mockManager),
          ImmutableStateError,
          'ERR_IMMUTABLE_TERMINAL_STATE'
        );
      }
    },
  },

  // 5. SINGLE OWNERSHIP & ASSIGNEE ENFORCEMENT
  {
    category: 'Single Ownership Enforcement',
    name: 'TC-11: Throws MissingAssigneeError when moving to ASSIGNED without an assignee',
    fn: () => {
      const ticket = createMockTicket({
        status: TicketStatus.NEW,
        assignedToId: null,
      });

      // Manager attempts to move to ASSIGNED with explicit null assignee
      assertThrows(
        () =>
          transitionTicketState(ticket, TicketStatus.ASSIGNED, mockManager, {
            newAssignee: null,
          }),
        MissingAssigneeError,
        'ERR_MISSING_ASSIGNEE'
      );
    },
  },
  {
    category: 'Single Ownership Enforcement',
    name: 'TC-12: Prevents assignment changes on CLOSED tickets',
    fn: () => {
      const ticket = createMockTicket({
        status: TicketStatus.CLOSED,
        assignedToId: mockAgent.id,
      });

      assertThrows(
        () => assignTicket(ticket, { id: mockAgentTwo.id, name: mockAgentTwo.name }, mockManager),
        ImmutableStateError,
        'ERR_IMMUTABLE_TERMINAL_STATE'
      );
    },
  },

  // 6. ROLE-BASED AUTHORIZATION ENFORCEMENT
  {
    category: 'Role-Based Access Control',
    name: 'TC-13: Blocks Requester from transitioning NEW -> ASSIGNED',
    fn: () => {
      const ticket = createMockTicket();
      assertThrows(
        () =>
          transitionTicketState(ticket, TicketStatus.ASSIGNED, mockRequester, {
            newAssignee: { id: mockAgent.id, name: mockAgent.name },
          }),
        UnauthorizedStateTransitionError,
        'ERR_UNAUTHORIZED_TRANSITION'
      );
    },
  },
  {
    category: 'Role-Based Access Control',
    name: 'TC-14: Blocks Requester from transitioning IN_PROGRESS -> RESOLVED',
    fn: () => {
      const ticket = createMockTicket({
        status: TicketStatus.IN_PROGRESS,
        assignedToId: mockAgent.id,
        assignedToName: mockAgent.name,
      });
      assertThrows(
        () => transitionTicketState(ticket, TicketStatus.RESOLVED, mockRequester),
        UnauthorizedStateTransitionError,
        'ERR_UNAUTHORIZED_TRANSITION'
      );
    },
  },
  {
    category: 'Role-Based Access Control',
    name: 'TC-15: Allows Requester to Close or Reopen a RESOLVED ticket',
    fn: () => {
      const ticket = createMockTicket({
        status: TicketStatus.RESOLVED,
        assignedToId: mockAgent.id,
        assignedToName: mockAgent.name,
        resolvedAt: new Date().toISOString(),
      });

      // Can Reopen
      const reopenRes = transitionTicketState(ticket, TicketStatus.IN_PROGRESS, mockRequester, {
        reason: 'Issue still happening on restart',
      });
      assert(reopenRes.ticket.status === TicketStatus.IN_PROGRESS, 'Must reopen to IN_PROGRESS');

      // Can Close
      const closeRes = transitionTicketState(ticket, TicketStatus.CLOSED, mockRequester, {
        reason: 'Works great, thanks!',
      });
      assert(closeRes.ticket.status === TicketStatus.CLOSED, 'Must close to CLOSED');
    },
  },

  // 7. AUDIT LOG & IMMUTABILITY INTEGRITY
  {
    category: 'Audit & Immutability',
    name: 'TC-16: Ensures immutability and complete append-only audit trail',
    fn: () => {
      const ticket = createMockTicket();
      const freezeClone = JSON.stringify(ticket);

      const result = transitionTicketState(ticket, TicketStatus.ASSIGNED, mockAgent, {
        newAssignee: { id: mockAgent.id, name: mockAgent.name },
        reason: 'Claimed by triage technician',
      });

      // Verify original object was not mutated
      assert(JSON.stringify(ticket) === freezeClone, 'Original ticket must remain completely untouched');
      assert(ticket.status === TicketStatus.NEW, 'Original ticket status unchanged');
      assert(result.ticket.status === TicketStatus.ASSIGNED, 'New ticket status updated');

      // Verify audit entry structure
      const entry = result.auditEntry;
      assert(entry.fromState === TicketStatus.NEW, 'Audit fromState is NEW');
      assert(entry.toState === TicketStatus.ASSIGNED, 'Audit toState is ASSIGNED');
      assert(entry.actorId === mockAgent.id, 'Audit actor is Alex');
      assert(entry.actorRole === UserRole.AGENT, 'Audit actorRole is AGENT');
      assert(entry.reason === 'Claimed by triage technician', 'Audit reason recorded');
      assert(result.ticket.auditLogs[0].id === entry.id, 'Audit entry appended to ticket log');
    },
  },
  {
    category: 'State Machine Queries',
    name: 'TC-17: Correctly computes available next states by actor role',
    fn: () => {
      // NEW state
      const agentNextFromNew = getAvailableNextStates(TicketStatus.NEW, UserRole.AGENT);
      assert(agentNextFromNew.length === 1 && agentNextFromNew[0] === TicketStatus.ASSIGNED, 'Agent can only go NEW -> ASSIGNED');

      const requesterNextFromNew = getAvailableNextStates(TicketStatus.NEW, UserRole.REQUESTER);
      assert(requesterNextFromNew.length === 0, 'Requester has no valid transitions from NEW');

      // RESOLVED state
      const requesterNextFromResolved = getAvailableNextStates(TicketStatus.RESOLVED, UserRole.REQUESTER);
      assert(requesterNextFromResolved.includes(TicketStatus.CLOSED), 'Requester can CLOSE resolved ticket');
      assert(requesterNextFromResolved.includes(TicketStatus.IN_PROGRESS), 'Requester can REOPEN resolved ticket');

      // CLOSED state
      const nextFromClosed = getAvailableNextStates(TicketStatus.CLOSED);
      assert(nextFromClosed.length === 0, 'CLOSED has zero next states (terminal)');
    },
  },
  {
    category: 'Notification Dispatch Engine',
    name: 'TC-18: Dispatches RFC 2822 compliant notification on ticket status change',
    fn: () => {
      const ticket = createMockTicket({
        status: TicketStatus.IN_PROGRESS,
        assignedToId: mockAgent.id,
        assignedToName: mockAgent.name,
      });

      const notifications = dispatchStatusChangeNotification(
        ticket,
        TicketStatus.IN_PROGRESS,
        TicketStatus.RESOLVED,
        mockAgent,
        'Applied firewall DNS configuration fix'
      );

      assert(notifications.length > 0, 'At least one notification dispatched for resolution');
      const reqNotif = notifications.find((n) => n.recipient.email === ticket.requesterEmail);
      assert(Boolean(reqNotif), 'Requester received status change email');
      assert(reqNotif?.trigger === NotificationTrigger.STATUS_CHANGED, 'Trigger is STATUS_CHANGED');
      assert(reqNotif?.deliveryStatus === DeliveryStatus.DELIVERED, 'Delivery status is DELIVERED');
      assert(reqNotif?.smtpResponseCode.includes('250 2.0.0 OK'), 'Valid SMTP response code received');
      assert(Boolean(reqNotif?.headers.messageId), 'Message-ID header exists');
      assert(reqNotif?.headers.status === TicketStatus.RESOLVED, 'Header reflects target status');
      assert(Boolean(reqNotif?.htmlContent.includes('RESOLVED')), 'HTML includes status badge');
      assert(Boolean(reqNotif?.plainContent.includes(ticket.title)), 'Plain text includes title');
    },
  },
  {
    category: 'Notification Dispatch Engine',
    name: 'TC-19: Dispatches notifications on assignment changes to assignee and requester',
    fn: () => {
      const ticket = createMockTicket({
        status: TicketStatus.NEW,
        assignedToId: null,
        assignedToName: null,
      });

      const notifications = dispatchAssignmentNotification(
        ticket,
        { id: mockAgent.id, name: mockAgent.name },
        mockManager,
        'Assigned to network specialist'
      );

      assert(notifications.length === 2, 'Two notifications dispatched: one for assignee, one for requester');
      const agentNotif = notifications.find((n) => n.recipient.email === mockAgent.email);
      const reqNotif = notifications.find((n) => n.recipient.email === ticket.requesterEmail);

      assert(Boolean(agentNotif), 'Assignee received dispatch');
      assert(Boolean(reqNotif), 'Requester received dispatch');
      assert(agentNotif?.subject.includes(ticket.id), 'Assignee subject contains ticket ID');
      assert(reqNotif?.trigger === NotificationTrigger.ASSIGNMENT_CHANGED, 'Trigger is ASSIGNMENT_CHANGED');
    },
  },
  {
    category: 'Notification Dispatch Engine',
    name: 'TC-20: Dispatches notifications on public message updates while suppressing internal notes for requester',
    fn: () => {
      const ticket = createMockTicket({
        status: TicketStatus.IN_PROGRESS,
        assignedToId: mockAgent.id,
        assignedToName: mockAgent.name,
      });

      // Public message from agent
      const publicMsg = {
        id: 'msg_01',
        ticketId: ticket.id,
        authorId: mockAgent.id,
        authorName: mockAgent.name,
        authorRole: UserRole.AGENT,
        content: 'Please test connecting to the US-West VPN gateway now.',
        isPrivateStaffNote: false,
        createdAt: new Date().toISOString(),
      };

      const publicNotifs = dispatchNewMessageNotification(ticket, publicMsg, mockAgent);
      assert(publicNotifs.length === 1, 'One notification sent for public message');
      assert(publicNotifs[0].recipient.email === ticket.requesterEmail, 'Sent to requester');
      assert(publicNotifs[0].plainContent.includes('US-West VPN gateway'), 'Content excerpt included');

      // Private staff note from agent
      const privateMsg = {
        id: 'msg_02',
        ticketId: ticket.id,
        authorId: mockAgent.id,
        authorName: mockAgent.name,
        authorRole: UserRole.AGENT,
        content: 'Investigating LDAP certificate revocation in server logs.',
        isPrivateStaffNote: true,
        createdAt: new Date().toISOString(),
      };

      const privateNotifs = dispatchNewMessageNotification(ticket, privateMsg, mockAgent);
      const leakedToRequester = privateNotifs.some((n) => n.recipient.email === ticket.requesterEmail);
      assert(!leakedToRequester, 'Private internal staff notes NEVER leak to requester');
    },
  },
  {
    category: 'Notification Dispatch Engine',
    name: 'TC-21: Generates simulated diagnostic test dispatch with complete SMTP headers',
    fn: () => {
      const ticket = createMockTicket();
      const testNotif = dispatchManualTestNotification(ticket, mockAgent);

      assert(testNotif.trigger === NotificationTrigger.TEST_DISPATCH, 'Trigger is TEST_DISPATCH');
      assert(testNotif.deliveryStatus === DeliveryStatus.DELIVERED, 'Delivery is DELIVERED');
      assert(testNotif.smtpResponseCode.includes('250 2.0.0 OK'), 'SMTP response code is 250 OK');
      assert(Boolean(testNotif.headers.messageId), 'Message-ID header generated');
      assert(Boolean(testNotif.headers.from), 'From header generated');
      assert(Boolean(testNotif.headers.to), 'To header generated');
      assert(Boolean(testNotif.headers.replyTo), 'Reply-To header generated');
    },
  },
  {
    category: 'Live Polling Engine',
    name: 'TC-22: Periodically simulates background ticket updates & maintains state integrity without manual interaction',
    fn: () => {
      const initialTicket = createMockTicket({
        status: TicketStatus.NEW,
        assignedToId: null,
        assignedToName: null,
      });

      const pollResult = simulatePollCycle([initialTicket]);
      assert(pollResult.hasUpdates, 'Poll result detects updates');
      assert(pollResult.updatedTickets.length > 0, 'Updated tickets list returned');
      assert(Boolean(pollResult.affectedTicket), 'Affected ticket is identified');
      assert(Boolean(pollResult.summary), 'Human-readable update summary is generated');
      assert(
        pollResult.changeType === 'ASSIGNMENT' ||
        pollResult.changeType === 'STATUS_CHANGE' ||
        pollResult.changeType === 'NEW_MESSAGE' ||
        pollResult.changeType === 'NEW_TICKET',
        'Valid lifecycle changeType produced'
      );
    },
  },
  {
    category: 'CSV Data Export & Auditing',
    name: 'TC-23: Generates RFC-4180 compliant CSV format with properly escaped cells and headers',
    fn: () => {
      const ticket = createMockTicket({
        id: 'HDL-9001',
        title: 'Network latency in building "B", 3rd floor',
        messages: [
          {
            id: 'msg_01',
            ticketId: 'HDL-9001',
            authorId: mockAgent.id,
            authorName: mockAgent.name,
            authorRole: mockAgent.role,
            content: 'Investigating switch ports, tested 1000Mbps connection.',
            isPrivateStaffNote: false,
            createdAt: new Date().toISOString(),
          },
        ],
        auditLogs: [
          {
            id: 'aud_01',
            ticketId: 'HDL-9001',
            actorId: mockManager.id,
            actorName: mockManager.name,
            actorRole: mockManager.role,
            action: AuditAction.ASSIGNMENT_CHANGE,
            timestamp: new Date().toISOString(),
            reason: 'Assigned to network engineer for immediate triage',
          },
        ],
      });

      // Cell escaping checks
      assert(escapeCSVCell('normal text') === 'normal text', 'Normal text unquoted');
      assert(escapeCSVCell('hello, world') === '"hello, world"', 'Commas are wrapped in quotes');
      assert(escapeCSVCell('say "hello"') === '"say ""hello"""', 'Double quotes are properly doubled');
      assert(escapeCSVCell('=SUM(A1:A5)').startsWith("'="), 'CSV formula injection neutralized');

      const unifiedCSV = generateUnifiedHistoryCSV(ticket, UserRole.MANAGER);
      assert(unifiedCSV.includes('Timestamp (UTC)'), 'Header contains Timestamp');
      assert(unifiedCSV.includes('Record Type'), 'Header contains Record Type');
      assert(unifiedCSV.includes('HDL-9001'), 'Contains Ticket ID');
      assert(unifiedCSV.includes('Investigating switch ports'), 'Contains message body');
      assert(unifiedCSV.includes('Assigned to network engineer'), 'Contains audit reason');

      const activityCSV = generateActivityThreadCSV(ticket, UserRole.MANAGER);
      assert(activityCSV.includes('Message ID'), 'Activity CSV contains Message ID header');
      assert(activityCSV.includes('Investigating switch ports'), 'Activity CSV contains content');

      const auditCSV = generateAuditTrailCSV(ticket);
      assert(auditCSV.includes('Audit Entry ID'), 'Audit CSV contains Audit Entry ID header');
      assert(auditCSV.includes('ASSIGNMENT_CHANGE'), 'Audit CSV contains action');
    },
  },
  {
    category: 'CSV Data Export & Auditing',
    name: 'TC-24: Strictly isolates private staff notes in CSV export when requested by Requester',
    fn: () => {
      const ticket = createMockTicket({
        id: 'HDL-9002',
        messages: [
          {
            id: 'msg_public',
            ticketId: 'HDL-9002',
            authorId: mockRequester.id,
            authorName: mockRequester.name,
            authorRole: mockRequester.role,
            content: 'Public requester feedback for all to see',
            isPrivateStaffNote: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'msg_private',
            ticketId: 'HDL-9002',
            authorId: mockAgent.id,
            authorName: mockAgent.name,
            authorRole: mockAgent.role,
            content: 'INTERNAL CONFIDENTIAL: Suspect hardware failure in rack 4',
            isPrivateStaffNote: true,
            createdAt: new Date().toISOString(),
          },
        ],
      });

      // Export as MANAGER (Full visibility)
      const managerHistory = getUnifiedTicketHistory(ticket, UserRole.MANAGER);
      const managerCSV = generateUnifiedHistoryCSV(ticket, UserRole.MANAGER);
      assert(managerHistory.some((r) => r.details.includes('INTERNAL CONFIDENTIAL')), 'Manager history includes private staff note');
      assert(managerCSV.includes('INTERNAL CONFIDENTIAL'), 'Manager CSV includes private note');

      // Export as REQUESTER (Strict isolation)
      const requesterHistory = getUnifiedTicketHistory(ticket, UserRole.REQUESTER);
      const requesterCSV = generateUnifiedHistoryCSV(ticket, UserRole.REQUESTER);
      const requesterActivityCSV = generateActivityThreadCSV(ticket, UserRole.REQUESTER);

      assert(!requesterHistory.some((r) => r.details.includes('INTERNAL CONFIDENTIAL')), 'Requester history suppresses private staff note');
      assert(!requesterCSV.includes('INTERNAL CONFIDENTIAL'), 'Requester CSV suppresses private staff note');
      assert(!requesterActivityCSV.includes('INTERNAL CONFIDENTIAL'), 'Requester Activity CSV suppresses private staff note');
      assert(requesterCSV.includes('Public requester feedback'), 'Requester CSV preserves public message');
    },
  },
];

/**
 * Universal In-Memory Test Runner
 * Executes all registered test cases and outputs structured report.
 */
export function runLifecycleTestSuite(): TestSuiteSummary {
  const startTime = performance.now();
  const results: TestCaseResult[] = [];
  let passedCount = 0;
  let failedCount = 0;

  for (const test of TEST_SUITE) {
    const t0 = performance.now();
    try {
      test.fn();
      const t1 = performance.now();
      passedCount++;
      results.push({
        name: test.name,
        category: test.category,
        passed: true,
        durationMs: Math.round((t1 - t0) * 100) / 100,
      });
    } catch (err: unknown) {
      const t1 = performance.now();
      failedCount++;
      results.push({
        name: test.name,
        category: test.category,
        passed: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Math.round((t1 - t0) * 100) / 100,
      });
    }
  }

  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    total: TEST_SUITE.length,
    passed: passedCount,
    failed: failedCount,
    durationMs,
    results,
  };
}
