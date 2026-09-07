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
  Search,
  CheckCheck,
  LogOut,
  User as UserIcon,
  Zap,
  Copy,
  Check,
  Timer,
  ArrowUpRight,
} from 'lucide-react';
import {
  getSlaCalculation,
  QueueViewPreset,
  filterByQueuePreset,
} from './utils/smartHelpers';
import { AuthGateway } from './components/AuthGateway';
import {
  UserProfile,
  getActiveAuthUser,
  setActiveAuthUser,
  getStoredProfiles,
  PROFILE_MAIADA_EMPLOYEE,
  PROFILE_EMAN_SUPPORT,
  PROFILE_HUDA_MANAGER,
  getInitials,
} from './services/authService';

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
        reason: 'Assigned to Eman Mostafa for badge fulfillment',
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
  {
    id: 'HDL-1038',
    title: 'Dual monitor arm clamp adjustment for ergonomic workstation',
    description: 'Desk 4B needs dual display arms repositioned and cable guide installed.',
    category: TicketCategory.FACILITIES,
    priority: TicketPriority.LOW,
    status: TicketStatus.RESOLVED,
    requesterId: PROFILE_MAIADA_EMPLOYEE.id,
    requesterName: PROFILE_MAIADA_EMPLOYEE.name,
    requesterEmail: PROFILE_MAIADA_EMPLOYEE.email,
    assignedToId: PROFILE_EMAN_SUPPORT.id,
    assignedToName: PROFILE_EMAN_SUPPORT.name,
    attachments: [],
    messages: [
      {
        id: 'msg_1038_1',
        ticketId: 'HDL-1038',
        authorId: PROFILE_EMAN_SUPPORT.id,
        authorName: PROFILE_EMAN_SUPPORT.name,
        authorRole: UserRole.AGENT,
        content: 'Adjusted display mounts to recommended eye level and secured safety clips.',
        isPrivateStaffNote: false,
        createdAt: new Date(Date.now() - 4000000).toISOString(),
      },
    ],
    auditLogs: [],
    firstResponseAt: new Date(Date.now() - 6000000).toISOString(),
    resolvedAt: new Date(Date.now() - 4000000).toISOString(),
    closedAt: null,
    slaDueAt: new Date(Date.now() + 48 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 10000000).toISOString(),
    updatedAt: new Date(Date.now() - 4000000).toISOString(),
  },
];

