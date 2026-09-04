/**
 * HelpDesk Lite (V1 MVP)
 * Activity Threading Component with Strict Role-Based Isolation:
 * - Public Requester Replies (visible to all parties)
 * - Private Staff Notes (strictly visible ONLY to AGENT and MANAGER; hidden from REQUESTER)
 */

import React, { useState } from 'react';
import { ActivityMessage, User, UserRole, AuditAction } from '../types/ticket';
import { Lock, MessageSquare, Send, EyeOff, User as UserIcon, FileSpreadsheet } from 'lucide-react';

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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">Activity Thread</h3>
          <span className="text-xs text-slate-400 font-mono">({visibleMessages.length} entries)</span>
        </div>

        <div className="flex items-center gap-2">
          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              id="btn-export-activity-csv"
              title="Export Activity Thread to CSV"
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export CSV</span>
            </button>
          )}

          {isStaff && (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              <Lock className="w-3 h-3 text-amber-600" />
              <span>Staff note isolation active</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="p-4 space-y-3.5 max-h-[360px] overflow-y-auto">
        {visibleMessages.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No replies or notes recorded on this ticket yet.
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isSelf = msg.authorId === currentUser.id;

            return (
              <div
                key={msg.id}
                className={`p-3.5 rounded-xl text-xs transition-all ${
                  msg.isPrivateStaffNote
                    ? 'bg-amber-50/80 border border-amber-200/90 text-amber-950'
                    : isSelf
                    ? 'bg-indigo-50/60 border border-indigo-100 text-slate-800'
                    : 'bg-slate-50 border border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        msg.isPrivateStaffNote
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {msg.authorName.charAt(0)}
                    </div>
                    <span className="font-semibold text-slate-900">
                      {msg.authorName}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold tracking-wider ${
                        msg.authorRole === UserRole.REQUESTER
                          ? 'bg-slate-100 text-slate-600'
                          : msg.authorRole === UserRole.AGENT
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {msg.authorRole}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    {msg.isPrivateStaffNote && (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                        <Lock className="w-2.5 h-2.5" />
                        Private Staff Note
                      </span>
                    )}
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <p className="whitespace-pre-wrap leading-relaxed text-slate-700 pl-8">
                  {msg.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Input composer */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-slate-50/50">
        {/* Toggle between Public and Staff Note (only for Staff) */}
        {isStaff && (
          <div className="flex items-center gap-4 mb-2.5 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="noteType"
                checked={!isPrivateStaffNote}
                onChange={() => setIsPrivateStaffNote(false)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>Public Requester Reply</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-amber-800 font-medium">
              <input
                type="radio"
                name="noteType"
                checked={isPrivateStaffNote}
                onChange={() => setIsPrivateStaffNote(true)}
                className="text-amber-600 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600" />
                Private Staff Note (Hidden from requester)
              </span>
            </label>
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
                ? 'Add internal staff investigation note (private to agents/managers)...'
                : 'Type a reply to the requester...'
            }
            className={`w-full text-xs rounded-lg p-2.5 pr-20 border focus:outline-none transition-all ${
              isPrivateStaffNote
                ? 'border-amber-300 bg-amber-50/30 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                : 'border-slate-300 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
            }`}
          />

          <button
            type="submit"
            disabled={!content.trim() || disabled}
            className={`absolute right-2 bottom-2.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white flex items-center gap-1 shadow-xs transition-colors disabled:opacity-40 ${
              isPrivateStaffNote
                ? 'bg-amber-700 hover:bg-amber-800'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <span>Send</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  );
};
