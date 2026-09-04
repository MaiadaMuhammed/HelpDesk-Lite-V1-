/**
 * HelpDesk Lite (V1 MVP)
 * CSV Export Service
 *
 * Generates structured, RFC-4180 compliant CSV files with UTF-8 BOM
 * for Microsoft Excel, Google Sheets, and data analytics tools.
 * Supports exporting ticket activity threads, append-only audit ledgers,
 * and unified chronological ticket history.
 */

import { Ticket, ActivityMessage, AuditLogEntry, UserRole } from '../types/ticket';

/**
 * Escapes an individual CSV cell value according to RFC 4180 specifications:
 * - Wrap strings with commas, line breaks, or double quotes in double quotes.
 * - Double quote characters inside the text are escaped as two double quotes ("").
 * - Sanitizes formulas (prevent CSV injection starting with =, +, -, @).
 */
export function escapeCSVCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let stringValue = String(value);

  // Prevent CSV formula injection by prepending a single quote if string starts with sensitive formula characters
  if (/^[=+\-@\t\r]/.test(stringValue)) {
    stringValue = `'${stringValue}`;
  }

  // Check if quoting is required
  const needsQuotes =
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r');

  if (needsQuotes) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Converts a 2D array of rows into an RFC-4180 compliant CSV string.
 */
export function buildCSV(rows: (string | number | boolean | null | undefined)[][]): string {
  return rows.map((row) => row.map(escapeCSVCell).join(',')).join('\r\n');
}

export interface UnifiedHistoryRecord {
  timestamp: string;
  recordType: 'ACTIVITY_MESSAGE' | 'AUDIT_LOG';
  ticketId: string;
  ticketTitle: string;
  actorName: string;
  actorRole: string;
  actionOrType: string;
  fromStatus: string;
  toStatus: string;
  privacy: string;
  details: string;
}

/**
 * Compiles a chronological timeline of all activity messages and audit log entries
 * for a specific ticket, respecting role-based visibility.
 */
