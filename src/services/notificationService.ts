/**
 * HelpDesk Lite
 * Notification Service Layer
 * 
 * Simulates enterprise SMTP dispatching for ticket status changes, assignment mutations,
 * and conversational updates. Generates compliant email envelopes, structured HTML/plain
 * representations, and maintains a transparent dispatch history log.
 */

import {
  Ticket,
  TicketStatus,
  User,
  UserRole,
  ActivityMessage,
  DispatchedNotification,
  NotificationTrigger,
  DeliveryStatus,
  NotificationRecipient,
} from '../types/ticket';

const SENDER_ADDRESS = 'HelpDesk Dispatcher <notifications@support.company.local>';
const SYSTEM_REPLY_DOMAIN = 'support.company.local';

/**
 * Generates an RFC 2822 compliant Message-ID
 */
function generateMessageId(ticketId: string): string {
  const rand = Math.random().toString(36).substring(2, 8);
  return `<${ticketId.toLowerCase()}.${Date.now()}.${rand}@${SYSTEM_REPLY_DOMAIN}>`;
}

/**
 * Returns formatted priority indicator
 */
function getPriorityHeader(priority: string): string {
  switch (priority) {
    case 'CRITICAL':
      return '1 (Highest)';
    case 'HIGH':
      return '2 (High)';
    case 'MEDIUM':
      return '3 (Normal)';
    case 'LOW':
    default:
      return '4 (Low)';
  }
}

/**
 * Builds HTML template for ticket email notifications
 */
