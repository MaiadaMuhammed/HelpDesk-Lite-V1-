/**
 * HelpDesk Lite (V1 MVP)
 * Export to CSV Modal Component
 *
 * Allows managers, agents, and administrators to export structured records
 * of a ticket's activity thread, append-only audit trail, or unified chronological history.
 */

import React, { useState } from 'react';
import { Ticket, User, UserRole } from '../types/ticket';
import {
  generateUnifiedHistoryCSV,
  generateActivityThreadCSV,
  generateAuditTrailCSV,
  downloadCSVFile,
  getUnifiedTicketHistory,
} from '../services/csvExportService';
import {
  Download,
  FileSpreadsheet,
  X,
  CheckCircle2,
  Layers,
  MessageSquare,
  History,
  ShieldCheck,
  Lock,
  FileText,
} from 'lucide-react';

export type ExportScope = 'UNIFIED' | 'MESSAGES' | 'AUDIT';

interface ExportCSVModalProps {
  ticket: Ticket;
  currentUser: User;
  onClose: () => void;
}

export const ExportCSVModal: React.FC<ExportCSVModalProps> = ({
  ticket,
  currentUser,
  onClose,
}) => {
  const [scope, setScope] = useState<ExportScope>('UNIFIED');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const isStaff =
    currentUser.role === UserRole.MANAGER || currentUser.role === UserRole.AGENT;

  const unifiedHistory = getUnifiedTicketHistory(ticket, currentUser.role);
  const visibleMessages = ticket.messages.filter(
    (m) => !m.isPrivateStaffNote || isStaff
  );
  const privateNotesCount = ticket.messages.filter(
    (m) => m.isPrivateStaffNote
  ).length;

  const handleDownload = () => {
    const safeDate = new Date().toISOString().slice(0, 10);
    let csvContent = '';
    let filename = '';

    if (scope === 'UNIFIED') {
      csvContent = generateUnifiedHistoryCSV(ticket, currentUser.role);
      filename = `${ticket.id}_unified_history_${safeDate}.csv`;
    } else if (scope === 'MESSAGES') {
      csvContent = generateActivityThreadCSV(ticket, currentUser.role);
      filename = `${ticket.id}_activity_thread_${safeDate}.csv`;
    } else {
      csvContent = generateAuditTrailCSV(ticket);
      filename = `${ticket.id}_audit_trail_${safeDate}.csv`;
    }

    downloadCSVFile(csvContent, filename);
    setDownloadSuccess(filename);

    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4000);
  };

  const getRecordCount = () => {
    switch (scope) {
      case 'UNIFIED':
        return unifiedHistory.length;
      case 'MESSAGES':
        return visibleMessages.length;
      case 'AUDIT':
        return ticket.auditLogs.length;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-export-title"
      >
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-export-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>Export Ticket History to CSV</span>
                <span className="font-mono text-xs bg-indigo-500/40 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/30">
                  {ticket.id}
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Compliant RFC-4180 CSV export formatted for Microsoft Excel & Google Sheets
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
          {/* Ticket Context Overview */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-sm">{ticket.title}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 text-slate-800">
                {ticket.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
              <span>Requester: <strong className="text-slate-700">{ticket.requesterName}</strong></span>
              <span>•</span>
              <span>Assignee: <strong className="text-slate-700">{ticket.assignedToName || 'Unassigned'}</strong></span>
              <span>•</span>
              <span>Priority: <strong className="text-slate-700">{ticket.priority}</strong></span>
            </div>
          </div>

          {/* Export Scope Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              Select Export Dataset Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setScope('UNIFIED')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  scope === 'UNIFIED'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Layers className={`w-4 h-4 ${scope === 'UNIFIED' ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      Recommended
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">Unified History</div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-tight">
                    Chronological merge of all messages & audit ledger events.
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-mono font-semibold text-indigo-700">
                  {unifiedHistory.length} total rows
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('MESSAGES')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  scope === 'MESSAGES'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <MessageSquare className={`w-4 h-4 ${scope === 'MESSAGES' ? 'text-indigo-600' : 'text-slate-500'}`} />
                  </div>
                  <div className="font-bold text-slate-900 text-xs">Activity Thread</div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-tight">
                    Public replies & staff notes with author attribution.
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-mono font-semibold text-indigo-700">
                  {visibleMessages.length} messages
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('AUDIT')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  scope === 'AUDIT'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <History className={`w-4 h-4 ${scope === 'AUDIT' ? 'text-indigo-600' : 'text-slate-500'}`} />
                  </div>
                  <div className="font-bold text-slate-900 text-xs">Audit Ledger</div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-tight">
                    Append-only state machine transitions & justifications.
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-mono font-semibold text-indigo-700">
                  {ticket.auditLogs.length} audit logs
                </div>
              </button>
            </div>
          </div>

          {/* Privacy & Role Policy Notice */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 text-[11px] text-amber-900">
            <div className="flex items-center gap-1.5 font-bold">
              {isStaff ? (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-700" />
              )}
              <span>Role-Based Privacy & Auditing Notice ({currentUser.role})</span>
            </div>
            <p className="text-amber-800">
              {isStaff ? (
                <>
                  As an authorized <strong>{currentUser.role}</strong>, your CSV export includes full audit justifications and <strong>{privateNotesCount} internal staff notes</strong>, tagged with privacy levels.
                </>
              ) : (
                <>
                  As a <strong>Requester</strong>, private internal staff notes are strictly excluded from your exported CSV to prevent data leakage.
                </>
              )}
            </p>
          </div>

          {/* File Specifications & Structure Details */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Format Specifications</span>
              </span>
              <span className="font-mono text-slate-500">RFC-4180 + UTF-8 BOM</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
              <div>
                <strong>Delimiter:</strong> Comma (,) with auto-escaped quotes
              </div>
              <div>
                <strong>Encoding:</strong> UTF-8 (Excel compatible)
              </div>
              <div>
                <strong>Columns:</strong> {scope === 'UNIFIED' ? '15 fields' : scope === 'MESSAGES' ? '9 fields' : '10 fields'}
              </div>
              <div>
                <strong>Formula Shield:</strong> Anti-CSV injection active
              </div>
            </div>
          </div>

          {/* Success Download Banner */}
          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-xs">File Successfully Generated & Downloaded!</p>
                <p className="font-mono text-[11px] text-emerald-700 truncate">{downloadSuccess}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            {getRecordCount()} record{getRecordCount() === 1 ? '' : 's'} ready for export
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-confirm-csv-download"
              onClick={handleDownload}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
