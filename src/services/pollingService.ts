/**
 * HelpDesk Lite (V1 MVP)
 * Simulated Ticket Polling Service
 *
 * Periodically simulates background updates, remote agent activities,
 * customer responses, and new incoming ticket intake every 30 seconds.
 */

import {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  User,
  UserRole,
  AuditAction,
  AuditLogEntry,
  ActivityMessage,
  DispatchedNotification,
} from '../types/ticket';
import {
  dispatchStatusChangeNotification,
  dispatchAssignmentNotification,
  dispatchNewMessageNotification,
  dispatchTicketCreatedNotification,
} from './notificationService';
import { transitionTicketState } from '../engine/stateMachine';

export interface PollResult {
  hasUpdates: boolean;
  updatedTickets: Ticket[];
  affectedTicket?: Ticket;
  changeType: 'STATUS_CHANGE' | 'ASSIGNMENT' | 'NEW_MESSAGE' | 'NEW_TICKET' | 'NO_CHANGE';
  summary: string;
  dispatchedNotifications: DispatchedNotification[];
  timestamp: string;
}

// Simulated background actors
export const BACKGROUND_ACTORS = {
  marcusAgent: {
    id: 'usr_agent_2',
    name: 'Marcus Vance',
    email: 'marcus.vance@company.local',
    role: UserRole.AGENT,
  } as User,
  alexAgent: {
    id: 'usr_agent_1',
    name: 'Alex Rivera',
    email: 'alex.rivera@company.local',
    role: UserRole.AGENT,
  } as User,
  elenaManager: {
    id: 'usr_mgr_1',
    name: 'Elena Rostova',
    email: 'elena.rostova@company.local',
    role: UserRole.MANAGER,
  } as User,
  systemWatchdog: {
    id: 'usr_sys_0',
    name: 'HelpDesk SLA Watchdog',
    email: 'watchdog@helpdesk.company.local',
    role: UserRole.SYSTEM,
  } as User,
  simulatedRequester: {
    id: 'usr_req_sim',
    name: 'Jordan Powell',
    email: 'jordan.powell@company.local',
    role: UserRole.REQUESTER,
  } as User,
};

// Rotating candidate templates for new incoming tickets
const INCOMING_TICKET_TEMPLATES: Array<{
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  requesterName: string;
  requesterEmail: string;
}> = [
  {
    title: 'PostgreSQL connection pool exhausted on prod-replica-02',
    description: 'Application server throwing PSQLException: FATAL remaining connection slots reserved for non-replication superuser connections.',
    category: TicketCategory.IT,
    priority: TicketPriority.CRITICAL,
    requesterName: 'DevOps Automated Monitoring',
    requesterEmail: 'alerts-db@company.local',
  },
  {
    title: 'Request for GitHub Enterprise SAML seat & repository write permissions',
    description: 'Need write permissions to backend-services repo and CI/CD workflow execution rights.',
    category: TicketCategory.IT,
    priority: TicketPriority.MEDIUM,
    requesterName: 'Lisa Henderson',
    requesterEmail: 'lisa.henderson@company.local',
  },
  {
    title: 'Conference room 4B audio-visual screen flickering during Teams calls',
    description: 'HDMI extender is loose and drops sync intermittently when audio level exceeds 50%.',
    category: TicketCategory.FACILITIES,
    priority: TicketPriority.LOW,
    requesterName: 'Marcus Vance',
    requesterEmail: 'marcus.vance@company.local',
  },
  {
    title: 'Payroll tax deduction withholding update for Q3',
    description: 'Submitted W-4 revision in HRIS portal; please confirm effective date on next direct deposit cycle.',
    category: TicketCategory.HR,
    priority: TicketPriority.MEDIUM,
    requesterName: 'Carlos Ramirez',
    requesterEmail: 'carlos.ramirez@company.local',
  },
  {
    title: 'Okta FastPass biometric prompt failing on iOS 18 devices',
    description: 'Employees reporting FaceID timeout when authenticating to corporate email app.',
    category: TicketCategory.IT,
    priority: TicketPriority.HIGH,
    requesterName: 'Samantha Wu',
    requesterEmail: 'samantha.wu@company.local',
  },
];