function buildHtmlEmail(params: {
  title: string;
  badge: string;
  badgeColor: string;
  headline: string;
  recipientName: string;
  ticket: Ticket;
  summaryText: string;
  actionText: string;
  detailsTable: Array<{ label: string; value: string }>;
  actorName: string;
  actorRole: string;
  quoteBox?: { label: string; content: string; isPrivate?: boolean };
}): string {
  const {
    title,
    badge,
    badgeColor,
    headline,
    recipientName,
    ticket,
    summaryText,
    actionText,
    detailsTable,
    actorName,
    actorRole,
    quoteBox,
  } = params;

  const detailRowsHtml = detailsTable
    .map(
      (row) => `
      <tr>
        <td style="padding: 6px 12px; font-size: 12px; color: #64748b; font-weight: 600; width: 140px; border-bottom: 1px solid #f1f5f9;">${row.label}</td>
        <td style="padding: 6px 12px; font-size: 12px; color: #1e293b; font-weight: 500; border-bottom: 1px solid #f1f5f9;">${row.value}</td>
      </tr>
    `
    )
    .join('');

  const quoteBoxHtml = quoteBox
    ? `
    <div style="margin: 16px 0; padding: 12px 16px; background-color: ${
      quoteBox.isPrivate ? '#fef2f2' : '#f8fafc'
    }; border-left: 4px solid ${
        quoteBox.isPrivate ? '#ef4444' : '#6366f1'
      }; border-radius: 4px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${
        quoteBox.isPrivate ? '#991b1b' : '#4338ca'
      }; margin-bottom: 4px;">
        ${quoteBox.label}
      </div>
      <div style="font-size: 13px; line-height: 1.5; color: #334155; font-family: monospace; white-space: pre-wrap;">
        ${quoteBox.content}
      </div>
    </div>
  `
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <div style="background-color: #1e1b4b; padding: 20px 24px; color: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 16px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff;">HelpDesk Lite</span>
        <span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: ${badgeColor}; color: #ffffff;">${badge}</span>
      </div>
      <h1 style="margin: 12px 0 0 0; font-size: 18px; font-weight: 700; line-height: 1.3; color: #ffffff;">${headline}</h1>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #c7d2fe;">Ticket ID: ${ticket.id} • ${ticket.category} • Priority: ${ticket.priority}</p>
    </div>

    <!-- Body -->
    <div style="padding: 24px;">
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.5;">
        Hello <strong>${recipientName}</strong>,
      </p>
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155; line-height: 1.5;">
        ${summaryText}
      </p>

      ${quoteBoxHtml}

      <!-- Metadata Table -->
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fafaf9; border-radius: 8px; overflow: hidden; border: 1px solid #f1f5f9;">
        <tbody>
          ${detailRowsHtml}
        </tbody>
      </table>

      <!-- Call to Action -->
      <div style="margin: 24px 0; text-align: center;">
        <a href="#ticket/${ticket.id}" style="display: inline-block; padding: 10px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600;">
          ${actionText}
        </a>
      </div>

      <p style="margin: 20px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.4;">
        Initiated by: <strong>${actorName}</strong> (${actorRole})<br>
        SLA Target: ${new Date(ticket.slaDueAt).toLocaleString()}
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
      <p style="margin: 0 0 4px 0;">This is an automated dispatch from HelpDesk Lite Notification Engine.</p>
      <p style="margin: 0;">Replies to this message are automatically appended to the immutable ticket audit stream. Reply-To: support+${ticket.id.toLowerCase()}@${SYSTEM_REPLY_DOMAIN}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Builds Plain-Text version of email
 */
function buildPlainTextEmail(params: {
  title: string;
  recipientName: string;
  ticket: Ticket;
  summaryText: string;
  actorName: string;
  actorRole: string;
  quoteBox?: { label: string; content: string };
}): string {
  const { title, recipientName, ticket, summaryText, actorName, actorRole, quoteBox } = params;

  let text = `=======================================================
HELPDESK LITE DISPATCH NOTIFICATION
${title}
Ticket ID: ${ticket.id} | Priority: ${ticket.priority} | Category: ${ticket.category}
=======================================================

Hello ${recipientName},

${summaryText}

`;

  if (quoteBox) {
    text += `--- ${quoteBox.label.toUpperCase()} ---
${quoteBox.content}
-------------------------------

`;
  }

  text += `TICKET DETAILS:
- Title: ${ticket.title}
- Status: ${ticket.status}
- Requester: ${ticket.requesterName} (${ticket.requesterEmail})
- Assigned To: ${ticket.assignedToName || 'Unassigned'}
- SLA Target: ${new Date(ticket.slaDueAt).toLocaleString()}
- Updated By: ${actorName} (${actorRole})

View ticket: https://helpdesk.company.local/tickets/${ticket.id}

-------------------------------------------------------
Replies to this email are recorded in the ticket activity audit stream.
HelpDesk Dispatcher <notifications@support.company.local>
`;

  return text.trim();
}

/**
 * Creates standard DispatchedNotification payload
 */
function createNotificationRecord(params: {
  ticket: Ticket;
  trigger: NotificationTrigger;
  recipient: NotificationRecipient;
  subject: string;
  previewText: string;
  htmlContent: string;
  plainContent: string;
  actorName: string;
  actorRole: string;
  metadata?: DispatchedNotification['metadata'];
}): DispatchedNotification {
  const now = new Date().toISOString();
  const messageId = generateMessageId(params.ticket.id);

  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ticketId: params.ticket.id,
    ticketTitle: params.ticket.title,
    trigger: params.trigger,
    recipient: params.recipient,
    sender: SENDER_ADDRESS,
    subject: params.subject,
    previewText: params.previewText,
    htmlContent: params.htmlContent,
    plainContent: params.plainContent,
    sentAt: now,
    deliveryStatus: DeliveryStatus.DELIVERED,
    smtpResponseCode: '250 2.0.0 OK: 14389 bytes queued via relay.company.local',
    headers: {
      messageId,
      to: `${params.recipient.name} <${params.recipient.email}>`,
      from: SENDER_ADDRESS,
      subject: params.subject,
      date: new Date().toUTCString(),
      ticketId: params.ticket.id,
      status: params.ticket.status,
      priority: getPriorityHeader(params.ticket.priority),
      replyTo: `support+${params.ticket.id.toLowerCase()}@${SYSTEM_REPLY_DOMAIN}`,
    },
    metadata: params.metadata,
  };
}

// -----------------------------------------------------------------------------
// Service API Implementations
// -----------------------------------------------------------------------------

/**
 * Dispatches simulated email notifications upon Ticket Status Change
 * Notifies Requester and Assigned Agent
 */
