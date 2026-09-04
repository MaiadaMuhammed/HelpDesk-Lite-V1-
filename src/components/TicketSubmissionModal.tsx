/**
 * HelpDesk Lite (V1 MVP)
 * Structured Ticket Submission Modal
 * Enforces Title, Category [IT/HR/Facilities], Priority [Low/Med/High/Critical], Attachments up to 10MB
 */

import React, { useState } from 'react';
import {
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  User,
  TicketAttachment,
  AuditAction,
} from '../types/ticket';
import { X, Paperclip, AlertCircle, Check, FileText } from 'lucide-react';
import { detectFileType, formatFileSize } from '../utils/fileTypes';

interface TicketSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTicket: (ticket: Ticket) => void;
  currentUser: User;
}

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const TicketSubmissionModal: React.FC<TicketSubmissionModalProps> = ({
  isOpen,
  onClose,
  onSubmitTicket,
  currentUser,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>(TicketCategory.IT);
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    const newAttachments: TicketAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        setError(`File "${file.name}" exceeds the 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        return;
      }

      newAttachments.push({
        id: `att_${Date.now()}_${i}`,
        name: file.name,
        sizeBytes: file.size,
        mimeType: file.type || 'application/octet-stream',
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    const now = new Date();
    // SLA due calculation based on priority:
    // Critical = 2h, High = 8h, Medium = 24h, Low = 48h
    const slaHours = priority === TicketPriority.CRITICAL ? 2 : priority === TicketPriority.HIGH ? 8 : priority === TicketPriority.MEDIUM ? 24 : 48;
    const slaDueAt = new Date(now.getTime() + slaHours * 3600 * 1000).toISOString();

    const newTicketId = `HDL-${Math.floor(1000 + Math.random() * 9000)}`;

    const initialTicket: Ticket = {
      id: newTicketId,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: TicketStatus.NEW,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterEmail: currentUser.email,
      assignedToId: null,
      assignedToName: null,
      attachments,
      messages: [],
      auditLogs: [
        {
          id: `audit_init_${Date.now()}`,
          ticketId: newTicketId,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          action: AuditAction.TICKET_CREATED,
          fromState: undefined,
          toState: TicketStatus.NEW,
          reason: 'Initial ticket intake submission',
          timestamp: now.toISOString(),
        },
      ],
      firstResponseAt: null,
      resolvedAt: null,
      closedAt: null,
      slaDueAt,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    onSubmitTicket(initialTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Submit Support Ticket
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              HelpDesk Lite V1 Structured Intake Form
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Single Sign-On (SSO) failing with Error 401"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
              >
                <option value={TicketCategory.IT}>IT (Systems / Software)</option>
                <option value={TicketCategory.HR}>HR (Personnel / Benefits)</option>
                <option value={TicketCategory.FACILITIES}>Facilities (Office / Badges)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
              >
                <option value={TicketPriority.LOW}>Low (48h SLA)</option>
                <option value={TicketPriority.MEDIUM}>Medium (24h SLA)</option>
                <option value={TicketPriority.HIGH}>High (8h SLA)</option>
                <option value={TicketPriority.CRITICAL}>Critical (2h SLA)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details of the incident or request..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
            />
          </div>

          {/* Attachments (Up to 10MB) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                Attachments
              </label>
              <span className="text-[11px] text-slate-400">Max 10MB each</span>
            </div>

            <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/20 cursor-pointer transition-colors">
              <Paperclip className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-[11px] text-slate-600 font-medium">
                Click to attach logs or screenshots
              </span>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {attachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {attachments.map((file) => {
                  const meta = detectFileType(file.name, file.mimeType);
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {meta.canThumbnail ? (
                          <img
                            src={file.url}
                            alt=""
                            className="w-6 h-6 rounded object-cover border border-slate-300 shrink-0"
                          />
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${meta.badgeBg} ${meta.badgeText} ${meta.borderColor} shrink-0`}>
                            {meta.label}
                          </span>
                        )}
                        <span className="truncate max-w-[240px] font-medium text-slate-700" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px] shrink-0">
                          ({formatFileSize(file.sizeBytes)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
