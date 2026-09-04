/**
 * HelpDesk Lite
 * Notification Domain Models & Types
 */

export enum NotificationTrigger {
  STATUS_CHANGED = 'STATUS_CHANGED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  ASSIGNMENT_CHANGED = 'ASSIGNMENT_CHANGED',
  TICKET_CREATED = 'TICKET_CREATED',
  TEST_DISPATCH = 'TEST_DISPATCH',
}

export enum DeliveryStatus {
  DELIVERED = 'DELIVERED',
  DISPATCHED = 'DISPATCHED',
  QUEUED = 'QUEUED',
}

export interface NotificationRecipient {
  email: string;
  name: string;
  role: 'Requester' | 'Assigned Agent' | 'Support Staff' | 'Manager';
}

export interface DispatchedNotification {
  id: string;
  ticketId: string;
  ticketTitle: string;
  trigger: NotificationTrigger;
  recipient: NotificationRecipient;
  sender: string;
  subject: string;
  previewText: string;
  htmlContent: string;
  plainContent: string;
  sentAt: string;
  deliveryStatus: DeliveryStatus;
  smtpResponseCode: string;
  isRead?: boolean;
  readAt?: string;
  headers: {
    messageId: string;
    to: string;
    from: string;
    subject: string;
    date: string;
    ticketId: string;
    status: string;
    priority: string;
    replyTo: string;
  };
  metadata?: {
    fromStatus?: string;
    toStatus?: string;
    assigneeName?: string | null;
    actorName: string;
    actorRole: string;
    reason?: string;
    isPrivateStaffNote?: boolean;
    messageExcerpt?: string;
  };
}