export function dispatchStatusChangeNotification(
  ticket: Ticket,
  fromStatus: TicketStatus,
  toStatus: TicketStatus,
  actor: User,
  reason?: string
): DispatchedNotification[] {
  const notifications: DispatchedNotification[] = [];

  const statusBadgeColors: Record<TicketStatus, string> = {
    [TicketStatus.NEW]: '#6366f1',
    [TicketStatus.ASSIGNED]: '#3b82f6',
    [TicketStatus.IN_PROGRESS]: '#f59e0b',
    [TicketStatus.RESOLVED]: '#10b981',
    [TicketStatus.CLOSED]: '#64748b',
  };

  const badgeColor = statusBadgeColors[toStatus] || '#6366f1';
  const updatedTicket: Ticket = { ...ticket, status: toStatus };

  // 1. Notify Requester
  const requesterSubject = `[${ticket.id}] Status Update: Moved to ${toStatus} - ${ticket.title}`;
  const requesterSummary = `The status of your ticket "${ticket.title}" has been updated from ${fromStatus} to ${toStatus}.`;

  const requesterDetails = [
    { label: 'Ticket ID', value: ticket.id },
    { label: 'Previous Status', value: fromStatus },
    { label: 'New Status', value: toStatus },
    { label: 'Assigned Agent', value: ticket.assignedToName || 'Triage Pool' },
    { label: 'Resolution SLA', value: new Date(ticket.slaDueAt).toLocaleString() },
  ];

  const requesterHtml = buildHtmlEmail({
    title: requesterSubject,
    badge: toStatus,
    badgeColor,
    headline: `Ticket Status Updated: ${toStatus}`,
    recipientName: ticket.requesterName,
    ticket: updatedTicket,
    summaryText: requesterSummary,
    actionText: 'Review Ticket Status',
    detailsTable: requesterDetails,
    actorName: actor.name,
    actorRole: actor.role,
    quoteBox: reason
      ? { label: 'Transition Notes / Justification', content: reason }
      : undefined,
  });

  const requesterPlain = buildPlainTextEmail({
    title: requesterSubject,
    recipientName: ticket.requesterName,
    ticket: updatedTicket,
    summaryText: requesterSummary,
    actorName: actor.name,
    actorRole: actor.role,
    quoteBox: reason
      ? { label: 'Transition Notes', content: reason }
      : undefined,
  });

  notifications.push(
    createNotificationRecord({
      ticket: updatedTicket,
      trigger: NotificationTrigger.STATUS_CHANGED,
      recipient: {
        email: ticket.requesterEmail,
        name: ticket.requesterName,
        role: 'Requester',
      },
      subject: requesterSubject,
      previewText: `Ticket ${ticket.id} status changed to ${toStatus}. ${reason || ''}`,
      htmlContent: requesterHtml,
      plainContent: requesterPlain,
      actorName: actor.name,
      actorRole: actor.role,
      metadata: {
        fromStatus,
        toStatus,
        assigneeName: ticket.assignedToName,
        actorName: actor.name,
        actorRole: actor.role,
        reason,
      },
    })
  );

  // 2. If ticket is assigned, and actor is someone other than the assignee, notify the Assignee
  if (ticket.assignedToId && ticket.assignedToName && actor.id !== ticket.assignedToId) {
    const assigneeEmail = `${ticket.assignedToName.toLowerCase().replace(/\s+/g, '.')}@company.local`;
    const assigneeSubject = `[${ticket.id}] State Change Alert: ${fromStatus} -> ${toStatus}`;
    const assigneeSummary = `Ticket "${ticket.title}" assigned to you was transitioned to ${toStatus} by ${actor.name} (${actor.role}).`;

    const assigneeHtml = buildHtmlEmail({
      title: assigneeSubject,
      badge: toStatus,
      badgeColor,
      headline: `State Change Notification: ${toStatus}`,
      recipientName: ticket.assignedToName,
      ticket,
      summaryText: assigneeSummary,
      actionText: 'Open Ticket in Agent Console',
      detailsTable: requesterDetails,
      actorName: actor.name,
      actorRole: actor.role,
      quoteBox: reason
        ? { label: 'Transition Reason', content: reason }
        : undefined,
    });

    const assigneePlain = buildPlainTextEmail({
      title: assigneeSubject,
      recipientName: ticket.assignedToName,
      ticket,
      summaryText: assigneeSummary,
      actorName: actor.name,
      actorRole: actor.role,
      quoteBox: reason ? { label: 'Reason', content: reason } : undefined,
    });

    notifications.push(
      createNotificationRecord({
        ticket,
        trigger: NotificationTrigger.STATUS_CHANGED,
        recipient: {
          email: assigneeEmail,
          name: ticket.assignedToName,
          role: 'Assigned Agent',
        },
        subject: assigneeSubject,
        previewText: `Ticket ${ticket.id} assigned to you changed to ${toStatus} by ${actor.name}.`,
        htmlContent: assigneeHtml,
        plainContent: assigneePlain,
        actorName: actor.name,
        actorRole: actor.role,
        metadata: {
          fromStatus,
          toStatus,
          assigneeName: ticket.assignedToName,
          actorName: actor.name,
          actorRole: actor.role,
          reason,
        },
      })
    );
  }

  return notifications;
}

