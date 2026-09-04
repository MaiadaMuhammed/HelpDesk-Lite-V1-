import React, { useState, useMemo } from 'react';
import {
  DispatchedNotification,
  NotificationTrigger,
  DeliveryStatus,
  Ticket,
  User,
} from '../types/ticket';
import {
  Mail,
  Send,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  Copy,
  Check,
  X,
  Code,
  FileText,
  UserCheck,
  RefreshCw,
  Sparkles,
  Inbox,
  ExternalLink,
  ShieldCheck,
  CheckCheck,
  AlertCircle,
  Bell,
} from 'lucide-react';

interface NotificationHistoryViewProps {
  notifications: DispatchedNotification[];
  ticket: Ticket;
  currentUser: User;
  onSendTestNotification?: () => void;
  onToggleRead?: (notificationId: string, explicitState?: boolean) => void;
  onMarkAllRead?: (onlyStatusAlerts?: boolean) => void;
}

export const NotificationHistoryView: React.FC<NotificationHistoryViewProps> = ({
  notifications,
  ticket,
  currentUser,
  onSendTestNotification,
  onToggleRead,
  onMarkAllRead,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [triggerFilter, setTriggerFilter] = useState<string>('ALL');
  const [recipientFilter, setRecipientFilter] = useState<string>('ALL');
  const [readFilter, setReadFilter] = useState<'ALL' | 'UNREAD_STATUS' | 'UNREAD' | 'READ'>('ALL');
  const [selectedNotification, setSelectedNotification] = useState<DispatchedNotification | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'HTML' | 'PLAIN' | 'HEADERS'>('HTML');

  // Unread counts
  const unreadTotalCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );
  const unreadStatusCount = useMemo(
    () => notifications.filter((n) => !n.isRead && n.trigger === NotificationTrigger.STATUS_CHANGED).length,
    [notifications]
  );

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return notifications.filter((notif) => {
      // Read state filter
      if (readFilter === 'UNREAD_STATUS' && (notif.isRead || notif.trigger !== NotificationTrigger.STATUS_CHANGED)) {
        return false;
      }
      if (readFilter === 'UNREAD' && notif.isRead) {
        return false;
      }
      if (readFilter === 'READ' && !notif.isRead) {
        return false;
      }

      // Trigger filter
      if (triggerFilter !== 'ALL' && notif.trigger !== triggerFilter) {
        return false;
      }
      // Recipient filter
      if (recipientFilter !== 'ALL') {
        if (recipientFilter === 'REQUESTER' && notif.recipient.role !== 'Requester') {
          return false;
        }
        if (recipientFilter === 'STAFF' && notif.recipient.role === 'Requester') {
          return false;
        }
      }
      // Text search
      if (query) {
        const matchesSubject = notif.subject.toLowerCase().includes(query);
        const matchesEmail = notif.recipient.email.toLowerCase().includes(query);
        const matchesName = notif.recipient.name.toLowerCase().includes(query);
        const matchesPreview = notif.previewText.toLowerCase().includes(query);
        const matchesActor = notif.metadata?.actorName?.toLowerCase().includes(query);

        if (!matchesSubject && !matchesEmail && !matchesName && !matchesPreview && !matchesActor) {
          return false;
        }
      }
      return true;
    });
  }, [notifications, searchQuery, triggerFilter, recipientFilter, readFilter]);

  // Copy to clipboard
  const handleCopyHeaders = (notif: DispatchedNotification, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const headersText = `Message-ID: ${notif.headers.messageId}
Date: ${notif.headers.date}
From: ${notif.headers.from}
To: ${notif.headers.to}
Reply-To: ${notif.headers.replyTo}
Subject: ${notif.headers.subject}
X-HelpDesk-Ticket-ID: ${notif.headers.ticketId}
X-HelpDesk-Status: ${notif.headers.status}
X-Priority: ${notif.headers.priority}
SMTP-Status: ${notif.smtpResponseCode}`;

    navigator.clipboard.writeText(headersText);
    setCopiedId(notif.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTriggerIcon = (trigger: NotificationTrigger) => {
    switch (trigger) {
      case NotificationTrigger.STATUS_CHANGED:
        return <RefreshCw className="w-3.5 h-3.5 text-amber-600" />;
      case NotificationTrigger.ASSIGNMENT_CHANGED:
        return <UserCheck className="w-3.5 h-3.5 text-purple-600" />;
      case NotificationTrigger.NEW_MESSAGE:
        return <Mail className="w-3.5 h-3.5 text-blue-600" />;
      case NotificationTrigger.TICKET_CREATED:
        return <Sparkles className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Send className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getTriggerBadge = (trigger: NotificationTrigger) => {
    switch (trigger) {
      case NotificationTrigger.STATUS_CHANGED:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            {getTriggerIcon(trigger)}
            <span>Status Transition</span>
          </span>
        );
      case NotificationTrigger.ASSIGNMENT_CHANGED:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            {getTriggerIcon(trigger)}
            <span>Assignment Update</span>
          </span>
        );
      case NotificationTrigger.NEW_MESSAGE:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {getTriggerIcon(trigger)}
            <span>New Message</span>
          </span>
        );
      case NotificationTrigger.TICKET_CREATED:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {getTriggerIcon(trigger)}
            <span>Ticket Intake</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {getTriggerIcon(trigger)}
            <span>{trigger}</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Header Banner */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-sm">
                Email Dispatch Transparency Log
              </h3>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[11px] font-bold">
                {notifications.length} {notifications.length === 1 ? 'dispatch' : 'dispatches'}
              </span>
              {unreadStatusCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[11px] font-bold animate-pulse">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  {unreadStatusCount} status {unreadStatusCount === 1 ? 'alert' : 'alerts'} unacknowledged
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Audit log of simulated outbound SMTP messages sent for status changes, assignments, and replies
            </p>
          </div>
        </div>

        {/* Action button group */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          {unreadStatusCount > 0 && onMarkAllRead && (
            <button
              type="button"
              id="btn-ack-all-status-alerts"
              onClick={() => onMarkAllRead(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Acknowledge all pending status transition alerts for this ticket"
            >
              <CheckCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Acknowledge Status Alerts ({unreadStatusCount})</span>
            </button>
          )}

          {unreadTotalCount > 0 && onMarkAllRead && (
            <button
              type="button"
              id="btn-mark-all-read"
              onClick={() => onMarkAllRead(false)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Mark all notifications as read"
            >
              <Check className="w-3.5 h-3.5 text-slate-500" />
              <span>Mark All Read</span>
            </button>
          )}

          {onSendTestNotification && (
            <button
              type="button"
              onClick={onSendTestNotification}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
              title="Simulate sending a test email dispatch for this ticket"
            >
              <Send className="w-3.5 h-3.5 text-indigo-600" />
              <span>Simulate Test Dispatch</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Diagnostics & Relay Banner */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            Simulated Relay: <strong className="font-mono text-slate-800">smtp-relay.company.local:587</strong> (TLS 1.3 • SPF pass • DKIM signed)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500">
            {unreadTotalCount === 0 ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                All notifications acknowledged
              </span>
            ) : (
              <span className="text-slate-600 font-medium">
                {unreadTotalCount} unread ({unreadStatusCount} status {unreadStatusCount === 1 ? 'alert' : 'alerts'})
              </span>
            )}
          </span>
          <span className="text-emerald-700 font-medium hidden sm:inline">
            {notifications.length > 0 ? 'Delivery: 250 OK' : 'Standing by'}
          </span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-3 border-b border-slate-200 bg-white space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search text */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="notification-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject, recipient email, name, or content..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                title="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Read State Filter */}
          <div className="shrink-0">
            <select
              id="notification-read-filter"
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value as any)}
              aria-label="Filter notifications by read acknowledgement state"
              className="bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all"
            >
              <option value="ALL">All Read States ({notifications.length})</option>
              <option value="UNREAD_STATUS">
                Unacknowledged Status Alerts ({unreadStatusCount})
              </option>
              <option value="UNREAD">All Unread ({unreadTotalCount})</option>
              <option value="READ">
                Acknowledged / Read ({notifications.length - unreadTotalCount})
              </option>
            </select>
          </div>

          {/* Trigger filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              id="notification-trigger-filter"
              value={triggerFilter}
              onChange={(e) => setTriggerFilter(e.target.value)}
              aria-label="Filter notifications by event trigger"
              className="bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all"
            >
              <option value="ALL">All Event Triggers</option>
              <option value={NotificationTrigger.STATUS_CHANGED}>Status Transitions</option>
              <option value={NotificationTrigger.ASSIGNMENT_CHANGED}>Assignment Changes</option>
              <option value={NotificationTrigger.NEW_MESSAGE}>Replies & Messages</option>
              <option value={NotificationTrigger.TICKET_CREATED}>Ticket Created</option>
            </select>
          </div>

          {/* Recipient Role filter */}
          <div className="shrink-0">
            <select
              id="notification-recipient-filter"
              value={recipientFilter}
              onChange={(e) => setRecipientFilter(e.target.value)}
              aria-label="Filter notifications by recipient role"
              className="bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all"
            >
              <option value="ALL">All Recipients</option>
              <option value="REQUESTER">Requester Only</option>
              <option value="STAFF">Staff / Assignees Only</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(searchQuery || triggerFilter !== 'ALL' || recipientFilter !== 'ALL' || readFilter !== 'ALL') && (
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-indigo-900">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="font-semibold shrink-0">
                Showing {filteredNotifications.length} of {notifications.length} notifications
              </span>
              {readFilter === 'UNREAD_STATUS' && (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-semibold">
                  Status alerts unacknowledged
                </span>
              )}
              {readFilter === 'UNREAD' && (
                <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 px-1.5 py-0.2 rounded font-semibold">
                  Unread only
                </span>
              )}
              {readFilter === 'READ' && (
                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.2 rounded font-semibold">
                  Acknowledged only
                </span>
              )}
              {searchQuery && (
                <span className="text-indigo-600 truncate max-w-[200px]" title={searchQuery}>
                  matching &ldquo;{searchQuery}&rdquo;
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTriggerFilter('ALL');
                setRecipientFilter('ALL');
                setReadFilter('ALL');
              }}
              className="font-medium text-indigo-700 hover:text-indigo-950 underline shrink-0 ml-2 cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Notification Stream List */}
      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50">
            <Inbox className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-xs">No email notifications dispatched yet</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              Whenever the ticket status transitions or messages are added, simulated email notifications are dispatched and logged here.
            </p>
            {onSendTestNotification && (
              <button
                type="button"
                onClick={onSendTestNotification}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Test Email</span>
              </button>
            )}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50">
            <Filter className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
            <p className="font-semibold text-slate-700 text-xs">No matching notifications found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Try adjusting your search criteria or filter selections.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTriggerFilter('ALL');
                setRecipientFilter('ALL');
              }}
              className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-xs text-slate-700 font-medium transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Clear filters</span>
            </button>
          </div>
        ) : (
          filteredNotifications.map((notif, index) => {
            const isUnread = !notif.isRead;
            const isStatusAlert = notif.trigger === NotificationTrigger.STATUS_CHANGED;

            return (
              <div
                key={`${notif.id}-${index}`}
                className={`p-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  isUnread
                    ? isStatusAlert
                      ? 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500'
                      : 'bg-indigo-50/30 hover:bg-indigo-50/60 border-l-4 border-l-indigo-500'
                    : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Event Type Icon Indicator */}
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isUnread && isStatusAlert
                      ? 'bg-amber-100 border-amber-300'
                      : isUnread
                      ? 'bg-indigo-100 border-indigo-300'
                      : 'bg-slate-100 border-slate-200'
                  }`}>
                    {getTriggerIcon(notif.trigger)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Top Bar: Trigger badge, Acknowledgement badge, Recipient pill & Timestamp */}
                    <div className="flex flex-wrap items-center gap-2">
                      {getTriggerBadge(notif.trigger)}

                      {/* Acknowledgement / Read Badge */}
                      {isUnread ? (
                        isStatusAlert ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 shadow-2xs">
                            <AlertCircle className="w-3 h-3 text-amber-600 animate-pulse" />
                            <span>Unacknowledged Status Alert</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                            <span>Unread Alert</span>
                          </span>
                        )
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                          title={notif.readAt ? `Acknowledged at ${new Date(notif.readAt).toLocaleString()}` : 'Acknowledged'}
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Acknowledged</span>
                          {notif.readAt && (
                            <span className="text-slate-400 font-mono text-[9px] hidden sm:inline">
                              {new Date(notif.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </span>
                      )}

                      {/* Recipient tag */}
                      <div className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <span className="font-semibold text-slate-800">{notif.recipient.name}</span>
                        <span className="text-slate-400">&lt;{notif.recipient.email}&gt;</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-white px-1 py-0.2 rounded border border-slate-200 text-indigo-700 ml-0.5">
                          {notif.recipient.role}
                        </span>
                      </div>

                      {/* Sent time */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto sm:ml-0">
                        <Clock className="w-3 h-3" />
                        <span title={new Date(notif.sentAt).toLocaleString()}>
                          {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Subject line */}
                    <p className={`font-semibold truncate ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                      {notif.subject}
                    </p>

                    {/* Preview excerpt */}
                    <p className="text-slate-500 text-[11px] line-clamp-1">
                      {notif.previewText}
                    </p>

                    {/* Relay Status metadata */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-0.5">
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-sans font-bold">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        Delivered (250 OK)
                      </span>
                      <span className="truncate max-w-[280px]">
                        ID: {notif.headers.messageId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center flex-wrap">
                  {/* Mark as Read / Toggle Acknowledged Button */}
                  {onToggleRead && (
                    <button
                      type="button"
                      id={`btn-ack-${notif.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleRead(notif.id, !notif.isRead);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer ${
                        isUnread
                          ? isStatusAlert
                            ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                      title={
                        isUnread
                          ? isStatusAlert
                            ? 'Acknowledge this status change alert'
                            : 'Mark this notification alert as read'
                          : 'Mark alert as unread / unacknowledged'
                      }
                    >
                      {isUnread ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{isStatusAlert ? 'Acknowledge' : 'Mark Read'}</span>
                        </>
                      ) : (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>Mark Unread</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopyHeaders(notif)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="Copy email headers & SMTP envelope"
                  >
                    {copiedId === notif.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Headers</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNotification(notif);
                      setInspectorTab('HTML');
                      if (!notif.isRead && onToggleRead) {
                        onToggleRead(notif.id, true);
                      }
                    }}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="Inspect full HTML email preview (automatically acknowledges alert)"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span>
          Automated notifications ensure stakeholder transparency without manual email writing. Agents can acknowledge alerts to track reviewed updates.
        </span>
        <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400">
          <span>Unacknowledged: {unreadTotalCount}</span>
          <span>•</span>
          <span>Total Outbound: {notifications.length} envelopes</span>
        </div>
      </div>

      {/* Email Inspector Modal */}
      {selectedNotification && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      Simulated Email Inspector
                    </h4>
                    {selectedNotification.isRead ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Acknowledged
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        Unacknowledged Alert
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Subject: {selectedNotification.subject}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onToggleRead && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !selectedNotification.isRead;
                      onToggleRead(selectedNotification.id, nextState);
                      setSelectedNotification({
                        ...selectedNotification,
                        isRead: nextState,
                        readAt: nextState ? new Date().toISOString() : undefined,
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer border ${
                      selectedNotification.isRead
                        ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-xs'
                    }`}
                  >
                    {selectedNotification.isRead ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>Mark Unread</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Acknowledge</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Email Envelope Summary Header */}
            <div className="p-4 bg-slate-100/70 border-b border-slate-200 text-xs space-y-1.5 font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">From: </span>
                  <span className="text-slate-800 font-semibold">{selectedNotification.sender}</span>
                </div>
                <div>
                  <span className="text-slate-500">To: </span>
                  <span className="text-slate-800 font-semibold">
                    {selectedNotification.recipient.name} &lt;{selectedNotification.recipient.email}&gt;
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Reply-To: </span>
                  <span className="text-slate-700">{selectedNotification.headers.replyTo}</span>
                </div>
                <div>
                  <span className="text-slate-500">Date: </span>
                  <span className="text-slate-700">{selectedNotification.headers.date}</span>
                </div>
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-sans font-semibold">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  SMTP Relay Status: 250 OK
                </span>
                <span className="text-slate-500">
                  Priority: {selectedNotification.headers.priority}
                </span>
                <span className="text-slate-400 truncate max-w-xs">
                  ID: {selectedNotification.headers.messageId}
                </span>
              </div>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-4">
              <button
                type="button"
                onClick={() => setInspectorTab('HTML')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  inspectorTab === 'HTML'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Rendered HTML Client View</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('PLAIN')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  inspectorTab === 'PLAIN'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Plain-Text MIME Part</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('HEADERS')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  inspectorTab === 'HEADERS'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>RFC 2822 Headers</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
              {inspectorTab === 'HTML' && (
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                  <iframe
                    title="Simulated Email Preview"
                    srcDoc={selectedNotification.htmlContent}
                    className="w-full h-[460px] border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              )}

              {inspectorTab === 'PLAIN' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-xs">
                  {selectedNotification.plainContent}
                </div>
              )}

              {inspectorTab === 'HEADERS' && (
                <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap overflow-x-auto shadow-inner leading-relaxed">
                  {`Delivered-To: ${selectedNotification.recipient.email}
Received: by 2002:a05:6512:2184:b0:53e:567b:4461 with SMTP id 1042-relay
        for <${selectedNotification.recipient.email}>; ${selectedNotification.headers.date}
Authentication-Results: mx.google.com;
        dkim=pass header.i=@support.company.local header.s=20260904;
        spf=pass (google.com: domain of notifications@support.company.local designates 198.51.100.24 as permitted sender)
Message-ID: ${selectedNotification.headers.messageId}
Date: ${selectedNotification.headers.date}
From: ${selectedNotification.headers.from}
To: ${selectedNotification.headers.to}
Reply-To: ${selectedNotification.headers.replyTo}
Subject: ${selectedNotification.headers.subject}
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="===============HelpDeskBoundary=="
X-Priority: ${selectedNotification.headers.priority}
X-HelpDesk-Ticket-ID: ${selectedNotification.headers.ticketId}
X-HelpDesk-Status: ${selectedNotification.headers.status}
X-HelpDesk-Trigger: ${selectedNotification.trigger}
X-Mailer: HelpDesk Lite Simulated SMTP Engine v1.0

--===============HelpDeskBoundary==
Content-Type: text/plain; charset="utf-8"
Content-Transfer-Encoding: 7bit

${selectedNotification.plainContent}

--===============HelpDeskBoundary==
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: 7bit

[HTML Payload: ${selectedNotification.htmlContent.length} bytes]

--===============HelpDeskBoundary==--`}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">
                Target: <strong>{selectedNotification.recipient.email}</strong> ({selectedNotification.recipient.role})
              </span>

              <div className="flex items-center gap-2">
                {onToggleRead && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !selectedNotification.isRead;
                      onToggleRead(selectedNotification.id, nextState);
                      setSelectedNotification({
                        ...selectedNotification,
                        isRead: nextState,
                        readAt: nextState ? new Date().toISOString() : undefined,
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border ${
                      selectedNotification.isRead
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                    }`}
                  >
                    {selectedNotification.isRead ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>Mark Unread</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Acknowledge</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleCopyHeaders(selectedNotification)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{copiedId === selectedNotification.id ? 'Copied!' : 'Copy Headers'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