let templateIndex = 0;
let ticketCounter = 1045;

/**
 * Executes a simulated polling cycle across current tickets.
 * Selects an appropriate realistic lifecycle event to advance state or ingest a new ticket.
 */
export function simulatePollCycle(currentTickets: Ticket[]): PollResult {
  const now = new Date().toISOString();
  const notifications: DispatchedNotification[] = [];

  // Strategy 1: If there's an unassigned NEW ticket, assign it to Marcus Vance or Alex Rivera
  const unassignedNew = currentTickets.find(
    (t) => t.status === TicketStatus.NEW && !t.assignedToId
  );

  if (unassignedNew) {
    const assignedAgent = BACKGROUND_ACTORS.marcusAgent;
    try {
      const transitionResult = transitionTicketState(
        unassignedNew,
        TicketStatus.ASSIGNED,
        BACKGROUND_ACTORS.elenaManager,
        {
          reason: `Auto-triaged & assigned to ${assignedAgent.name} via queue triage`,
          newAssignee: assignedAgent,
          timestamp: now,
        }
      );

      const notifs = dispatchAssignmentNotification(
        transitionResult.ticket,
        assignedAgent,
        BACKGROUND_ACTORS.elenaManager,
        `Assigned by triage coordinator`
      );
      notifications.push(...notifs);

      const updatedTicket: Ticket = {
        ...transitionResult.ticket,
        notifications: [...(unassignedNew.notifications || []), ...notifs],
        updatedAt: now,
      };

      return {
        hasUpdates: true,
        updatedTickets: currentTickets.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)),
        affectedTicket: updatedTicket,
        changeType: 'ASSIGNMENT',
        summary: `Ticket ${unassignedNew.id} assigned to ${assignedAgent.name} by manager.`,
        dispatchedNotifications: notifications,
        timestamp: now,
      };
    } catch {
      // Fall through if validation failed
    }
  }

  // Strategy 2: If there's an ASSIGNED ticket, start work on it (ASSIGNED -> IN_PROGRESS)
  const assignedTicket = currentTickets.find((t) => t.status === TicketStatus.ASSIGNED);
  if (assignedTicket && assignedTicket.assignedToId) {
    const agentActor =
      assignedTicket.assignedToId === BACKGROUND_ACTORS.marcusAgent.id
        ? BACKGROUND_ACTORS.marcusAgent
        : BACKGROUND_ACTORS.alexAgent;

    try {
      const transitionResult = transitionTicketState(
        assignedTicket,
        TicketStatus.IN_PROGRESS,
        agentActor,
        {
          reason: 'Investigation commenced; reproducing issue in test environment',
          timestamp: now,
        }
      );

      const notifs = dispatchStatusChangeNotification(
        transitionResult.ticket,
        TicketStatus.ASSIGNED,
        TicketStatus.IN_PROGRESS,
        agentActor,
        'Diagnostics initiated by assignee'
      );
      notifications.push(...notifs);

      const updatedTicket: Ticket = {
        ...transitionResult.ticket,
        firstResponseAt: assignedTicket.firstResponseAt || now,
        notifications: [...(assignedTicket.notifications || []), ...notifs],
        updatedAt: now,
      };

      return {
        hasUpdates: true,
        updatedTickets: currentTickets.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)),
        affectedTicket: updatedTicket,
        changeType: 'STATUS_CHANGE',
        summary: `Ticket ${assignedTicket.id} moved to IN_PROGRESS by ${agentActor.name}.`,
        dispatchedNotifications: notifications,
        timestamp: now,
      };
    } catch {
      // Fall through
    }
  }

  // Strategy 3: Add an informative customer/agent message to an IN_PROGRESS or ASSIGNED ticket
  const activeTicket = currentTickets.find(
    (t) => t.status === TicketStatus.IN_PROGRESS || t.status === TicketStatus.ASSIGNED
  );

  if (activeTicket) {
    const isCustomerReplying = activeTicket.messages.length % 2 === 1;
    let newMessage: ActivityMessage;
    let actor: User;

    if (isCustomerReplying) {
      actor = {
        id: activeTicket.requesterId,
        name: activeTicket.requesterName,
        email: activeTicket.requesterEmail,
        role: UserRole.REQUESTER,
      };
      newMessage = {
        id: `msg_poll_${Date.now()}`,
        ticketId: activeTicket.id,
        authorId: actor.id,
        authorName: actor.name,
        authorRole: actor.role,
        content: `Uploaded latest packet capture & verified that port 443 connectivity is intact from client side.`,
        isPrivateStaffNote: false,
        createdAt: now,
      };
    } else {
      actor = BACKGROUND_ACTORS.marcusAgent;
      newMessage = {
        id: `msg_poll_${Date.now()}`,
        ticketId: activeTicket.id,
        authorId: actor.id,
        authorName: actor.name,
        authorRole: actor.role,
        content: `Applied hotfix patch to staging relay. Requesting confirmation if symptoms persist.`,
        isPrivateStaffNote: false,
        createdAt: now,
      };
    }

    const notifs = dispatchNewMessageNotification(activeTicket, newMessage, actor);
    notifications.push(...notifs);

    const auditEntry: AuditLogEntry = {
      id: `audit_poll_${Date.now()}`,
      ticketId: activeTicket.id,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: AuditAction.PUBLIC_REPLY_ADDED,
      reason: `Message added via remote client`,
      timestamp: now,
    };

    const updatedTicket: Ticket = {
      ...activeTicket,
      messages: [...activeTicket.messages, newMessage],
      auditLogs: [...activeTicket.auditLogs, auditEntry],
      notifications: [...(activeTicket.notifications || []), ...notifs],
      updatedAt: now,
    };

    return {
      hasUpdates: true,
      updatedTickets: currentTickets.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)),
      affectedTicket: updatedTicket,
      changeType: 'NEW_MESSAGE',
      summary: `New message on ${activeTicket.id} from ${actor.name}.`,
      dispatchedNotifications: notifications,
      timestamp: now,
    };
  }

  // Strategy 4: Ingest a new simulated ticket to keep queue dynamic
  const template = INCOMING_TICKET_TEMPLATES[templateIndex % INCOMING_TICKET_TEMPLATES.length];
  templateIndex++;
  const newTicketId = `HDL-${ticketCounter++}`;

  const requesterUser: User = {
    id: `usr_${Date.now()}`,
    name: template.requesterName,
    email: template.requesterEmail,
    role: UserRole.REQUESTER,
  };

  const newTicket: Ticket = {
    id: newTicketId,
    title: template.title,
    description: template.description,
    category: template.category,
    priority: template.priority,
    status: TicketStatus.NEW,
    requesterId: requesterUser.id,
    requesterName: requesterUser.name,
    requesterEmail: requesterUser.email,
    assignedToId: null,
    assignedToName: null,
    attachments: [],
    messages: [],
    auditLogs: [
      {
        id: `audit_create_${Date.now()}`,
        ticketId: newTicketId,
        actorId: requesterUser.id,
        actorName: requesterUser.name,
        actorRole: requesterUser.role,
        action: AuditAction.TICKET_CREATED,
        toState: TicketStatus.NEW,
        reason: 'Ticket created via portal API intake',
        timestamp: now,
      },
    ],
    notifications: [],
    firstResponseAt: null,
    resolvedAt: null,
    closedAt: null,
    slaDueAt: new Date(Date.now() + 8 * 3600000).toISOString(),
    createdAt: now,
    updatedAt: now,
  };

  const intakeNotifs = dispatchTicketCreatedNotification(newTicket, requesterUser);
  newTicket.notifications = intakeNotifs;

  return {
    hasUpdates: true,
    updatedTickets: [newTicket, ...currentTickets],
    affectedTicket: newTicket,
    changeType: 'NEW_TICKET',
    summary: `New incoming ticket ${newTicketId}: "${template.title}" received.`,
    dispatchedNotifications: intakeNotifs,
    timestamp: now,
  };
}