/**
 * Dispatches simulated email notifications upon New Activity Message
 */
export function dispatchNewMessageNotification(
  ticket: Ticket,
  message: ActivityMessage,
  actor: User
): DispatchedNotification[] {
  const notifications: DispatchedNotification[] = [];

  // If private staff note: internal staff only, NEVER notify requester!
  if (message.isPrivateStaffNote) {
    // Notify assigned agent or manager if they aren't the author
    if (ticket.assignedToName && actor.id !== ticket.assignedToId) {
      const assigneeEmail = `${ticket.assignedToName.toLowerCase().replace(/\s+/g, '.')}@company.local`;
      const subject = `[${ticket.id}] Private Staff Note Added by ${actor.name}`;
      const summary = `${actor.name} (${actor.role}) added an internal private staff note to ticket "${ticket.title}".`;

      const html = buildHtmlEmail({
        title: subject,
        badge: 'INTERNAL NOTE',
        badgeColor: '#ef4444',
        headline: `New Private Staff Note Added`,
        recipientName: ticket.assignedToName,
        ticket,
        summaryText: summary,
        actionText: 'View Staff Note',
        detailsTable: [
          { label: 'Ticket ID', value: ticket.id },
          { label: 'Status', value: ticket.status },
          { label: 'Author', value: `${actor.name} (${actor.role})` },
          { label: 'Confidentiality', value: 'Internal Staff Only (Hidden from requester)' },
        ],
        actorName: actor.name,
        actorRole: actor.role,
        quoteBox: {
          label: 'Internal Staff Note',
          content: message.content,
          isPrivate: true,
        },
      });

      const plain = buildPlainTextEmail({
        title: subject,
        recipientName: ticket.assignedToName,
        ticket,
        summaryText: summary,
        actorName: actor.name,
        actorRole: actor.role,
        quoteBox: {
          label: 'Internal Staff Note',
          content: message.content,
        },
      });

      notifications.push(
        createNotificationRecord({
          ticket,
          trigger: NotificationTrigger.NEW_MESSAGE,
          recipient: {
            email: assigneeEmail,
            name: ticket.assignedToName,
            role: 'Assigned Agent',
          },
          subject,
          previewText: `Internal note by ${actor.name}: ${message.content.substring(0, 80)}...`,
          htmlContent: html,
          plainContent: plain,
          actorName: actor.name,
          actorRole: actor.role,
          metadata: {
            actorName: actor.name,
            actorRole: actor.role,
            isPrivateStaffNote: true,
            messageExcerpt: message.content,
          },
        })
      );
    }
    return notifications;
  }

  // Public Reply:
  if (actor.role === UserRole.REQUESTER) {
    // Requester sent a message -> notify Assigned Agent or Triage Team
    const recipientName = ticket.assignedToName || 'Support Triage Desk';
    const recipientEmail = ticket.assignedToName
      ? `${ticket.assignedToName.toLowerCase().replace(/\s+/g, '.')}@company.local`
      : 'support-triage@company.local';

    const subject = `[${ticket.id}] Requester Reply from ${actor.name}: ${ticket.title}`;
    const summary = `${actor.name} responded to ticket "${ticket.title}".`;

    const html = buildHtmlEmail({
      title: subject,
      badge: 'CUSTOMER REPLY',
      badgeColor: '#3b82f6',
      headline: `New Reply from Requester: ${actor.name}`,
      recipientName,
      ticket,
      summaryText: summary,
      actionText: 'Reply in HelpDesk Console',
      detailsTable: [
        { label: 'Ticket ID', value: ticket.id },
        { label: 'Requester', value: `${ticket.requesterName} (${ticket.requesterEmail})` },
        { label: 'Current Status', value: ticket.status },
      ],
      actorName: actor.name,
      actorRole: actor.role,
      quoteBox: {
        label: 'Message from Requester',
        content: message.content,
      },
    });

    const plain = buildPlainTextEmail({
      title: subject,
      recipientName,
      ticket,
      summaryText: summary,
      actorName: actor.name,
      actorRole: actor.role,
      quoteBox: {
        label: 'Message from Requester',
        content: message.content,
      },
    });

    notifications.push(
      createNotificationRecord({
        ticket,
        trigger: NotificationTrigger.NEW_MESSAGE,
        recipient: {
          email: recipientEmail,
          name: recipientName,
          role: ticket.assignedToName ? 'Assigned Agent' : 'Support Staff',
        },
        subject,
        previewText: `${actor.name}: "${message.content.substring(0, 90)}..."`,
        htmlContent: html,
        plainContent: plain,
        actorName: actor.name,
        actorRole: actor.role,
        metadata: {
          actorName: actor.name,
          actorRole: actor.role,
          isPrivateStaffNote: false,
          messageExcerpt: message.content,
        },
      })
    );
  } else {
    // Agent or Manager sent a public response -> Notify Requester!
    const subject = `[${ticket.id}] New Support Response from ${actor.name}`;
    const summary = `${actor.name} from HelpDesk Support posted an update regarding your request "${ticket.title}".`;

    const html = buildHtmlEmail({
      title: subject,
      badge: 'SUPPORT UPDATE',
      badgeColor: '#10b981',
      headline: `Support Update on Ticket #${ticket.id}`,
      recipientName: ticket.requesterName,
      ticket,
      summaryText: summary,
      actionText: 'View and Respond to Ticket',
      detailsTable: [
        { label: 'Ticket ID', value: ticket.id },
        { label: 'Support Agent', value: `${actor.name} (${actor.role})` },
        { label: 'Status', value: ticket.status },
        { label: 'Resolution Target', value: new Date(ticket.slaDueAt).toLocaleString() },
      ],
      actorName: actor.name,
      actorRole: actor.role,
      quoteBox: {
        label: `Response from ${actor.name}`,
        content: message.content,
      },
    });

    const plain = buildPlainTextEmail({
      title: subject,
      recipientName: ticket.requesterName,
      ticket,
      summaryText: summary,
      actorName: actor.name,
      actorRole: actor.role,
      quoteBox: {
        label: `Response from ${actor.name}`,
        content: message.content,
      },
    });

    notifications.push(
      createNotificationRecord({
        ticket,
        trigger: NotificationTrigger.NEW_MESSAGE,
        recipient: {
          email: ticket.requesterEmail,
          name: ticket.requesterName,
          role: 'Requester',
        },
        subject,
        previewText: `${actor.name} replied: "${message.content.substring(0, 90)}..."`,
        htmlContent: html,
        plainContent: plain,
        actorName: actor.name,
        actorRole: actor.role,
        metadata: {
          actorName: actor.name,
          actorRole: actor.role,
          isPrivateStaffNote: false,
          messageExcerpt: message.content,
        },
      })
    );
  }

  return notifications;
}

