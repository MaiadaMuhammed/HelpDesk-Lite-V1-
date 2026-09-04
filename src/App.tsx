/**
 * HelpDesk Lite (V1 MVP)
 * HDL-06 Ticket State Machine & Lifecycle Studio
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  User,
  UserRole,
  AuditAction,
  TicketAttachment,
  NotificationTrigger,
} from './types/ticket';
import {
  mockRequester,
  mockAgent,
  mockAgentTwo,
  mockManager,
  TEST_SUITE,
} from './engine/stateMachine.test';
import { useTicketLifecycle } from './hooks/useTicketLifecycle';
import { LifecycleStepper } from './components/LifecycleStepper';
import { ManagerMetrics } from './components/ManagerMetrics';
import { ActivityThread } from './components/ActivityThread';
import { AuditTrailView } from './components/AuditTrailView';
import { TestRunnerView } from './components/TestRunnerView';
import { TicketSubmissionModal } from './components/TicketSubmissionModal';
import { TicketAttachmentList } from './components/TicketAttachmentList';
import { NotificationHistoryView } from './components/NotificationHistoryView';
import { ExportCSVModal } from './components/ExportCSVModal';
import {
  dispatchStatusChangeNotification,
  dispatchNewMessageNotification,
  dispatchAssignmentNotification,
  dispatchTicketCreatedNotification,
  dispatchManualTestNotification,
  generateSeedNotifications,
  toggleNotificationReadStatus,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from './services/notificationService';
import { simulatePollCycle } from './services/pollingService';
import { DispatchedNotification } from './types/ticket';
import {
  SAMPLE_VPN_LOG,
  SAMPLE_SAML_LOG,
  SAMPLE_VPN_SCREENSHOT_DATA_URL,
  SAMPLE_BADGE_PHOTO_DATA_URL,
  SAMPLE_PDF_DATA_URL,
  SAMPLE_CONFIG_JSON,
  SAMPLE_METRICS_CSV,
} from './utils/sampleAttachmentData';
import {
  Inbox,
  Filter,
  Plus,
  UserCheck,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck,
  Bug,
  BookOpen,
  Layers,
  Sparkles,
  CheckCircle2,
  Mail,
  Eye,
  X,
  RefreshCw,
  Play,
  Pause,
  Radio,
  FileSpreadsheet,
  Download,
  Bell,
  CheckCheck,
} from 'lucide-react';

const RAW_INITIAL_SEED_TICKETS: Ticket[] = [
  {
    id: 'HDL-1042',
    title: 'VPN disconnects every 15 minutes during remote session',
    description: 'Cisco AnyConnect drops authentication handshake intermittently on macOS Sequoia.',
    category: TicketCategory.IT,
    priority: TicketPriority.HIGH,
    status: TicketStatus.NEW,
    requesterId: mockRequester.id,
    requesterName: mockRequester.name,
    requesterEmail: mockRequester.email,
    assignedToId: null,
    assignedToName: null,
    attachments: [
      {
        id: 'att_1042_img',
        name: 'vpn_error_dialog.png',
        sizeBytes: 84920,
        mimeType: 'image/svg+xml',
        url: SAMPLE_VPN_SCREENSHOT_DATA_URL,
        uploadedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'att_1042_log',
        name: 'vpn_debug.log',
        sizeBytes: 12288,
        mimeType: 'text/plain',
        url: 'data:text/plain;charset=utf-8,' + encodeURIComponent(SAMPLE_VPN_LOG),
        uploadedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'att_1042_dtls',
        name: 'dtls_handshake_trace.log',
        sizeBytes: 8192,
        mimeType: 'text/x-log',
        url: 'data:text/plain;charset=utf-8,' + encodeURIComponent('2026-09-04 07:45:15.002 [DTLS] Handshake initiated with cipher TLS_AES_256_GCM_SHA384\n2026-09-04 07:45:15.110 [DTLS] Master secret derived successfully\n2026-09-04 08:00:22.010 [DTLS] Bad record MAC detected on epoch 2 seq 4881\n2026-09-04 08:00:22.012 [DTLS] Sending Alert 20 (bad_record_mac) to gateway'),
        uploadedAt: new Date(Date.now() - 3500000).toISOString(),
      },
      {
        id: 'att_1042_cfg',
        name: 'cisco_anyconnect_profile.json',
        sizeBytes: 2048,
        mimeType: 'application/json',
        url: 'data:application/json;charset=utf-8,' + encodeURIComponent(SAMPLE_CONFIG_JSON),
        uploadedAt: new Date(Date.now() - 3400000).toISOString(),
      },
      {
        id: 'att_1042_csv',
        name: 'network_latency_metrics.csv',
        sizeBytes: 4096,
        mimeType: 'text/csv',
        url: 'data:text/csv;charset=utf-8,' + encodeURIComponent(SAMPLE_METRICS_CSV),
        uploadedAt: new Date(Date.now() - 3300000).toISOString(),
      },
      {
        id: 'att_1042_pdf',
        name: 'vpn_troubleshooting_guide.pdf',
        sizeBytes: 184320,
        mimeType: 'application/pdf',
        url: SAMPLE_PDF_DATA_URL,
        uploadedAt: new Date(Date.now() - 3200000).toISOString(),
      },
    ],
    messages: [
      {
        id: 'msg_1',
        ticketId: 'HDL-1042',
        authorId: mockRequester.id,
        authorName: mockRequester.name,
        authorRole: UserRole.REQUESTER,
        content: 'I have attached the debug log from ~/Library/Logs/Cisco and a screenshot of the popup.',
        isPrivateStaffNote: false,
        createdAt: new Date(Date.now() - 3500000).toISOString(),
      },
    ],
    auditLogs: [
      {
        id: 'audit_0',
        ticketId: 'HDL-1042',
        actorId: mockRequester.id,
        actorName: mockRequester.name,
        actorRole: UserRole.REQUESTER,
        action: AuditAction.TICKET_CREATED,
        fromState: undefined,
        toState: TicketStatus.NEW,
        reason: 'Ticket submitted via portal',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    firstResponseAt: null,
    resolvedAt: null,
    closedAt: null,
    slaDueAt: new Date(Date.now() + 6 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'HDL-1041',
    title: 'New hire onboarding badge & building access card',
    description: 'Need Level 2 server room & 4th-floor biometric access for new site reliability engineer.',
    category: TicketCategory.FACILITIES,
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.ASSIGNED,
    requesterId: 'usr_emp_99',
    requesterName: 'David Chen',
    requesterEmail: 'david.chen@company.local',
    assignedToId: mockAgent.id,
    assignedToName: mockAgent.name,
    attachments: [
      {
        id: 'att_1041_pdf',
        name: 'building_access_form.pdf',
        sizeBytes: 245760,
        mimeType: 'application/pdf',
        url: SAMPLE_PDF_DATA_URL,
        uploadedAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'att_1041_photo',
        name: 'id_badge_photo.png',
        sizeBytes: 45056,
        mimeType: 'image/svg+xml',
        url: SAMPLE_BADGE_PHOTO_DATA_URL,
        uploadedAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
    messages: [
      {
        id: 'msg_2',
        ticketId: 'HDL-1041',
        authorId: mockAgent.id,
        authorName: mockAgent.name,
        authorRole: UserRole.AGENT,
        content: 'Internal facilities approval received. Queued badge printing for tomorrow morning.',
        isPrivateStaffNote: true, // Private staff note
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
    auditLogs: [
      {
        id: 'audit_1',
        ticketId: 'HDL-1041',
        actorId: mockManager.id,
        actorName: mockManager.name,
        actorRole: UserRole.MANAGER,
        action: AuditAction.ASSIGNMENT_CHANGE,
        fromState: TicketStatus.NEW,
        toState: TicketStatus.ASSIGNED,
        reason: 'Assigned to Alex Rivera for badge fulfillment',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
    firstResponseAt: new Date(Date.now() - 7100000).toISOString(),
    resolvedAt: null,
    closedAt: null,
    slaDueAt: new Date(Date.now() + 18 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 8000000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'HDL-1039',
    title: 'Benefits portal login error - SSO SAML token expired',
    description: 'Workday returns SAML assertion response invalid.',
    category: TicketCategory.HR,
    priority: TicketPriority.CRITICAL,
    status: TicketStatus.IN_PROGRESS,
    requesterId: 'usr_emp_44',
    requesterName: 'Karen Miller',
    requesterEmail: 'karen.miller@company.local',
    assignedToId: mockAgentTwo.id,
    assignedToName: mockAgentTwo.name,
    attachments: [
      {
        id: 'att_1039_log',
        name: 'saml_assertion_trace.log',
        sizeBytes: 4096,
        mimeType: 'text/plain',
        url: 'data:text/plain;charset=utf-8,' + encodeURIComponent(SAMPLE_SAML_LOG),
        uploadedAt: new Date(Date.now() - 15000000).toISOString(),
      },
    ],
    messages: [],
    auditLogs: [],
    firstResponseAt: new Date(Date.now() - 15000000).toISOString(),
    resolvedAt: null,
    closedAt: null,
    slaDueAt: new Date(Date.now() - 3600000).toISOString(), // Overdue SLA breach!
    createdAt: new Date(Date.now() - 20000000).toISOString(),
    updatedAt: new Date(Date.now() - 5000000).toISOString(),
  },
];

const INITIAL_SEED_TICKETS: Ticket[] = RAW_INITIAL_SEED_TICKETS.map((t) => ({
  ...t,
  notifications: generateSeedNotifications(t),
}));

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(mockAgent);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_SEED_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(INITIAL_SEED_TICKETS[0].id);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'STUDIO' | 'TEST_SUITE' | 'DOCS'>('STUDIO');
  const [subPanelView, setSubPanelView] = useState<'SPLIT' | 'NOTIFICATIONS' | 'MESSAGES' | 'AUDIT'>('SPLIT');
  const [rightPanelTab, setRightPanelTab] = useState<'NOTIFICATIONS' | 'AUDIT'>('NOTIFICATIONS');
  const [transitionReason, setTransitionReason] = useState<string>('');
  const [toastNotification, setToastNotification] = useState<{
    id: string;
    count: number;
    recipientName: string;
    recipientEmail: string;
    subject: string;
    trigger: string;
  } | null>(null);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const triggerToastNotification = (notifs: DispatchedNotification[]) => {
    if (!notifs.length) return;
    const first = notifs[0];
    setToastNotification({
      id: `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      count: notifs.length,
      recipientName: first.recipient.name,
      recipientEmail: first.recipient.email,
      subject: first.subject,
      trigger: first.trigger,
    });
    setTimeout(() => {
      setToastNotification((prev) => (prev?.subject === first.subject ? null : prev));
    }, 6000);
  };

  // Lifecycle hook for active ticket
  const {
    ticket: currentTicket,
    availableNextStates,
    isTransitioning,
    lastError,
    clearError,
    transitionTo,
    assignToAgent,
    resetTicket,
  } = useTicketLifecycle({
    initialTicket: activeTicket,
    currentUser,
    onTransitionSuccess: (updatedTicket, auditEntry) => {
      let newNotifs: DispatchedNotification[] = [];

      if (auditEntry.action === AuditAction.STATE_TRANSITION) {
        if (auditEntry.fromState && auditEntry.toState) {
          newNotifs = dispatchStatusChangeNotification(
            updatedTicket,
            auditEntry.fromState,
            auditEntry.toState,
            currentUser,
            auditEntry.reason
          );
        }
      } else if (auditEntry.action === AuditAction.ASSIGNMENT_CHANGE) {
        newNotifs = dispatchAssignmentNotification(
          updatedTicket,
          updatedTicket.assignedToId
            ? { id: updatedTicket.assignedToId, name: updatedTicket.assignedToName || '' }
            : null,
          currentUser,
          auditEntry.reason
        );
      }

      const mergedTicket: Ticket = {
        ...updatedTicket,
        notifications: [...(updatedTicket.notifications || []), ...newNotifs],
      };

      setTickets((prev) =>
        prev.map((t) => (t.id === mergedTicket.id ? mergedTicket : t))
      );
      resetTicket(mergedTicket);
      setTransitionReason('');

      if (newNotifs.length > 0) {
        triggerToastNotification(newNotifs);
      }
    },
  });

  // Sync active ticket selection
  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    const target = tickets.find((t) => t.id === ticketId);
    if (target) {
      resetTicket(target);
    }
    clearError();
  };

  // ---------------------------------------------------------------------------
  // Simulated Polling Mechanism (30-second interval)
  // Keeps the ticket dashboard and status live without requiring manual interaction.
  // ---------------------------------------------------------------------------
  const [isPollingEnabled, setIsPollingEnabled] = useState<boolean>(true);
  const [secondsUntilNextPoll, setSecondsUntilNextPoll] = useState<number>(30);
  const [isPollSyncing, setIsPollSyncing] = useState<boolean>(false);
  const [lastPollTime, setLastPollTime] = useState<Date>(new Date());
  const [lastPollSummary, setLastPollSummary] = useState<string | null>(null);

  const ticketsRef = useRef<Ticket[]>(tickets);
  ticketsRef.current = tickets;
  const selectedTicketIdRef = useRef<string>(selectedTicketId);
  selectedTicketIdRef.current = selectedTicketId;

  const handleExecutePoll = useCallback(() => {
    setIsPollSyncing(true);
    setLastPollTime(new Date());
    setSecondsUntilNextPoll(30);

    const result = simulatePollCycle(ticketsRef.current);

    if (result.hasUpdates && result.affectedTicket) {
      setLastPollSummary(result.summary);
      setTickets(result.updatedTickets);

      // If the updated ticket is currently active, refresh lifecycle state
      if (result.affectedTicket.id === selectedTicketIdRef.current) {
        resetTicket(result.affectedTicket);
      }

      if (result.dispatchedNotifications.length > 0) {
        triggerToastNotification(result.dispatchedNotifications);
      }
    }

    setTimeout(() => {
      setIsPollSyncing(false);
    }, 500);
  }, [resetTicket]);

  // Periodic polling countdown: purely decrements counter every second
  useEffect(() => {
    if (!isPollingEnabled) return;

    const timer = setInterval(() => {
      setSecondsUntilNextPoll((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPollingEnabled]);

  // Trigger poll cycle cleanly when timer reaches 0
  useEffect(() => {
    if (secondsUntilNextPoll === 0 && isPollingEnabled) {
      handleExecutePoll();
    }
  }, [secondsUntilNextPoll, isPollingEnabled, handleExecutePoll]);

  const handleAddNewTicket = (newTicket: Ticket) => {
    const newNotifs = dispatchTicketCreatedNotification(newTicket, currentUser);
    const finalTicket: Ticket = {
      ...newTicket,
      notifications: [...(newTicket.notifications || []), ...newNotifs],
    };

    setTickets((prev) => [finalTicket, ...prev]);
    setSelectedTicketId(finalTicket.id);
    resetTicket(finalTicket);

    if (newNotifs.length > 0) {
      triggerToastNotification(newNotifs);
    }
  };

  const handleAddAttachment = (newAttachment: TicketAttachment) => {
    const updated = {
      ...currentTicket,
      attachments: [...(currentTicket.attachments || []), newAttachment],
      updatedAt: new Date().toISOString(),
    };
    resetTicket(updated);
    setTickets((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    const updated = {
      ...currentTicket,
      attachments: (currentTicket.attachments || []).filter((a) => a.id !== attachmentId),
      updatedAt: new Date().toISOString(),
    };
    resetTicket(updated);
    setTickets((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  const handleSendMessage = (content: string, isPrivateStaffNote: boolean) => {
    const uniqueMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newMessage = {
      id: uniqueMessageId,
      ticketId: currentTicket.id,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content,
      isPrivateStaffNote,
      createdAt: new Date().toISOString(),
    };

    const firstResponseAt =
      !currentTicket.firstResponseAt &&
      (currentUser.role === UserRole.AGENT || currentUser.role === UserRole.MANAGER)
        ? new Date().toISOString()
        : currentTicket.firstResponseAt;

    const newNotifs = dispatchNewMessageNotification(currentTicket, newMessage, currentUser);

    const updated = {
      ...currentTicket,
      firstResponseAt,
      messages: [...currentTicket.messages, newMessage],
      notifications: [...(currentTicket.notifications || []), ...newNotifs],
      updatedAt: new Date().toISOString(),
    };

    resetTicket(updated);
    setTickets((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );

    if (newNotifs.length > 0) {
      triggerToastNotification(newNotifs);
    }
  };

  const handleSendManualTestNotification = () => {
    const testNotif = dispatchManualTestNotification(currentTicket, currentUser);
    const updated: Ticket = {
      ...currentTicket,
      notifications: [...(currentTicket.notifications || []), testNotif],
      updatedAt: new Date().toISOString(),
    };
    resetTicket(updated);
    setTickets((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    triggerToastNotification([testNotif]);
  };

  const handleToggleNotificationRead = (notificationId: string, explicitState?: boolean) => {
    const updatedNotifs = toggleNotificationReadStatus(
      currentTicket.notifications || [],
      notificationId,
      explicitState
    );
    const updated: Ticket = {
      ...currentTicket,
      notifications: updatedNotifs,
      updatedAt: new Date().toISOString(),
    };
    resetTicket(updated);
    setTickets((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  const handleMarkAllNotificationsRead = (onlyStatusAlerts: boolean = false) => {
    const updatedNotifs = markAllNotificationsAsRead(
      currentTicket.notifications || [],
      onlyStatusAlerts
    );
    const updated: Ticket = {
      ...currentTicket,
      notifications: updatedNotifs,
      updatedAt: new Date().toISOString(),
    };
    resetTicket(updated);
    setTickets((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  const currentTicketUnreadTotalCount = (currentTicket.notifications || []).filter(
    (n) => !n.isRead
  ).length;

  const currentTicketUnreadStatusCount = (currentTicket.notifications || []).filter(
    (n) => !n.isRead && n.trigger === NotificationTrigger.STATUS_CHANGED
  ).length;

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased">
      {/* Top Application Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-base text-slate-900">
                  HelpDesk Lite
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  V1 MVP • HDL-06
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                5-State Finite State Machine & Lifecycle Engine
              </p>
            </div>
          </div>

          {/* Role Switcher & New Ticket Button */}
          <div className="flex items-center gap-3">
            {/* Active User Simulator */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
              <span className="text-[11px] font-medium text-slate-500 pl-1 hidden md:inline">
                Simulate Actor:
              </span>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === mockRequester.id) setCurrentUser(mockRequester);
                  else if (val === mockAgent.id) setCurrentUser(mockAgent);
                  else if (val === mockAgentTwo.id) setCurrentUser(mockAgentTwo);
                  else if (val === mockManager.id) setCurrentUser(mockManager);
                  clearError();
                }}
                className="bg-white border border-slate-300 rounded px-2 py-1 font-semibold text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={mockAgent.id}>Alex Rivera (Agent)</option>
                <option value={mockAgentTwo.id}>Marcus Vance (Agent)</option>
                <option value={mockRequester.id}>Sarah Jenkins (Requester)</option>
                <option value={mockManager.id}>Elena Rostova (Manager)</option>
              </select>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  currentUser.role === UserRole.REQUESTER
                    ? 'bg-slate-200 text-slate-700'
                    : currentUser.role === UserRole.AGENT
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                {currentUser.role}
              </span>
            </div>

            <button
              type="button"
              id="btn-new-ticket"
              onClick={() => setIsSubmissionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Ticket</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('STUDIO')}
              className={`px-3 py-2 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'STUDIO'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Ticket Lifecycle Studio
            </button>
            <button
              onClick={() => setActiveTab('TEST_SUITE')}
              className={`px-3 py-2 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'TEST_SUITE'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              HDL-06 Verification Suite
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                {TEST_SUITE.length} Tests
              </span>
            </button>
            <button
              onClick={() => setActiveTab('DOCS')}
              className={`px-3 py-2 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'DOCS'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              API Contracts & Specs
            </button>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
              <span className={`w-2 h-2 rounded-full ${isPollingEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-medium text-slate-700">
                Polling: <span className="font-semibold text-slate-900">{isPollingEnabled ? `Active (every 30s • in ${secondsUntilNextPoll}s)` : 'Paused'}</span>
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-slate-500">
              Synced: <strong className="text-slate-700">{lastPollTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Manager Live Metric Cards (Unassigned, Overdue Breaches, FRT) */}
        <ManagerMetrics tickets={tickets} />

        {activeTab === 'STUDIO' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Queue Panel: Tickets list & filters */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                {/* Live Polling Status & Queue Controls Header */}
                <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between text-xs border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      {isPollingEnabled ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                      )}
                    </span>
                    <span className="font-semibold text-slate-200 text-[11px] flex items-center gap-1">
                      <span>{isPollingEnabled ? 'Live Polling' : 'Polling Paused'}</span>
                    </span>
                    <span className="text-[10px] text-indigo-300 font-mono">
                      {isPollingEnabled ? `(30s • in ${secondsUntilNextPoll}s)` : '(paused)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      id="btn-toggle-polling"
                      onClick={() => setIsPollingEnabled(!isPollingEnabled)}
                      title={isPollingEnabled ? 'Pause automated polling' : 'Resume automated polling'}
                      className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px] flex items-center gap-1 border border-slate-700"
                    >
                      {isPollingEnabled ? (
                        <>
                          <Pause className="w-3 h-3 text-amber-300" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-emerald-400" />
                          <span>Resume</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      id="btn-force-poll"
                      onClick={handleExecutePoll}
                      disabled={isPollSyncing}
                      title="Poll immediately for ticket updates"
                      className="px-2.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1 cursor-pointer text-[10px] font-semibold disabled:opacity-50 shadow-xs"
                    >
                      <RefreshCw className={`w-3 h-3 ${isPollSyncing ? 'animate-spin' : ''}`} />
                      <span>Poll Now</span>
                    </button>
                  </div>
                </div>

                {/* Polling Activity Summary Banner */}
                {lastPollSummary && (
                  <div className="px-3.5 py-1.5 bg-indigo-50/90 border-b border-indigo-100 flex items-center justify-between text-[11px] text-indigo-950">
                    <span className="truncate pr-2 font-medium flex items-center gap-1">
                      <Radio className="w-3 h-3 text-indigo-600 shrink-0 animate-pulse" />
                      <span className="truncate">{lastPollSummary}</span>
                    </span>
                    <span className="text-[10px] text-indigo-600 shrink-0 font-mono">
                      {lastPollTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Filters */}
                <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Inbox className="w-4 h-4 text-slate-600" />
                      Ticket Queue
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {filteredTickets.length} tickets
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <label className="block text-slate-500 font-medium mb-0.5">Category</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1 text-slate-800 focus:outline-none"
                      >
                        <option value="ALL">All Categories</option>
                        <option value={TicketCategory.IT}>IT</option>
                        <option value={TicketCategory.HR}>HR</option>
                        <option value={TicketCategory.FACILITIES}>Facilities</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-medium mb-0.5">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded p-1 text-slate-800 focus:outline-none"
                      >
                        <option value="ALL">All States</option>
                        <option value={TicketStatus.NEW}>NEW</option>
                        <option value={TicketStatus.ASSIGNED}>ASSIGNED</option>
                        <option value={TicketStatus.IN_PROGRESS}>IN_PROGRESS</option>
                        <option value={TicketStatus.RESOLVED}>RESOLVED</option>
                        <option value={TicketStatus.CLOSED}>CLOSED</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Queue List */}
                <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                  {filteredTickets.map((t) => {
                    const isSelected = t.id === currentTicket.id;
                    const isOverdue =
                      t.status !== TicketStatus.RESOLVED &&
                      t.status !== TicketStatus.CLOSED &&
                      new Date(t.slaDueAt).getTime() < Date.now();

                    const ticketUnreadStatusCount = (t.notifications || []).filter(
                      (n) => !n.isRead && n.trigger === NotificationTrigger.STATUS_CHANGED
                    ).length;

                    return (
                      <div
                        key={t.id}
                        id={`queue-item-${t.id}`}
                        onClick={() => handleSelectTicket(t.id)}
                        className={`p-3.5 cursor-pointer transition-colors text-xs ${
                          isSelected
                            ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                            : 'hover:bg-slate-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono font-bold text-slate-700">
                            {t.id}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {ticketUnreadStatusCount > 0 && (
                              <span
                                className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5 animate-pulse"
                                title={`${ticketUnreadStatusCount} unacknowledged status alert(s)`}
                              >
                                <Bell className="w-2.5 h-2.5 text-amber-600" />
                                {ticketUnreadStatusCount}
                              </span>
                            )}
                            {isOverdue && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                                Overdue
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.status === TicketStatus.NEW
                                  ? 'bg-amber-100 text-amber-800'
                                  : t.status === TicketStatus.ASSIGNED
                                  ? 'bg-blue-100 text-blue-800'
                                  : t.status === TicketStatus.IN_PROGRESS
                                  ? 'bg-purple-100 text-purple-800'
                                  : t.status === TicketStatus.RESOLVED
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                        </div>

                        <div className="font-medium text-slate-900 line-clamp-1">
                          {t.title}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            {t.category}
                          </span>
                          <span>
                            {t.assignedToName ? t.assignedToName : 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Panel: State Machine Inspector & Active Ticket Details */}
            <div className="lg:col-span-8 space-y-6">
              {/* Ticket Header & Single-Agent Manual Assignment */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {currentTicket.id}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {currentTicket.category}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          currentTicket.priority === TicketPriority.CRITICAL
                            ? 'bg-rose-100 text-rose-800 font-bold'
                            : currentTicket.priority === TicketPriority.HIGH
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {currentTicket.priority} Priority
                      </span>
                    </div>
                    <h1 className="text-lg font-bold text-slate-900 leading-snug">
                      {currentTicket.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mt-1">
                      <span>Requester: <strong className="text-slate-700">{currentTicket.requesterName}</strong></span>
                      <span>•</span>
                      <span>SLA Target: <strong className="text-slate-700">{new Date(currentTicket.slaDueAt).toLocaleDateString()} {new Date(currentTicket.slaDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setSubPanelView('NOTIFICATIONS')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 transition-colors cursor-pointer"
                        title="View Outbound Email Transparency Log & Acknowledge Status Alerts"
                      >
                        <Mail className="w-3 h-3 text-indigo-600" />
                        <span>{(currentTicket.notifications || []).length} Dispatched Emails</span>
                        {currentTicketUnreadStatusCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                            {currentTicketUnreadStatusCount} status alert{currentTicketUnreadStatusCount === 1 ? '' : 's'} to acknowledge
                          </span>
                        )}
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        id="btn-header-export-csv"
                        onClick={() => setIsExportModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                        title="Export current ticket activity thread & audit trail to CSV"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                        <span>Export to CSV</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      id="btn-quick-export-csv"
                      onClick={() => setIsExportModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs w-full justify-center"
                      title="Export ticket activity & audit logs to CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Export History (CSV)</span>
                    </button>

                    {/* Single-Agent Assignment Widget */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs min-w-[200px] w-full">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Single-Agent Assignee</span>
                      </div>

                    {currentTicket.status === TicketStatus.CLOSED ? (
                      <div className="text-slate-500 font-medium">
                        {currentTicket.assignedToName || 'Unassigned (Closed)'}
                      </div>
                    ) : currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.AGENT ? (
                      <select
                        value={currentTicket.assignedToId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            assignToAgent(null, 'Unassigned ticket back to pool');
                          } else if (val === mockAgent.id) {
                            assignToAgent({ id: mockAgent.id, name: mockAgent.name });
                          } else if (val === mockAgentTwo.id) {
                            assignToAgent({ id: mockAgentTwo.id, name: mockAgentTwo.name });
                          }
                        }}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">-- Unassigned (Triage Pool) --</option>
                        <option value={mockAgent.id}>Alex Rivera (Support Agent)</option>
                        <option value={mockAgentTwo.id}>Marcus Vance (Support Agent)</option>
                      </select>
                    ) : (
                      <div className="font-semibold text-slate-800">
                        {currentTicket.assignedToName || 'Unassigned (In Triage)'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 text-xs text-slate-700 leading-relaxed">
                <p>{currentTicket.description}</p>
              </div>
              </div>

              {/* Attachments Section with Thumbnails, Specific Mime Icons & Direct Downloads */}
              <TicketAttachmentList
                attachments={currentTicket.attachments || []}
                onAddAttachment={handleAddAttachment}
                onRemoveAttachment={handleRemoveAttachment}
                readOnly={currentTicket.status === TicketStatus.CLOSED}
              />

              {/* 5-State Finite State Machine Visual Stepper */}
              <LifecycleStepper
                currentStatus={currentTicket.status}
                allowedNextStates={availableNextStates}
                userRole={currentUser.role}
                disabled={isTransitioning}
                onTransition={(target) => {
                  transitionTo(target, {
                    reason: transitionReason || `Moved to ${target} by ${currentUser.name}`,
                  });
                }}
              />

              {/* State Transition Feedback & Error Banner */}
              {lastError && (
                <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-start gap-3 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">
                        {lastError.name}
                      </span>
                      <span className="font-mono text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded font-semibold">
                        {lastError.code}
                      </span>
                    </div>
                    <p className="mt-1 text-rose-700">{lastError.message}</p>
                  </div>
                  <button
                    onClick={clearError}
                    className="text-xs font-semibold underline text-rose-800 hover:text-rose-950"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Transition Control & Edge Case Tester */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>State Transition Engine Controls</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Actor: {currentUser.name} ({currentUser.role})
                  </span>
                </div>

                {/* Reason input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Optional transition reason / notes..."
                    value={transitionReason}
                    onChange={(e) => setTransitionReason(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Permitted Transitions for Active Role */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Authorized Next Transitions ({availableNextStates.length})
                  </div>
                  {availableNextStates.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-xs">
                      {currentTicket.status === TicketStatus.CLOSED
                        ? 'Ticket is permanently CLOSED (Terminal state). No transitions permitted.'
                        : `User with role '${currentUser.role}' has no authorized next transitions from ${currentTicket.status}. Switch to Manager or Agent to proceed.`}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableNextStates.map((target) => (
                        <button
                          key={target}
                          id={`btn-transition-${target.toLowerCase()}`}
                          disabled={isTransitioning}
                          onClick={() => {
                            transitionTo(target, {
                              reason:
                                transitionReason ||
                                `Transitioned from ${currentTicket.status} to ${target}`,
                            });
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Move to {target}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Deliberate Illegal State Jump Tester (For QA Verification) */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Test Illegal Jumps & Enforcements (Throws Domain Errors)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      QA Test Matrix
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => transitionTo(TicketStatus.IN_PROGRESS)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 text-[11px] text-slate-600 transition-colors"
                    >
                      Attempt Skip to IN_PROGRESS
                    </button>
                    <button
                      type="button"
                      onClick={() => transitionTo(TicketStatus.RESOLVED)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 text-[11px] text-slate-600 transition-colors"
                    >
                      Attempt Skip to RESOLVED
                    </button>
                    <button
                      type="button"
                      onClick={() => transitionTo(TicketStatus.CLOSED)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 text-[11px] text-slate-600 transition-colors"
                    >
                      Attempt Direct Skip to CLOSED
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-panel Stream Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setSubPanelView('SPLIT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      subPanelView === 'SPLIT'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Split Workspace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubPanelView('NOTIFICATIONS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      subPanelView === 'NOTIFICATIONS'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email History Log</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        subPanelView === 'NOTIFICATIONS'
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {(currentTicket.notifications || []).length}
                    </span>
                    {currentTicketUnreadStatusCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs animate-pulse">
                        {currentTicketUnreadStatusCount} new
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubPanelView('MESSAGES')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      subPanelView === 'MESSAGES'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Discussion</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        subPanelView === 'MESSAGES'
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {currentTicket.messages.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubPanelView('AUDIT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      subPanelView === 'AUDIT'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Audit Trail</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        subPanelView === 'AUDIT'
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {currentTicket.auditLogs.length}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-subpanel-export-csv"
                    onClick={() => setIsExportModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Export activity messages & audit logs to CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Export to CSV</span>
                  </button>
                  <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Outbound SMTP Dispatch Simulator Active</span>
                  </div>
                </div>
              </div>

              {/* Sub-panels: Dynamic View Selection */}
              {subPanelView === 'SPLIT' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ActivityThread
                    messages={currentTicket.messages}
                    currentUser={currentUser}
                    onSendMessage={handleSendMessage}
                    onExportCSV={() => setIsExportModalOpen(true)}
                    disabled={currentTicket.status === TicketStatus.CLOSED}
                  />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-200/80 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setRightPanelTab('NOTIFICATIONS')}
                        className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          rightPanelTab === 'NOTIFICATIONS'
                            ? 'bg-white text-indigo-700 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email Notifications</span>
                        <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold">
                          {(currentTicket.notifications || []).length}
                        </span>
                        {currentTicketUnreadStatusCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                            {currentTicketUnreadStatusCount}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRightPanelTab('AUDIT')}
                        className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          rightPanelTab === 'AUDIT'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>State Audit Trail</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold">
                          {currentTicket.auditLogs.length}
                        </span>
                      </button>
                    </div>

                    {rightPanelTab === 'NOTIFICATIONS' ? (
                      <NotificationHistoryView
                        notifications={currentTicket.notifications || []}
                        ticket={currentTicket}
                        currentUser={currentUser}
                        onSendTestNotification={handleSendManualTestNotification}
                        onToggleRead={handleToggleNotificationRead}
                        onMarkAllRead={handleMarkAllNotificationsRead}
                      />
                    ) : (
                      <AuditTrailView
                        auditLogs={currentTicket.auditLogs}
                        onExportCSV={() => setIsExportModalOpen(true)}
                      />
                    )}
                  </div>
                </div>
              )}

              {subPanelView === 'NOTIFICATIONS' && (
                <NotificationHistoryView
                  notifications={currentTicket.notifications || []}
                  ticket={currentTicket}
                  currentUser={currentUser}
                  onSendTestNotification={handleSendManualTestNotification}
                  onToggleRead={handleToggleNotificationRead}
                  onMarkAllRead={handleMarkAllNotificationsRead}
                />
              )}

              {subPanelView === 'MESSAGES' && (
                <ActivityThread
                  messages={currentTicket.messages}
                  currentUser={currentUser}
                  onSendMessage={handleSendMessage}
                  onExportCSV={() => setIsExportModalOpen(true)}
                  disabled={currentTicket.status === TicketStatus.CLOSED}
                />
              )}

              {subPanelView === 'AUDIT' && (
                <AuditTrailView
                  auditLogs={currentTicket.auditLogs}
                  onExportCSV={() => setIsExportModalOpen(true)}
                />
              )}
            </div>
          </div>
        )}

        {/* Verification Test Suite Tab */}
        {activeTab === 'TEST_SUITE' && <TestRunnerView />}

        {/* API Contracts & Documentation Tab */}
        {activeTab === 'DOCS' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs text-slate-700">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">
                HDL-06 Architectural Specification & Transition Contract
              </h2>
              <p className="text-slate-500">
                Formal rules governing ticket state mutations, single-ownership invariants, and RBAC authorization.
              </p>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                    <th className="p-2.5 border-r border-slate-200">From State</th>
                    <th className="p-2.5 border-r border-slate-200">Allowed Target State</th>
                    <th className="p-2.5 border-r border-slate-200">Authorized Roles</th>
                    <th className="p-2.5 border-r border-slate-200">Assignee Guard</th>
                    <th className="p-2.5">Domain Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="p-2.5 font-bold text-amber-700 border-r border-slate-200">NEW</td>
                    <td className="p-2.5 text-blue-700 font-bold border-r border-slate-200">ASSIGNED</td>
                    <td className="p-2.5 border-r border-slate-200">AGENT, MANAGER</td>
                    <td className="p-2.5 border-r border-slate-200 text-emerald-700">REQUIRED</td>
                    <td className="p-2.5 font-sans">Single agent claims or manager assigns.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-blue-700 border-r border-slate-200">ASSIGNED</td>
                    <td className="p-2.5 text-purple-700 font-bold border-r border-slate-200">IN_PROGRESS</td>
                    <td className="p-2.5 border-r border-slate-200">AGENT, MANAGER</td>
                    <td className="p-2.5 border-r border-slate-200 text-emerald-700">REQUIRED</td>
                    <td className="p-2.5 font-sans">Investigation and active engineering initiated.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-blue-700 border-r border-slate-200">ASSIGNED</td>
                    <td className="p-2.5 text-amber-700 font-bold border-r border-slate-200">NEW</td>
                    <td className="p-2.5 border-r border-slate-200">AGENT, MANAGER</td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-500">OPTIONAL (Resets to null)</td>
                    <td className="p-2.5 font-sans">De-escalation back to unassigned triage pool.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-purple-700 border-r border-slate-200">IN_PROGRESS</td>
                    <td className="p-2.5 text-emerald-700 font-bold border-r border-slate-200">RESOLVED</td>
                    <td className="p-2.5 border-r border-slate-200">AGENT, MANAGER</td>
                    <td className="p-2.5 border-r border-slate-200 text-emerald-700">REQUIRED</td>
                    <td className="p-2.5 font-sans">Solution confirmed; sets resolvedAt timestamp.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-purple-700 border-r border-slate-200">IN_PROGRESS</td>
                    <td className="p-2.5 text-blue-700 font-bold border-r border-slate-200">ASSIGNED</td>
                    <td className="p-2.5 border-r border-slate-200">AGENT, MANAGER</td>
                    <td className="p-2.5 border-r border-slate-200 text-emerald-700">REQUIRED</td>
                    <td className="p-2.5 font-sans">Work paused (waiting on vendor/hardware).</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-700 border-r border-slate-200">RESOLVED</td>
                    <td className="p-2.5 text-slate-700 font-bold border-r border-slate-200">CLOSED</td>
                    <td className="p-2.5 border-r border-slate-200">REQUESTER, MANAGER</td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-500">OPTIONAL</td>
                    <td className="p-2.5 font-sans">Terminal state. Permanent lock applied.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-700 border-r border-slate-200">RESOLVED</td>
                    <td className="p-2.5 text-purple-700 font-bold border-r border-slate-200">IN_PROGRESS</td>
                    <td className="p-2.5 border-r border-slate-200">REQUESTER, MANAGER, AGENT</td>
                    <td className="p-2.5 border-r border-slate-200 text-emerald-700">REQUIRED</td>
                    <td className="p-2.5 font-sans">Reopened if problem recurs; clears resolvedAt.</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-2.5 font-bold text-slate-800 border-r border-slate-200">CLOSED</td>
                    <td className="p-2.5 text-rose-700 font-bold border-r border-slate-200">NONE</td>
                    <td className="p-2.5 border-r border-slate-200">NONE</td>
                    <td className="p-2.5 border-r border-slate-200">N/A</td>
                    <td className="p-2.5 font-sans text-rose-700 font-medium">Throws ImmutableStateError on any mutation.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Error Taxonomy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">InvalidStateTransitionError</div>
                <div className="font-mono text-[10px] text-slate-500 mb-2">code: 'ERR_INVALID_STATE_TRANSITION'</div>
                <p className="text-slate-600">
                  Triggered when an operation attempts to bypass intermediate lifecycle steps (e.g. NEW direct to IN_PROGRESS or CLOSED).
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">UnauthorizedStateTransitionError</div>
                <div className="font-mono text-[10px] text-slate-500 mb-2">code: 'ERR_UNAUTHORIZED_TRANSITION'</div>
                <p className="text-slate-600">
                  Triggered when an authenticated actor attempts a transition disallowed for their role (e.g. Requester resolving a ticket).
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">MissingAssigneeError</div>
                <div className="font-mono text-[10px] text-slate-500 mb-2">code: 'ERR_MISSING_ASSIGNEE'</div>
                <p className="text-slate-600">
                  Enforces single ownership. Moving to ASSIGNED or IN_PROGRESS requires an assigned agent identifier.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">ImmutableStateError</div>
                <div className="font-mono text-[10px] text-slate-500 mb-2">code: 'ERR_IMMUTABLE_TERMINAL_STATE'</div>
                <p className="text-slate-600">
                  Guarantees CLOSED tickets are read-only and immutable. State transitions or reassignments throw immediately.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Ticket Submission Modal */}
      <TicketSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        onSubmitTicket={handleAddNewTicket}
        currentUser={currentUser}
      />

      {/* Export CSV Modal */}
      {isExportModalOpen && (
        <ExportCSVModal
          ticket={currentTicket}
          currentUser={currentUser}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* Outbound Email Dispatch Toast Banner */}
      {toastNotification && (
        <aside
          aria-label="Email notification status"
          className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 p-4 animate-in slide-in-from-bottom-5 duration-200 flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs">
            <Mail className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                <span>Simulated Email Dispatched</span>
                {toastNotification.count > 1 && (
                  <span className="bg-indigo-600/80 px-1.5 py-0.2 rounded text-[10px] text-white font-mono">
                    +{toastNotification.count}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setToastNotification(null)}
                className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="font-semibold text-slate-100 mt-0.5 truncate">
              {toastNotification.subject}
            </p>
            <p className="text-slate-400 text-[11px] truncate mt-0.5">
              Recipient: <strong className="text-slate-200">{toastNotification.recipientEmail}</strong> ({toastNotification.recipientName})
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSubPanelView('NOTIFICATIONS');
                  setRightPanelTab('NOTIFICATIONS');
                  setToastNotification(null);
                }}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                <span>Inspect in Log</span>
              </button>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                250 OK Delivered
              </span>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
