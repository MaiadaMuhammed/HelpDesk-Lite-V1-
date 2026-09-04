/**
 * HelpDesk Lite (V1 MVP)
 * Append-Only Audit Trail View
 * Displays immutable audit logs for state transitions, assignments, and actions.
 */

import React from 'react';
import { AuditLogEntry, UserRole } from '../types/ticket';
import { ShieldCheck, History, ArrowRight, FileSpreadsheet } from 'lucide-react';

interface AuditTrailViewProps {
  auditLogs: AuditLogEntry[];
  onExportCSV?: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ auditLogs, onExportCSV }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">
            Append-Only Audit Trail
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            ({auditLogs.length} events logged)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              id="btn-export-audit-csv"
              title="Export Audit Trail to CSV"
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export CSV</span>
            </button>
          )}
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Immutable Ledger</span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto text-xs">
        {auditLogs.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            No audit records created yet.
          </div>
        ) : (
          [...auditLogs].reverse().map((entry) => (
            <div key={entry.id} className="p-3.5 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{entry.actorName}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                      entry.actorRole === UserRole.REQUESTER
                        ? 'bg-slate-100 text-slate-600'
                        : entry.actorRole === UserRole.AGENT
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {entry.actorRole}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-[10px] text-slate-500 uppercase">
                    {entry.action}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>

              {entry.fromState && entry.toState && (
                <div className="flex items-center gap-2 mt-1 font-mono text-[11px]">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {entry.fromState}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                    {entry.toState}
                  </span>
                </div>
              )}

              {entry.reason && (
                <p className="text-slate-600 mt-1 text-[11px] italic">
                  "{entry.reason}"
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