/**
 * Dispatches simulated email notifications upon Ticket Assignment change
 */
export function dispatchAssignmentNotification(
  ticket: Ticket,
  assignee: { id: string; name: string } | null,
  actor: User,
  reason?: string
): DispatchedNotification[] {
  const notifications: DispatchedNotification[] = [];

  if (assignee) {
    // 1. Notify the newly assigned agent
    const agentEmail = `${assignee.name.toLowerCase().replace(/\s+/g, '.')}@company.local`;
    const agentSubject = `[${ticket.id}] Ticket Assigned to You: ${ticket.title}`;
    const agentSummary = `You have been designated as the owner for ticket "${ticket.title}" by ${actor.name} (${actor.role}).`;

    const agentHtml = buildHtmlEmail({
      title: agentSubject,
      badge: 'NEW ASSIGNMENT',
      badgeColor: '#6366f1',
      headline: `You have been assigned to ${ticket.id}`,
      recipientName: assignee.name,
      ticket,
      summaryText: agentSummary,
      actionText: 'Take Ownership & Begin Triage',
      detailsTable: [
        { label: 'Ticket ID', value: ticket.id },
        { label: 'Priority', value: ticket.priority },
        { label: 'Category', value: ticket.category },
        { label: 'Requester', value: `${ticket.requesterName} (${ticket.requesterEmail})` },
        { label: 'Assigned By', value: `${actor.name} (${actor.role})` },
      ],
      actorName: actor.name,
      actorRole: actor.role,
      quoteBox: reason ? { label: 'Assignment Instruction', content: reason } : undefined,
    });

    const agentPlain = buildPlainTextEmail({
      title: agentSubject,
      recipientName: assignee.name,
      ticket,
      summaryText: agentSummary,
      actorName: actor.name,
      actorRole: actor.role,
      quoteBox: reason ? { label: 'Instruction', content: reason } : undefined,
    });

    notifications.push(
      createNotificationRecord({
        ticket,
        trigger: NotificationTrigger.ASSIGNMENT_CHANGED,
        recipient: {
          email: agentEmail,
          name: assignee.name,
          role: 'Assigned Agent',
        },
        subject: agentSubject,
        previewText: `Assigned to you by ${actor.name}: ${ticket.title}`,
        htmlContent: agentHtml,
        plainContent: agentPlain,
        actorName: actor.name,
        actorRole: actor.role,
        metadata: {
          assigneeName: assignee.name,
          actorName: actor.name,
          actorRole: actor.role,
          reason,
        },
      })
    );

    // 2. Inform Requester that an agent has taken ownership
    const reqSubject = `[${ticket.id}] Support Agent Assigned: ${assignee.name} is handling your ticket`;
    const reqSummary = `Great news! Support Specialist ${assignee.name} has been assigned to your ticket "${ticket.title}".`;

    const reqHtml = buildHtmlEmail({
      title: reqSubject,
      badge: 'AGENT ASSIGNED',
      badgeColor: '#3b82f6',
      headline: `Agent Assigned to Your Request`,
      recipientName: ticket.requesterName,
      ticket,
      summaryText: reqSummary,
      actionText: 'Track Ticket Progress',
      detailsTable: [
        { label: 'Ticket ID', value: ticket.id },
        { label: 'Assigned Specialist', value: assignee.name },
        { label: 'Status', value: ticket.status },
        { label: 'Target SLA', value: new Date(ticket.slaDueAt).toLocaleString() },
      ],
      actorName: actor.name,
      actorRole: actor.role,
    });

    const reqPlain = buildPlainTextEmail({
      title: reqSubject,
      recipientName: ticket.requesterName,
      ticket,
      summaryText: reqSummary,
      actorName: actor.name,
      actorRole: actor.role,
    });

    notifications.push(
      createNotificationRecord({
        ticket,
        trigger: NotificationTrigger.ASSIGNMENT_CHANGED,
        recipient: {
          email: ticket.requesterEmail,
          name: ticket.requesterName,
          role: 'Requester',
        },
        subject: reqSubject,
        previewText: `${assignee.name} has been assigned to your request.`,
        htmlContent: reqHtml,
        plainContent: reqPlain,
        actorName: actor.name,
        actorRole: actor.role,
        metadata: {
          assigneeName: assignee.name,
          actorName: actor.name,
          actorRole: actor.role,
          reason,
        },
      })
    );
  }

  return notifications;
}

