/**
 * HelpDesk Lite (V1 MVP)
 * HDL-06: Frontend React Integration Hook
 * Safe UI consumption of Ticket State Machine with typed error handling and optimistic state updates.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Ticket,
  TicketStatus,
  User,
  LifecycleError,
  AuditLogEntry,
} from '../types/ticket';
import {
  transitionTicketState,
  assignTicket,
  getAvailableNextStates,
  validateStateTransition,
  TransitionOptions,
} from '../engine/stateMachine';

export interface UseTicketLifecycleOptions {
  initialTicket: Ticket;
  currentUser: User;
  onTransitionSuccess?: (updatedTicket: Ticket, auditEntry: AuditLogEntry) => void;
  onTransitionError?: (error: LifecycleError) => void;
}

export interface UseTicketLifecycleReturn {
  ticket: Ticket;
  isTerminal: boolean;
  availableNextStates: TicketStatus[];
  isTransitioning: boolean;
  lastError: LifecycleError | null;
  clearError: () => void;
  canTransitionTo: (target: TicketStatus) => boolean;
  transitionTo: (
    target: TicketStatus,
    options?: TransitionOptions
  ) => Promise<boolean>;
  assignToAgent: (
    assignee: { id: string; name: string } | null,
    reason?: string
  ) => Promise<boolean>;
  resetTicket: (ticket: Ticket) => void;
}

/**
 * Custom React Hook providing safe, declarative state transitions for Tickets.
 */
export function useTicketLifecycle({
  initialTicket,
  currentUser,
  onTransitionSuccess,
  onTransitionError,
}: UseTicketLifecycleOptions): UseTicketLifecycleReturn {
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [lastError, setLastError] = useState<LifecycleError | null>(null);

  const isTerminal = useMemo(
    () => ticket.status === TicketStatus.CLOSED,
    [ticket.status]
  );

  // Compute available transitions based on current status and active actor role
  const availableNextStates = useMemo(
    () => getAvailableNextStates(ticket.status, currentUser.role),
    [ticket.status, currentUser.role]
  );

  // Quick pre-flight check without throwing
  const canTransitionTo = useCallback(
    (target: TicketStatus): boolean => {
      try {
        validateStateTransition(ticket, target, currentUser);
        return true;
      } catch {
        return false;
      }
    },
    [ticket, currentUser]
  );

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const resetTicket = useCallback((newTicket: Ticket) => {
    setTicket(newTicket);
    setLastError(null);
  }, []);

  /**
   * Safe execution of state transitions
   */
  const transitionTo = useCallback(
    async (
      target: TicketStatus,
      options: TransitionOptions = {}
    ): Promise<boolean> => {
      setIsTransitioning(true);
      setLastError(null);

      try {
        // Execute pure engine transition
        const result = transitionTicketState(
          ticket,
          target,
          currentUser,
          options
        );

        // Update state
        setTicket(result.ticket);

        if (onTransitionSuccess) {
          onTransitionSuccess(result.ticket, result.auditEntry);
        }

        return true;
      } catch (err: unknown) {
        const lifecycleErr =
          err instanceof LifecycleError
            ? err
            : new LifecycleError(
                err instanceof Error ? err.message : 'Unknown transition error',
                'ERR_UNKNOWN'
              );

        setLastError(lifecycleErr);

        if (onTransitionError) {
          onTransitionError(lifecycleErr);
        }

        return false;
      } finally {
        setIsTransitioning(false);
      }
    },
    [ticket, currentUser, onTransitionSuccess, onTransitionError]
  );

  /**
   * Safe execution of ticket assignment changes
   */
  const assignToAgent = useCallback(
    async (
      assignee: { id: string; name: string } | null,
      reason?: string
    ): Promise<boolean> => {
      setIsTransitioning(true);
      setLastError(null);

      try {
        const result = assignTicket(ticket, assignee, currentUser, reason);
        setTicket(result.ticket);

        if (onTransitionSuccess) {
          onTransitionSuccess(result.ticket, result.auditEntry);
        }

        return true;
      } catch (err: unknown) {
        const lifecycleErr =
          err instanceof LifecycleError
            ? err
            : new LifecycleError(
                err instanceof Error ? err.message : 'Assignment error',
                'ERR_UNKNOWN'
              );

        setLastError(lifecycleErr);

        if (onTransitionError) {
          onTransitionError(lifecycleErr);
        }

        return false;
      } finally {
        setIsTransitioning(false);
      }
    },
    [ticket, currentUser, onTransitionSuccess, onTransitionError]
  );

  return {
    ticket,
    isTerminal,
    availableNextStates,
    isTransitioning,
    lastError,
    clearError,
    canTransitionTo,
    transitionTo,
    assignToAgent,
    resetTicket,
  };
}