export function getUnifiedTicketHistory(
  ticket: Ticket,
  userRole: UserRole = UserRole.MANAGER
): UnifiedHistoryRecord[] {
  const records: UnifiedHistoryRecord[] = [];
  const isStaff = userRole === UserRole.AGENT || userRole === UserRole.MANAGER;

  // 1. Ingest Audit Logs
  ticket.auditLogs.forEach((audit) => {
    records.push({
      timestamp: audit.timestamp,
      recordType: 'AUDIT_LOG',
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      actorName: audit.actorName,
      actorRole: audit.actorRole,
      actionOrType: audit.action,
      fromStatus: audit.fromState || '',
      toStatus: audit.toState || '',
      privacy: 'Public Audit',
      details: audit.reason || `Action: ${audit.action}`,
    });
  });

  // 2. Ingest Messages (respecting private staff note visibility)
  ticket.messages.forEach((msg) => {
    if (msg.isPrivateStaffNote && !isStaff) {
      // Omit private staff notes for external Requesters
      return;
    }

    records.push({
      timestamp: msg.createdAt,
      recordType: 'ACTIVITY_MESSAGE',
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      actorName: msg.authorName,
      actorRole: msg.authorRole,
      actionOrType: msg.isPrivateStaffNote ? 'INTERNAL_STAFF_NOTE' : 'PUBLIC_REPLY',
      fromStatus: '',
      toStatus: '',
      privacy: msg.isPrivateStaffNote ? 'Private (Staff Only)' : 'Public (All)',
      details: msg.content,
    });
  });

  // Sort chronologically ascending
  return records.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Generates CSV string for the Unified Ticket History (Activity + Audit).
 */
export function generateUnifiedHistoryCSV(
  ticket: Ticket,
  userRole: UserRole = UserRole.MANAGER
): string {
  const records = getUnifiedTicketHistory(ticket, userRole);

  const header = [
    'Timestamp (UTC)',
    'Timestamp (Formatted)',
    'Record Type',
    'Ticket ID',
    'Ticket Title',
    'Ticket Category',
    'Current Priority',
    'Current Status',
    'Actor Name',
    'Actor Role',
    'Action / Event',
    'From Status',
    'To Status',
    'Privacy Scope',
    'Content / Reason / Details',
  ];

  const rows: (string | number | boolean | null | undefined)[][] = [header];

  records.forEach((rec) => {
    let formattedDate = '';
    try {
      formattedDate = new Date(rec.timestamp).toLocaleString();
    } catch {
      formattedDate = rec.timestamp;
    }

    rows.push([
      rec.timestamp,
      formattedDate,
      rec.recordType,
      rec.ticketId,
      rec.ticketTitle,
      ticket.category,
      ticket.priority,
      ticket.status,
      rec.actorName,
      rec.actorRole,
      rec.actionOrType,
      rec.fromStatus,
      rec.toStatus,
      rec.privacy,
      rec.details,
    ]);
  });

  return buildCSV(rows);
}

/**
 * Generates CSV string specifically for the Ticket Activity Thread.
 */
export function generateActivityThreadCSV(
  ticket: Ticket,
  userRole: UserRole = UserRole.MANAGER
): string {
  const isStaff = userRole === UserRole.AGENT || userRole === UserRole.MANAGER;
  const filteredMessages = ticket.messages.filter((msg) => {
    if (msg.isPrivateStaffNote && !isStaff) return false;
    return true;
  });

  const header = [
    'Message ID',
    'Ticket ID',
    'Created At (UTC)',
    'Created At (Formatted)',
    'Author Name',
    'Author Role',
    'Is Private Staff Note',
    'Privacy Scope',
    'Message Content',
  ];

  const rows: (string | number | boolean | null | undefined)[][] = [header];

  filteredMessages.forEach((msg) => {
    let formattedDate = '';
    try {
      formattedDate = new Date(msg.createdAt).toLocaleString();
    } catch {
      formattedDate = msg.createdAt;
    }

    rows.push([
      msg.id,
      ticket.id,
      msg.createdAt,
      formattedDate,
      msg.authorName,
      msg.authorRole,
      msg.isPrivateStaffNote ? 'YES' : 'NO',
      msg.isPrivateStaffNote ? 'Private (Staff Only)' : 'Public (All)',
      msg.content,
    ]);
  });

  return buildCSV(rows);
}

/**
 * Generates CSV string specifically for the Append-Only Audit Trail.
 */
export function generateAuditTrailCSV(ticket: Ticket): string {
  const header = [
    'Audit Entry ID',
    'Ticket ID',
    'Timestamp (UTC)',
    'Timestamp (Formatted)',
    'Actor Name',
    'Actor Role',
    'Action Taken',
    'From Status',
    'To Status',
    'Reason / Justification',
  ];

  const rows: (string | number | boolean | null | undefined)[][] = [header];

  ticket.auditLogs.forEach((log) => {
    let formattedDate = '';
    try {
      formattedDate = new Date(log.timestamp).toLocaleString();
    } catch {
      formattedDate = log.timestamp;
    }

    rows.push([
      log.id,
      ticket.id,
      log.timestamp,
      formattedDate,
      log.actorName,
      log.actorRole,
      log.action,
      log.fromState || '',
      log.toState || '',
      log.reason || '',
    ]);
  });

  return buildCSV(rows);
}

/**
 * Triggers a browser file download of the given CSV string.
 * Prepends a UTF-8 Byte Order Mark (BOM) `\uFEFF` so Microsoft Excel
 * correctly recognizes UTF-8 encoding (symbols, emojis, international characters).
 */
export function downloadCSVFile(csvContent: string, filename: string): void {
  const UTF8_BOM = '\uFEFF';
  const blob = new Blob([UTF8_BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  // Safe browser download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