/**
 * Dispatches simulated email notifications upon Initial Ticket Submission
 */
export function dispatchTicketCreatedNotification(
  ticket: Ticket,
  actor: User
): DispatchedNotification[] {
  const notifications: DispatchedNotification[] = [];

  const subject = `[${ticket.id}] Ticket Received: ${ticket.title}`;
  const summary = `Thank you for contacting HelpDesk Support. We have received your ticket regarding "${ticket.title}" and assigned ticket ID ${ticket.id}.`;

  const html = buildHtmlEmail({
    title: subject,
    badge: 'TICKET CREATED',
    badgeColor: '#6366f1',
    headline: `We Received Your Request: ${ticket.id}`,
    recipientName: ticket.requesterName,
    ticket,
    summaryText: summary,
    actionText: 'View Ticket in Portal',
    detailsTable: [
      { label: 'Ticket ID', value: ticket.id },
      { label: 'Category', value: ticket.category },
      { label: 'Priority', value: ticket.priority },
      { label: 'Initial Status', value: ticket.status },
      { label: 'Target SLA Due', value: new Date(ticket.slaDueAt).toLocaleString() },
    ],
    actorName: actor.name,
    actorRole: actor.role,
    quoteBox: {
      label: 'Initial Description',
      content: ticket.description,
    },
  });

  const plain = buildPlainTextEmail({
    title: subject,
    recipientName: ticket.requesterName,
    ticket,
    summaryText: summary,
    actorName: actor.name,
    actorRole: actor.role,
    quoteBox: {
      label: 'Description',
      content: ticket.description,
    },
  });

  notifications.push(
    createNotificationRecord({
      ticket,
      trigger: NotificationTrigger.TICKET_CREATED,
      recipient: {
        email: ticket.requesterEmail,
        name: ticket.requesterName,
        role: 'Requester',
      },
      subject,
      previewText: `Ticket ${ticket.id} received and queued for support review.`,
      htmlContent: html,
      plainContent: plain,
      actorName: actor.name,
      actorRole: actor.role,
      metadata: {
        actorName: actor.name,
        actorRole: actor.role,
      },
    })
  );

  return notifications;
}

