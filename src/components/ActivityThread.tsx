/**
 * HelpDesk Lite (V1 MVP)
 * Activity Threading Component with Strict Role-Based Isolation:
 * - Public Requester Replies (visible to all parties)
 * - Private Staff Notes (strictly visible ONLY to AGENT and MANAGER; hidden from REQUESTER)
 */

import React, { useState } from 'react';
import { ActivityMessage, User, UserRole } from '../types/ticket';
import { Lock, MessageSquare, Send, FileSpreadsheet, Zap } from 'lucide-react';
import { QUICK_STAFF_REPLIES, QUICK_REQUESTER_REPLIES } from '../utils/smartHelpers';

interface ActivityThreadProps {
  messages: ActivityMessage[];
  currentUser: User;
  onSendMessage: (content: string, isPrivateStaffNote: boolean) => void;
  onExportCSV?: () => void;
  disabled?: boolean;
}

export const ActivityThread: React.FC<ActivityThreadProps> = ({
  messages,
  currentUser,
  onSendMessage,
  onExportCSV,
  disabled = false,
}) => {
  const [content, setContent] = useState('');
  const [isPrivateStaffNote, setIsPrivateStaffNote] = useState(false);

  const isStaff =
    currentUser.role === UserRole.AGENT || currentUser.role === UserRole.MANAGER;

  // Strict role-based isolation: Requesters cannot see private staff notes under any circumstances
  const visibleMessages = messages.filter((msg) => {
    if (msg.isPrivateStaffNote) {
      return isStaff;
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;

    // Safety constraint: If user is Requester, force privateStaffNote to false
    const privateNote = isStaff ? isPrivateStaffNote : false;
    onSendMessage(content.trim(), privateNote);
    setContent('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
          <h3 className="text-xs font-semibold text-slate-800">Activity Thread</h3>
          <span className="text-[11px] text-slate-400 font-mono">({visibleMessages.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              id="btn-export-activity-csv"
              title="Export Activity Thread to CSV"
              className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-[11px] font-medium cursor-pointer"
            >
              <FileSpreadsheet className="w-3 h-3 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}

          {isStaff && (
            <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50/70 border border-amber-200/60 px-2 py-0.5 rounded-md">
              <Lock className="w-2.5 h-2.5 text-amber-600" />
              <span>Staff isolation</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="p-4 space-y-2.5 max-h-[360px] overflow-y-auto">
        {visibleMessages.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No activity recorded yet.
          </div>
        ) : (
          visibleMessages.map((msg, index) => {
            const isSelf = msg.authorId === currentUser.id;

            return (
              <div
                key={`${msg.id}-${index}`}
                className={`p-3 rounded-lg text-xs transition-colors ${
                  msg.isPrivateStaffNote
                    ? 'bg-amber-50/50 border border-amber-200/50 text-amber-950'
                    : isSelf
                    ? 'bg-slate-50/80 border border-slate-200/60 text-slate-800'
                    : 'bg-white border border-slate-200/60 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-medium text-[9px] ${
                        msg.isPrivateStaffNote
                          ? 'bg-amber-200/70 text-amber-900'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {msg.authorName.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-900 text-xs">
                      {msg.authorName}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-medium tracking-wide ${
                        msg.authorRole === UserRole.REQUESTER
                          ? 'bg-slate-100 text-slate-600'
                          : msg.authorRole === UserRole.AGENT
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {msg.authorRole}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    {msg.isPrivateStaffNote && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded">
                        <Lock className="w-2.5 h-2.5" />
                        Internal
                      </span>
                    )}
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <p className="whitespace-pre-wrap leading-relaxed text-slate-700 pl-6.5 text-[11px]">
                  {msg.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Input composer */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 bg-slate-50/40">
        {/* Toggle between Public and Staff Note (only for Staff) */}
        {isStaff && (
          <div className="flex items-center gap-4 mb-2 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 text-[11px]">
              <input
                type="radio"
                name="noteType"
                checked={!isPrivateStaffNote}
                onChange={() => setIsPrivateStaffNote(false)}
                className="text-slate-900 focus:ring-slate-400"
              />
              <span>Public Reply</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-amber-800 text-[11px] font-medium">
              <input
                type="radio"
                name="noteType"
                checked={isPrivateStaffNote}
                onChange={() => setIsPrivateStaffNote(true)}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-amber-600" />
                Staff Note (Private)
              </span>
            </label>
          </div>
        )}

        {/* Smart Quick Canned Replies */}
        {!disabled && (
          <div className="mb-2">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
              <Zap className="w-2.5 h-2.5 text-amber-500" />
              <span className="font-medium">Quick responses:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(isStaff ? QUICK_STAFF_REPLIES : QUICK_REQUESTER_REPLIES).map((snippet, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setContent(snippet)}
                  className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer truncate max-w-[240px]"
                  title={snippet}
                >
                  {snippet}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <textarea
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={disabled}
            placeholder={
              isPrivateStaffNote
                ? 'Add internal investigation note...'
                : 'Type a reply to the requester...'
            }
            className={`w-full text-xs rounded-lg p-2.5 pr-18 border focus:outline-none transition-colors ${
              isPrivateStaffNote
                ? 'border-amber-200 bg-amber-50/20 focus:border-amber-400'
                : 'border-slate-200 bg-white focus:border-slate-800'
            }`}
          />

          <button
            type="submit"
            disabled={!content.trim() || disabled}
            className={`absolute right-2 bottom-2 px-2.5 py-1 rounded-md text-xs font-medium text-white flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer ${
              isPrivateStaffNote
                ? 'bg-amber-800 hover:bg-amber-900'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            <span>Send</span>
            <Send className="w-2.5 h-2.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