const INITIAL_SEED_TICKETS: Ticket[] = RAW_INITIAL_SEED_TICKETS.map((t) => ({
  ...t,
  notifications: generateSeedNotifications(t),
}));

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getActiveAuthUser());
  const [availableProfiles, setAvailableProfiles] = useState<UserProfile[]>(() => getStoredProfiles());

  const effectiveUser: User = currentUser || PROFILE_MAIADA_EMPLOYEE;

  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_SEED_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(INITIAL_SEED_TICKETS[0].id);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [queuePreset, setQueuePreset] = useState<QueueViewPreset>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  // Keyboard shortcut: Press '/' or 'Cmd+K' to focus the search bar from anywhere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCopyTicketSummary = (ticket: Ticket) => {
    const summary = `[${ticket.id}] ${ticket.title} (Status: ${ticket.status}, Priority: ${ticket.priority})`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(summary);
      setCopyFeedback(`Copied ${ticket.id}`);
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

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
    currentUser: effectiveUser,
    onTransitionSuccess: (updatedTicket, auditEntry) => {
      let newNotifs: DispatchedNotification[] = [];

      if (auditEntry.action === AuditAction.STATE_TRANSITION) {
        if (auditEntry.fromState && auditEntry.toState) {
          newNotifs = dispatchStatusChangeNotification(
            updatedTicket,
            auditEntry.fromState,
            auditEntry.toState,
            effectiveUser,
            auditEntry.reason
          );
        }
      } else if (auditEntry.action === AuditAction.ASSIGNMENT_CHANGE) {
        newNotifs = dispatchAssignmentNotification(
          updatedTicket,
          updatedTicket.assignedToId
            ? { id: updatedTicket.assignedToId, name: updatedTicket.assignedToName || '' }
            : null,
          effectiveUser,
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

  const handleSignOut = () => {
    setActiveAuthUser(null);
    setCurrentUser(null);
  };

  const handleSwitchProfile = (profileId: string) => {
    const target = availableProfiles.find((p) => p.id === profileId);
    if (target) {
      setActiveAuthUser(target);
      setCurrentUser(target);
      clearError();
    }
  };

  const availableSupportAgents = [
    ...availableProfiles.filter((p) => p.role === UserRole.AGENT),
    mockAgentTwo,
  ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

  // Smart Preset Counts
  const allCount = tickets.length;
  const myTicketsCount = tickets.filter((t) =>
    effectiveUser.role === UserRole.REQUESTER
      ? t.requesterId === effectiveUser.id || t.requesterEmail.toLowerCase() === effectiveUser.email.toLowerCase()
      : t.assignedToId === effectiveUser.id
  ).length;
  const unassignedCount = tickets.filter(
    (t) => t.status === TicketStatus.NEW || (!t.assignedToId && t.status !== TicketStatus.CLOSED)
  ).length;
  const urgentCount = tickets.filter((t) => {
    const isCritical = t.priority === TicketPriority.CRITICAL || (t.priority as string) === 'URGENT';
    const isOverdue =
      t.status !== TicketStatus.RESOLVED &&
      t.status !== TicketStatus.CLOSED &&
      new Date(t.slaDueAt).getTime() < Date.now();
    return isCritical || isOverdue;
  }).length;

  // Filtered tickets with Smart Preset & compound filters
  const presetTickets = filterByQueuePreset(tickets, queuePreset, effectiveUser);

  const filteredTickets = presetTickets.filter((t) => {
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL') {
      if (priorityFilter === 'URGENT' || priorityFilter === TicketPriority.CRITICAL) {
        if (t.priority !== TicketPriority.CRITICAL && (t.priority as string) !== 'URGENT') {
          return false;
        }
      } else if (t.priority !== priorityFilter) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = t.id.toLowerCase().includes(q);
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchRequester = t.requesterName.toLowerCase().includes(q);
      const matchAssignee = (t.assignedToName || '').toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchRequester && !matchAssignee) {
        return false;
      }
    }
    return true;
  });

  // If no user is authenticated, render the AuthGateway login / sign-up screen at the first of the app
  if (!currentUser) {
    return (
      <AuthGateway
        onLoginSuccess={(user) => {
          setActiveAuthUser(user);
          setCurrentUser(user);
          setAvailableProfiles(getStoredProfiles());
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col antialiased">
      {/* Top Application Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900">
                  HelpDesk Lite
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                  V1 MVP • HDL-06
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                5-State Finite State Machine
              </p>
            </div>
          </div>

          {/* Authenticated Profile Switcher & New Ticket Button */}
          <div className="flex items-center gap-2.5">
            {/* Active User Card & Switcher */}
            <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <div
                className={`w-6 h-6 rounded-md ${
                  currentUser.avatarColor || 'bg-slate-800 text-white'
                } flex items-center justify-center font-medium text-[11px] shrink-0`}
              >
                {getInitials(currentUser.name)}
              </div>

              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-xs text-slate-900 leading-tight">
                    {currentUser.name}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider ${
                      currentUser.role === UserRole.REQUESTER
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : currentUser.role === UserRole.AGENT
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                    }`}
                  >
                    {currentUser.role === UserRole.REQUESTER
                      ? 'Employee'
                      : currentUser.role === UserRole.AGENT
                      ? 'Support'
                      : 'Manager'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight truncate max-w-[130px] hidden sm:inline">
                  {currentUser.department || currentUser.email}
                </span>
              </div>

              {/* Profile Switcher Dropdown */}
              <div className="pl-1 border-l border-slate-100 ml-1">
                <select
                  value={currentUser.id}
                  onChange={(e) => handleSwitchProfile(e.target.value)}
                  title="Switch between the 3 profiles or custom accounts"
                  className="bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 font-medium text-slate-800 text-[11px] focus:outline-none focus:border-slate-800 cursor-pointer"
                >
                  <optgroup label="Official Profiles">
                    <option value={PROFILE_MAIADA_EMPLOYEE.id}>Maiada Muhammed (Employee)</option>
                    <option value={PROFILE_EMAN_SUPPORT.id}>Eman Mostafa (Support)</option>
                    <option value={PROFILE_HUDA_MANAGER.id}>Huda Tarek (Manager)</option>
                  </optgroup>
                  {availableProfiles.filter((p) => !p.isPredefined).length > 0 && (
                    <optgroup label="Custom Profiles">
                      {availableProfiles
                        .filter((p) => !p.isPredefined)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.role})
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                id="btn-header-signout"
                onClick={handleSignOut}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ml-0.5"
                title="Sign Out & Return to Login / Sign Up screen"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              id="btn-new-ticket"
              onClick={() => setIsSubmissionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Ticket</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('STUDIO')}
              className={`py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 text-xs ${
                activeTab === 'STUDIO'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Ticket Lifecycle Studio
            </button>
            <button
              onClick={() => setActiveTab('TEST_SUITE')}
              className={`py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 text-xs ${
                activeTab === 'TEST_SUITE'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              Verification Suite
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-medium">
                {TEST_SUITE.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('DOCS')}
              className={`py-2.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 text-xs ${
                activeTab === 'DOCS'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              API Contracts & Specs
            </button>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-md">
              <span className={`w-1.5 h-1.5 rounded-full ${isPollingEnabled ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span className="text-slate-600 font-medium">
                Polling: <span className="text-slate-900 font-normal">{isPollingEnabled ? `Active (30s)` : 'Paused'}</span>
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-slate-400">
              Synced: <strong className="text-slate-600 font-normal">{lastPollTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
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
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                {/* Live Polling Status & Queue Controls Header */}
                <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      {isPollingEnabled ? (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      ) : (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                      )}
                    </span>
                    <span className="font-medium text-slate-700 text-[11px] flex items-center gap-1">
                      <span>{isPollingEnabled ? 'Live Polling' : 'Polling Paused'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isPollingEnabled ? `(30s)` : '(paused)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      id="btn-toggle-polling"
                      onClick={() => setIsPollingEnabled(!isPollingEnabled)}
                      title={isPollingEnabled ? 'Pause automated polling' : 'Resume automated polling'}
                      className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer text-[10px] flex items-center gap-1 border border-slate-200 font-medium"
                    >
                      {isPollingEnabled ? (
                        <>
                          <Pause className="w-2.5 h-2.5 text-amber-500" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-2.5 h-2.5 text-emerald-600" />
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
                      className="px-2.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1 cursor-pointer text-[10px] font-medium disabled:opacity-50"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isPollSyncing ? 'animate-spin' : ''}`} />
                      <span>Poll Now</span>
                    </button>
                  </div>
                </div>

                {/* Polling Activity Summary Banner */}
                {lastPollSummary && (
                  <div className="px-3.5 py-1.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="truncate pr-2 flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span className="truncate">{lastPollSummary}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {lastPollTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Filters */}
                <div className="p-3 border-b border-slate-100 bg-white space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Inbox className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ticket Queue</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {(searchQuery.trim() || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || queuePreset !== 'ALL') && (
                        <button
                          type="button"
                          id="btn-clear-filters"
                          onClick={() => {
                            setSearchQuery('');
                            setQueuePreset('ALL');
                            setPriorityFilter('ALL');
                            setCategoryFilter('ALL');
                            setStatusFilter('ALL');
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer underline"
                          title="Reset search and filters"
                        >
                          Clear all
                        </button>
                      )}
                      <span className="text-[11px] font-mono text-slate-400">
                        {filteredTickets.length} tickets
                      </span>
                    </div>
                  </div>

                  {/* Smart Queue Presets */}
                  <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100/90 rounded-lg text-[10px] font-medium">
                    <button
                      type="button"
                      id="preset-all"
                      onClick={() => setQueuePreset('ALL')}
                      className={`py-1 px-1 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        queuePreset === 'ALL'
                          ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="All active tickets in the queue"
                    >
                      <span>All</span>
                      <span className="font-mono text-[9px] text-slate-400">({allCount})</span>
                    </button>

                    <button
                      type="button"
                      id="preset-my-tickets"
                      onClick={() => setQueuePreset('MY_TICKETS')}
                      className={`py-1 px-1 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        queuePreset === 'MY_TICKETS'
                          ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title={effectiveUser.role === UserRole.REQUESTER ? 'Tickets requested by you' : 'Tickets assigned to you'}
                    >
                      <span>{effectiveUser.role === UserRole.REQUESTER ? 'Mine' : 'Assigned'}</span>
                      <span className="font-mono text-[9px] text-slate-400">({myTicketsCount})</span>
                    </button>

                    <button
                      type="button"
                      id="preset-unassigned"
                      onClick={() => setQueuePreset('UNASSIGNED')}
                      className={`py-1 px-1 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        queuePreset === 'UNASSIGNED'
                          ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Unassigned tickets awaiting agent triage or claim"
                    >
                      <span>Triage</span>
                      <span className="font-mono text-[9px] text-slate-400">({unassignedCount})</span>
                    </button>

                    <button
                      type="button"
                      id="preset-urgent"
                      onClick={() => setQueuePreset('URGENT')}
                      className={`py-1 px-1 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        queuePreset === 'URGENT'
                          ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Tickets with critical priority or overdue SLA"
                    >
                      <span>Urgent</span>
                      <span className={`font-mono text-[9px] ${urgentCount > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                        ({urgentCount})
                      </span>
                    </button>
                  </div>

                  {/* Real-Time Search Field (Title, ID, Requester, Assignee) */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <input
                      ref={searchInputRef}
                      id="input-ticket-search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search ID, title, requester... (Press /)"
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-md pl-8 pr-12 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
                      autoComplete="off"
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                      {searchQuery ? (
                        <button
                          type="button"
                          id="btn-clear-search"
                          onClick={() => setSearchQuery('')}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                          title="Clear search"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <kbd className="hidden sm:inline-block text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded font-mono border border-slate-300/60 pointer-events-none">
                          /
                        </kbd>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    {/* Priority Level Dropdown (urgent, High, Medium, Low) */}
                    <div>
                      <label htmlFor="filter-priority" className="block text-slate-400 font-medium mb-0.5 flex items-center justify-between">
                        <span>Priority</span>
                        {priorityFilter !== 'ALL' && (
                          <span className={`text-[10px] font-semibold ${
                            priorityFilter === TicketPriority.CRITICAL || priorityFilter === 'URGENT'
                              ? 'text-rose-600'
                              : priorityFilter === TicketPriority.HIGH
                              ? 'text-amber-600'
                              : priorityFilter === TicketPriority.MEDIUM
                              ? 'text-blue-600'
                              : 'text-slate-600'
                          }`}>
                            Filtered
                          </span>
                        )}
                      </label>
                      <select
                        id="filter-priority"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-md px-2 py-1 text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer"
                      >
                        <option value="ALL">All Priorities</option>
                        <option value={TicketPriority.CRITICAL}>Urgent</option>
                        <option value={TicketPriority.HIGH}>High</option>
                        <option value={TicketPriority.MEDIUM}>Medium</option>
                        <option value={TicketPriority.LOW}>Low</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="filter-category" className="block text-slate-400 font-medium mb-0.5">Category</label>
                        <select
                          id="filter-category"
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200/80 rounded-md px-2 py-1 text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer"
                        >
                          <option value="ALL">All Categories</option>
                          <option value={TicketCategory.IT}>IT</option>
                          <option value={TicketCategory.HR}>HR</option>
                          <option value={TicketCategory.FACILITIES}>Facilities</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="filter-status" className="block text-slate-400 font-medium mb-0.5">Status</label>
                        <select
                          id="filter-status"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200/80 rounded-md px-2 py-1 text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer"
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
                </div>

                {/* Queue List */}
                <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                  {filteredTickets.map((t) => {
                    const isSelected = t.id === currentTicket.id;
                    const sla = getSlaCalculation(t);

                    const ticketUnreadStatusCount = (t.notifications || []).filter(
                      (n) => !n.isRead && n.trigger === NotificationTrigger.STATUS_CHANGED
                    ).length;

                    return (
                      <div
                        key={t.id}
                        id={`queue-item-${t.id}`}
                        onClick={() => handleSelectTicket(t.id)}
                        className={`p-3 cursor-pointer transition-colors text-xs ${
                          isSelected
                            ? 'bg-slate-100/90 border-l-2 border-slate-900'
                            : 'hover:bg-slate-50/70 border-l-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-semibold text-slate-700">
                              {t.id}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${sla.badgeClass}`}>
                              {sla.shortLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {ticketUnreadStatusCount > 0 && (
                              <span
                                className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/70 flex items-center gap-0.5"
                                title={`${ticketUnreadStatusCount} unacknowledged status alert(s)`}
                              >
                                <Bell className="w-2.5 h-2.5 text-amber-600" />
                                {ticketUnreadStatusCount}
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                                t.status === TicketStatus.NEW
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                                  : t.status === TicketStatus.ASSIGNED
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200/60'
                                  : t.status === TicketStatus.IN_PROGRESS
                                  ? 'bg-purple-50 text-purple-800 border border-purple-200/60'
                                  : t.status === TicketStatus.RESOLVED
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                        </div>

                        <div className="font-medium text-slate-800 line-clamp-1 mb-1">
                          {t.title}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[9px] font-semibold flex items-center justify-center shrink-0"
                              title={`Requester: ${t.requesterName}`}
                            >
                              {t.requesterName.charAt(0)}
                            </span>
                            <span>{t.category}</span>
                            <span className="text-slate-300">•</span>
                            <span
                              className={`font-medium ${
                                t.priority === TicketPriority.CRITICAL
                                  ? 'text-rose-600'
                                  : t.priority === TicketPriority.HIGH
                                  ? 'text-amber-600'
                                  : t.priority === TicketPriority.MEDIUM
                                  ? 'text-blue-600'
                                  : 'text-slate-500'
                              }`}
                            >
                              {t.priority === TicketPriority.CRITICAL
                                ? 'Urgent'
                                : t.priority === TicketPriority.HIGH
                                ? 'High'
                                : t.priority === TicketPriority.MEDIUM
                                ? 'Medium'
                                : 'Low'}
                            </span>
                          </div>
                          <span className="truncate max-w-[90px]" title={t.assignedToName || 'Unassigned'}>
                            {t.assignedToName ? t.assignedToName : 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {filteredTickets.length === 0 && (
                    <div className="p-6 text-center text-slate-500 space-y-2">
                      <Filter className="w-5 h-5 mx-auto text-slate-300" />
                      <p className="text-xs font-medium text-slate-700">No matching tickets</p>
                      <p className="text-[11px] text-slate-400">
                        {searchQuery.trim()
                          ? `No tickets match "${searchQuery}" with the current criteria.`
                          : queuePreset !== 'ALL'
                          ? `No tickets in the "${queuePreset}" view with active filters.`
                          : 'No tickets match the selected filter criteria.'}
                      </p>
                      <button
                        type="button"
                        id="btn-reset-filters-empty"
                        onClick={() => {
                          setSearchQuery('');
                          setQueuePreset('ALL');
                          setPriorityFilter('ALL');
                          setCategoryFilter('ALL');
                          setStatusFilter('ALL');
                        }}
                        className="text-xs text-slate-800 hover:text-slate-900 font-medium underline cursor-pointer"
                      >
                        Reset view & filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel: State Machine Inspector & Active Ticket Details */}
            <div className="lg:col-span-8 space-y-6">
              {/* Ticket Header & Single-Agent Manual Assignment */}
              {(() => {
                const currentSla = getSlaCalculation(currentTicket);
                return (
                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                            {currentTicket.id}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/60">
                            {currentTicket.category}
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded ${
                              currentTicket.priority === TicketPriority.CRITICAL
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                : currentTicket.priority === TicketPriority.HIGH
                                ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                : 'bg-slate-50 text-slate-600 border border-slate-200/60'
                            }`}
                          >
                            {currentTicket.priority === TicketPriority.CRITICAL ? 'Urgent' : currentTicket.priority} Priority
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${currentSla.badgeClass}`}>
                            {currentSla.shortLabel}
                          </span>
                        </div>
                        <h1 className="text-base font-semibold text-slate-900 leading-snug">
                          {currentTicket.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1.5">
                          <span>Requester: <strong className="text-slate-700 font-medium">{currentTicket.requesterName}</strong></span>
                          <span className="text-slate-300">•</span>
                          <span>SLA Due: <strong className="text-slate-700 font-medium">{new Date(currentTicket.slaDueAt).toLocaleDateString()} {new Date(currentTicket.slaDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => setSubPanelView('NOTIFICATIONS')}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 transition-colors cursor-pointer"
                            title="View Outbound Email Transparency Log & Acknowledge Status Alerts"
                          >
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{(currentTicket.notifications || []).length} Emails</span>
                            {currentTicketUnreadStatusCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-amber-500 text-white">
                                {currentTicketUnreadStatusCount} new
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5 w-full">
                          <button
                            type="button"
                            id="btn-copy-ticket-summary"
                            onClick={() => handleCopyTicketSummary(currentTicket)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            title="Copy ticket ID and title to clipboard"
                          >
                            {copyFeedback ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-semibold">{copyFeedback}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy Info</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            id="btn-quick-export-csv"
                            onClick={() => setIsExportModalOpen(true)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            title="Export ticket activity & audit logs to CSV"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>Export CSV</span>
                          </button>
                        </div>

                        {/* Quick Claim Action for Agents/Managers */}
                        {(!currentTicket.assignedToId || currentTicket.assignedToId !== currentUser.id) &&
                          currentTicket.status !== TicketStatus.CLOSED &&
                          (currentUser.role === UserRole.AGENT || currentUser.role === UserRole.MANAGER) && (
                            <button
                              type="button"
                              id="btn-quick-claim"
                              onClick={() => {
                                assignToAgent({ id: currentUser.id, name: currentUser.name }, 'Claimed via 1-click action');
                                if (currentTicket.status === TicketStatus.NEW) {
                                  transitionTo(TicketStatus.ASSIGNED, { reason: `Auto-assigned on claim by ${currentUser.name}` });
                                }
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 text-indigo-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              title="Instantly claim and assign this ticket to yourself"
                            >
                              <Zap className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{currentTicket.assignedToId ? 'Reassign to Me' : 'Claim Ticket'}</span>
                            </button>
                        )}

                        {/* Single-Agent Assignment Widget */}
                        <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-2.5 text-xs min-w-[200px] w-full">
                          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                            <UserCheck className="w-3 h-3 text-slate-500" />
                            <span>Assignee</span>
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
                              } else {
                                const selectedAgent = availableSupportAgents.find((a) => a.id === val);
                                if (selectedAgent) {
                                  assignToAgent({ id: selectedAgent.id, name: selectedAgent.name });
                                }
                              }
                            }}
                            className="w-full bg-white border border-slate-200 rounded-md p-1 font-medium text-slate-800 focus:outline-none focus:border-slate-800 cursor-pointer text-xs"
                          >
                            <option value="">-- Unassigned (Triage Pool) --</option>
                            {availableSupportAgents.map((agt) => (
                              <option key={agt.id} value={agt.id}>
                                {agt.name} ({agt.role === UserRole.AGENT ? 'Support' : agt.role})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="font-semibold text-slate-800">
                            {currentTicket.assignedToName || 'Unassigned (In Triage)'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Smart SLA Urgency & Health Tracker */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Timer className={`w-3.5 h-3.5 ${currentSla.isBreached ? 'text-rose-500' : currentSla.isNearBreach ? 'text-amber-500' : 'text-emerald-500'}`} />
                      <span className="text-slate-600 font-medium">SLA Resolution Target:</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${currentSla.badgeClass}`}>
                        {currentSla.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 min-w-[150px]">
                      <span className="text-[10px] text-slate-400 font-mono">{currentSla.progressPercent}% elapsed</span>
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden w-24">
                        <div
                          className={`h-full transition-all ${
                            currentSla.isBreached
                              ? 'bg-rose-500'
                              : currentSla.isNearBreach
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${currentSla.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 text-xs text-slate-700 leading-relaxed">
                    <p>{currentTicket.description}</p>
                  </div>
                </div>
              );
            })()}

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
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                    <span>State Transition Engine</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
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
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-800 bg-slate-50/50"
                  />
                </div>

                {/* Permitted Transitions for Active Role */}
                <div>
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                    Authorized Next Transitions ({availableNextStates.length})
                  </div>
                  {availableNextStates.length === 0 ? (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 text-slate-500 text-xs">
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
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Move to {target}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Deliberate Illegal State Jump Tester (For QA Verification) */}
                <div className="pt-2.5 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                      Test Illegal Jumps & Enforcements
                    </span>
                    <span className="text-[10px] text-slate-400">
                      QA Test Matrix
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => transitionTo(TicketStatus.IN_PROGRESS)}
                      className="px-2 py-1 rounded-md bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200/80 text-[11px] text-slate-600 transition-colors cursor-pointer"
                    >
                      Skip to IN_PROGRESS
                    </button>
                    <button
                      type="button"
                      onClick={() => transitionTo(TicketStatus.RESOLVED)}
                      className="px-2 py-1 rounded-md bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200/80 text-[11px] text-slate-600 transition-colors cursor-pointer"
                    >
                      Skip to RESOLVED
                    </button>
                    <button
                      type="button"
                      onClick={() => transitionTo(TicketStatus.CLOSED)}
                      className="px-2 py-1 rounded-md bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200/80 text-[11px] text-slate-600 transition-colors cursor-pointer"
                    >
                      Skip to CLOSED
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-panel Stream Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
                <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setSubPanelView('SPLIT')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      subPanelView === 'SPLIT'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Split Workspace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubPanelView('NOTIFICATIONS')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      subPanelView === 'NOTIFICATIONS'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email History</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-medium ${
                        subPanelView === 'NOTIFICATIONS'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      {(currentTicket.notifications || []).length}
                    </span>
                    {currentTicketUnreadStatusCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-amber-500 text-white">
                        {currentTicketUnreadStatusCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubPanelView('MESSAGES')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      subPanelView === 'MESSAGES'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Discussion</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-medium ${
                        subPanelView === 'MESSAGES'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      {currentTicket.messages.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubPanelView('AUDIT')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      subPanelView === 'AUDIT'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Audit Trail</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-medium ${
                        subPanelView === 'AUDIT'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-slate-200/70 text-slate-600'
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
                    className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Export activity messages & audit logs to CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export CSV</span>
                  </button>
                  <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Outbound SMTP Simulator Active</span>
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
                    <div className="flex items-center justify-between bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => setRightPanelTab('NOTIFICATIONS')}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          rightPanelTab === 'NOTIFICATIONS'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email Notifications</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">
                          {(currentTicket.notifications || []).length}
                        </span>
                        {currentTicketUnreadStatusCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-amber-500 text-white">
                            {currentTicketUnreadStatusCount}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRightPanelTab('AUDIT')}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          rightPanelTab === 'AUDIT'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>State Audit Trail</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">
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