/**
 * Helper to generate pre-seeded initial notifications for existing seed tickets
 */
export function generateSeedNotifications(ticket: Ticket): DispatchedNotification[] {
  const seedList: DispatchedNotification[] = [];
  const baseTime = new Date(ticket.createdAt).getTime();

  // 1. Creation email
  seedList.push({
    id: `seed_notif_${ticket.id}_1`,
    ticketId: ticket.id,
    ticketTitle: ticket.title,
    trigger: NotificationTrigger.TICKET_CREATED,
    recipient: {
      email: ticket.requesterEmail,
      name: ticket.requesterName,
      role: 'Requester',
    },
    sender: SENDER_ADDRESS,
    subject: `[${ticket.id}] Ticket Received: ${ticket.title}`,
    previewText: `Thank you for contacting HelpDesk Support. We received ticket ${ticket.id}.`,
    htmlContent: buildHtmlEmail({
      title: `[${ticket.id}] Ticket Received: ${ticket.title}`,
      badge: 'TICKET CREATED',
      badgeColor: '#6366f1',
      headline: `We Received Your Request: ${ticket.id}`,
      recipientName: ticket.requesterName,
      ticket,
      summaryText: `Thank you for contacting HelpDesk Support. We have received your ticket regarding "${ticket.title}".`,
      actionText: 'View Ticket in Portal',
      detailsTable: [
        { label: 'Ticket ID', value: ticket.id },
        { label: 'Category', value: ticket.category },
        { label: 'Priority', value: ticket.priority },
        { label: 'Status', value: ticket.status },
        { label: 'SLA Due', value: new Date(ticket.slaDueAt).toLocaleString() },
      ],
      actorName: ticket.requesterName,
      actorRole: 'REQUESTER',
      quoteBox: {
        label: 'Description',
        content: ticket.description,
      },
    }),
    plainContent: buildPlainTextEmail({
      title: `[${ticket.id}] Ticket Received: ${ticket.title}`,
      recipientName: ticket.requesterName,
      ticket,
      summaryText: `Thank you for contacting HelpDesk Support. We have received your ticket regarding "${ticket.title}".`,
      actorName: ticket.requesterName,
      actorRole: 'REQUESTER',
    }),
    sentAt: new Date(baseTime).toISOString(),
    deliveryStatus: DeliveryStatus.DELIVERED,
    smtpResponseCode: '250 2.0.0 OK: message queued 1042-relay.company.local',
    headers: {
      messageId: `<${ticket.id.toLowerCase()}.${baseTime}.ack@${SYSTEM_REPLY_DOMAIN}>`,
      to: `${ticket.requesterName} <${ticket.requesterEmail}>`,
      from: SENDER_ADDRESS,
      subject: `[${ticket.id}] Ticket Received: ${ticket.title}`,
      date: new Date(baseTime).toUTCString(),
      ticketId: ticket.id,
      status: ticket.status,
      priority: getPriorityHeader(ticket.priority),
      replyTo: `support+${ticket.id.toLowerCase()}@${SYSTEM_REPLY_DOMAIN}`,
    },
    metadata: {
      actorName: ticket.requesterName,
      actorRole: 'REQUESTER',
    },
  });

  // 2. If assigned, add assignment notification
  if (ticket.assignedToName) {
    const assignTime = baseTime + 1800000;
    seedList.push({
      id: `seed_notif_${ticket.id}_2`,
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      trigger: NotificationTrigger.ASSIGNMENT_CHANGED,
      recipient: {
        email: `${ticket.assignedToName.toLowerCase().replace(/\s+/g, '.')}@company.local`,
        name: ticket.assignedToName,
        role: 'Assigned Agent',
      },
      sender: SENDER_ADDRESS,
      subject: `[${ticket.id}] Ticket Assigned to You: ${ticket.title}`,
      previewText: `You have been designated as the owner for ticket "${ticket.title}".`,
      htmlContent: buildHtmlEmail({
        title: `[${ticket.id}] Ticket Assigned: ${ticket.title}`,
        badge: 'ASSIGNMENT',
        badgeColor: '#3b82f6',
        headline: `You have been assigned to ${ticket.id}`,
        recipientName: ticket.assignedToName,
        ticket,
        summaryText: `You have been designated as the owner for ticket "${ticket.title}".`,
        actionText: 'Open Ticket',
        detailsTable: [
          { label: 'Ticket ID', value: ticket.id },
          { label: 'Priority', value: ticket.priority },
          { label: 'Requester', value: ticket.requesterName },
        ],
        actorName: 'System Triage Dispatcher',
        actorRole: 'SYSTEM',
      }),
      plainContent: buildPlainTextEmail({
        title: `[${ticket.id}] Ticket Assigned: ${ticket.title}`,
        recipientName: ticket.assignedToName,
        ticket,
        summaryText: `You have been designated as the owner for ticket "${ticket.title}".`,
        actorName: 'System Triage Dispatcher',
        actorRole: 'SYSTEM',
      }),
      sentAt: new Date(assignTime).toISOString(),
      deliveryStatus: DeliveryStatus.DELIVERED,
      smtpResponseCode: '250 2.0.0 OK: message queued 1042-relay.company.local',
      headers: {
        messageId: `<${ticket.id.toLowerCase()}.${assignTime}.asg@${SYSTEM_REPLY_DOMAIN}>`,
        to: `${ticket.assignedToName} <${ticket.assignedToName.toLowerCase().replace(/\s+/g, '.')}@company.local>`,
        from: SENDER_ADDRESS,
        subject: `[${ticket.id}] Ticket Assigned to You: ${ticket.title}`,
        date: new Date(assignTime).toUTCString(),
        ticketId: ticket.id,
        status: ticket.status,
        priority: getPriorityHeader(ticket.priority),
        replyTo: `support+${ticket.id.toLowerCase()}@${SYSTEM_REPLY_DOMAIN}`,
      },
      metadata: {
        assigneeName: ticket.assignedToName,
        actorName: 'System Triage Dispatcher',
        actorRole: 'SYSTEM',
      },
    });
  }

  return seedList;
}

/**
 * Dispatches a simulated manual test notification for verifying email transparency
 */
export function dispatchManualTestNotification(
  ticket: Ticket,
  actor: User
): DispatchedNotification {
  const subject = `[${ticket.id}] [TEST SIMULATION] Diagnostic Dispatch Audit: ${ticket.title}`;
  const summary = `This is a simulated test notification triggered by ${actor.name} (${actor.role}) to verify outbound email pipeline delivery and template formatting.`;

  const html = buildHtmlEmail({
    title: subject,
    badge: 'SIMULATION TEST',
    badgeColor: '#8b5cf6',
    headline: `Simulated Email Pipeline Verification`,
    recipientName: ticket.requesterName,
    ticket,
    summaryText: summary,
    actionText: 'Verify in HelpDesk Console',
    detailsTable: [
      { label: 'Ticket ID', value: ticket.id },
      { label: 'Status', value: ticket.status },
      { label: 'Initiated By', value: `${actor.name} (${actor.role})` },
      { label: 'Relay Host', value: 'smtp-relay.company.local:587 (Simulated)' },
      { label: 'Verification', value: 'SPF: PASS • DKIM: PASS • DMARC: PASS' },
    ],
    actorName: actor.name,
    actorRole: actor.role,
    quoteBox: {
      label: 'Diagnostics Trace',
      content: `220 smtp-relay.company.local ESMTP Postfix\n250-ENHANCEDSTATUSCODES\n250-PIPELINING\n250-STARTTLS\n250 OK\n250 2.1.0 Sender OK\n250 2.1.5 Recipient OK\n354 End data with <CR><LF>.<CR><LF>\n250 2.0.0 OK: message queued 1042-relay`,
    },
  });

  const plain = buildPlainTextEmail({
    title: subject,
    recipientName: ticket.requesterName,
    ticket,
    summaryText: summary,
    actorName: actor.name,
    actorRole: actor.role,
    quoteBox: {
      label: 'Diagnostics Trace',
      content: 'Simulated SMTP Relay Delivery Status: 250 2.0.0 OK',
    },
  });

  return createNotificationRecord({
    ticket,
    trigger: NotificationTrigger.TEST_DISPATCH,
    recipient: {
      email: ticket.requesterEmail,
      name: ticket.requesterName,
      role: 'Requester',
    },
    subject,
    previewText: `[TEST SIMULATION] Outbound pipeline audit triggered by ${actor.name}.`,
    htmlContent: html,
    plainContent: plain,
    actorName: actor.name,
    actorRole: actor.role,
    metadata: {
      actorName: actor.name,
      actorRole: actor.role,
      reason: 'Manual diagnostic verification of notification pipeline',
    },
  });
}

