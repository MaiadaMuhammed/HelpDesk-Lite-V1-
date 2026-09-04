import React, { useState, useMemo } from 'react';
import {
  TicketAttachment,
} from '../types/ticket';
import {
  detectFileType,
  formatFileSize,
  FileTypeMeta,
} from '../utils/fileTypes';
import {
  FileText,
  Terminal,
  Image as ImageIcon,
  FileSpreadsheet,
  Code2,
  Archive,
  FileAudio,
  FileVideo,
  File,
  Download,
  Eye,
  Trash2,
  UploadCloud,
  X,
  Maximize2,
  Copy,
  Check,
  Paperclip,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';

interface TicketAttachmentListProps {
  attachments: TicketAttachment[];
  onAddAttachment?: (attachment: TicketAttachment) => void;
  onRemoveAttachment?: (attachmentId: string) => void;
  readOnly?: boolean;
}

const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const TicketAttachmentList: React.FC<TicketAttachmentListProps> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  readOnly = false,
}) => {
  const [selectedImage, setSelectedImage] = useState<TicketAttachment | null>(null);
  const [selectedLog, setSelectedLog] = useState<{ attachment: TicketAttachment; content: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Search & Type/MIME Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Compute category frequency to populate filter options accurately
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    attachments.forEach((att) => {
      const meta = detectFileType(att.name, att.mimeType);
      counts[meta.category] = (counts[meta.category] || 0) + 1;
    });
    return counts;
  }, [attachments]);

  // Filter attachments by name, mime type, extension, or detected category
  const filteredAttachments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return attachments.filter((att) => {
      const meta = detectFileType(att.name, att.mimeType);

      // Check category filter
      if (categoryFilter !== 'all' && meta.category !== categoryFilter) {
        return false;
      }

      // Check search query against file name, extension, mime type, label, or category
      if (query) {
        const nameMatch = att.name.toLowerCase().includes(query);
        const mimeMatch = (att.mimeType || '').toLowerCase().includes(query);
        const labelMatch = meta.label.toLowerCase().includes(query);
        const categoryMatch = meta.category.toLowerCase().includes(query);
        const extMatch = (att.name.split('.').pop() || '').toLowerCase().includes(query);

        if (!nameMatch && !mimeMatch && !labelMatch && !categoryMatch && !extMatch) {
          return false;
        }
      }

      return true;
    });
  }, [attachments, searchQuery, categoryFilter]);

  // Direct download trigger
  const handleDownload = (att: TicketAttachment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const link = document.createElement('a');
      link.href = att.url;
      link.download = att.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed', err);
      // Fallback
      window.open(att.url, '_blank');
    }
  };

  // Open Log or Text Viewer
  const handleOpenTextViewer = (att: TicketAttachment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // If it's a data URL, decode it
    if (att.url.startsWith('data:')) {
      try {
        const parts = att.url.split(',');
        const mimeAndEncoding = parts[0];
        const rawData = parts[1] || '';
        
        let decoded = '';
        if (mimeAndEncoding.includes('base64')) {
          decoded = atob(rawData);
        } else {
          decoded = decodeURIComponent(rawData);
        }
        setSelectedLog({ attachment: att, content: decoded });
        return;
      } catch (err) {
        console.error('Failed to decode data URL', err);
      }
    }

    // Otherwise attempt fetch or provide fallback notice
    if (att.url.startsWith('blob:') || att.url.startsWith('http')) {
      fetch(att.url)
        .then((res) => res.text())
        .then((text) => setSelectedLog({ attachment: att, content: text }))
        .catch(() => {
          setSelectedLog({
            attachment: att,
            content: `[File preview loaded from: ${att.name}]\nSize: ${formatFileSize(att.sizeBytes)}\nMIME: ${att.mimeType}\n\nUse the "Download" button to inspect the full binary or raw stream.`,
          });
        });
      return;
    }

    setSelectedLog({
      attachment: att,
      content: `System Log: ${att.name}\nTimestamp: ${new Date(att.uploadedAt).toLocaleString()}\n\n[End of log stream]`,
    });
  };

  const handleCopyText = (content: string) => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const processUploadedFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || !onAddAttachment) return;
    setUploadError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        setUploadError(`"${file.name}" exceeds the 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        continue;
      }

      // If it's a text/log or image, we can also read as DataURL so it persists reliably in state
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string || URL.createObjectURL(file);
        const newAttachment: TicketAttachment = {
          id: `att_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          sizeBytes: file.size,
          mimeType: file.type || 'application/octet-stream',
          url: dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        onAddAttachment(newAttachment);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderTypeIcon = (meta: FileTypeMeta) => {
    switch (meta.category) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600" />;
      case 'log':
        return <Terminal className="w-5 h-5 text-amber-700" />;
      case 'code':
        return <Code2 className="w-5 h-5 text-indigo-600" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-5 h-5 text-teal-600" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-purple-600" />;
      case 'audio':
        return <FileAudio className="w-5 h-5 text-violet-600" />;
      case 'video':
        return <FileVideo className="w-5 h-5 text-pink-600" />;
      default:
        return <File className="w-5 h-5 text-slate-600" />;
    }
  };

  const totalBytes = attachments.reduce((acc, a) => acc + a.sizeBytes, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">
            Attachments
          </h3>
          <span className="font-mono text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
            {attachments.length}
          </span>
          {attachments.length > 0 && (
            <span className="text-[11px] text-slate-400">
              ({formatFileSize(totalBytes)})
            </span>
          )}
        </div>

        {/* Upload Trigger (when editable) */}
        {!readOnly && onAddAttachment && (
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 transition-colors text-xs">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Add Attachment</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                processUploadedFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>

      {/* Error feedback if file exceeds limit */}
      {uploadError && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center justify-between text-xs">
          <span>{uploadError}</span>
          <button
            onClick={() => setUploadError(null)}
            className="text-rose-900 hover:text-rose-950 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar (Displayed when attachments exist) */}
      {attachments.length > 0 && (
        <div className="space-y-2 pt-0.5">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search Input for Filename & MIME */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                id="attachment-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name, extension, or MIME (e.g. .log, pdf, png, image/svg)..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                  title="Clear search text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type/MIME Category Filter Dropdown */}
            <div className="relative flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                id="attachment-category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter attachments by category or mime type"
                className="bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all"
              >
                <option value="all">All Types ({attachments.length})</option>
                {categoryCounts['image'] && (
                  <option value="image">Images ({categoryCounts['image']})</option>
                )}
                {categoryCounts['pdf'] && (
                  <option value="pdf">PDF Documents ({categoryCounts['pdf']})</option>
                )}
                {categoryCounts['log'] && (
                  <option value="log">Logs & Traces ({categoryCounts['log']})</option>
                )}
                {categoryCounts['code'] && (
                  <option value="code">Code & Configs ({categoryCounts['code']})</option>
                )}
                {categoryCounts['spreadsheet'] && (
                  <option value="spreadsheet">Spreadsheets & CSV ({categoryCounts['spreadsheet']})</option>
                )}
                {categoryCounts['document'] && (
                  <option value="document">Documents ({categoryCounts['document']})</option>
                )}
                {categoryCounts['archive'] && (
                  <option value="archive">Archives ({categoryCounts['archive']})</option>
                )}
                {categoryCounts['other'] && (
                  <option value="other">Other ({categoryCounts['other']})</option>
                )}
              </select>
            </div>
          </div>

          {/* Active Filter Indicator & Clear Button */}
          {(searchQuery || categoryFilter !== 'all') && (
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-indigo-900">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold shrink-0">
                  Showing {filteredAttachments.length} of {attachments.length} files
                </span>
                {searchQuery && (
                  <span className="text-indigo-600 truncate max-w-[200px]" title={searchQuery}>
                    matching &ldquo;{searchQuery}&rdquo;
                  </span>
                )}
                {categoryFilter !== 'all' && (
                  <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0">
                    {categoryFilter}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
                className="font-medium text-indigo-700 hover:text-indigo-950 underline shrink-0 ml-2"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Attachment Grid / List */}
      {attachments.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!readOnly) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (!readOnly) processUploadedFiles(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-200 bg-slate-50/50'
          }`}
        >
          <Paperclip className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
          <p className="font-semibold text-slate-700">No attachments on this ticket</p>
          {!readOnly && onAddAttachment && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Drag & drop logs, images, or documents here (up to 10MB), or click 'Add Attachment'
            </p>
          )}
        </div>
      ) : filteredAttachments.length === 0 ? (
        <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-6 text-center">
          <Filter className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
          <p className="font-semibold text-slate-700">No matching attachments</p>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
            {searchQuery
              ? `No files match "${searchQuery}"${categoryFilter !== 'all' ? ` in category "${categoryFilter}"` : ''}.`
              : `No files found with category "${categoryFilter}".`}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
            }}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear search & filter</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAttachments.map((att) => {
            const meta = detectFileType(att.name, att.mimeType);
            const isImage = meta.category === 'image';
            const isLog = meta.category === 'log' || att.name.toLowerCase().endsWith('.log');

            return (
              <div
                key={att.id}
                id={`attachment-card-${att.id}`}
                className={`relative group bg-slate-50/60 hover:bg-slate-50 border rounded-xl p-3 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs ${meta.borderColor}`}
              >
                <div>
                  {/* Visual Top Preview: Thumbnail for Images, or Mime-type Icon Box for Other Files */}
                  {isImage ? (
                    <div
                      onClick={() => setSelectedImage(att)}
                      className="relative w-full h-32 bg-slate-900/5 rounded-lg overflow-hidden border border-slate-200 cursor-pointer group/thumb mb-2.5 flex items-center justify-center"
                    >
                      <img
                        src={att.url}
                        alt={att.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-200 group-hover/thumb:scale-105"
                        onError={(e) => {
                          // Fallback icon if image cannot render
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                        <span className="flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-medium">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 mb-2.5">
                      {/* Specific Mime-Type Icon Badge */}
                      <div
                        className={`w-11 h-11 rounded-lg ${meta.iconBg} border ${meta.borderColor} flex items-center justify-center shrink-0 shadow-2xs relative`}
                      >
                        {renderTypeIcon(meta)}
                        {/* Little corner label for PDF or LOG */}
                        {meta.category === 'pdf' && (
                          <span className="absolute -bottom-1 -right-1 bg-rose-600 text-[9px] font-black text-white px-1 py-0.2 rounded uppercase leading-none shadow-xs">
                            PDF
                          </span>
                        )}
                        {meta.category === 'log' && (
                          <span className="absolute -bottom-1 -right-1 bg-amber-600 text-[9px] font-black text-white px-1 py-0.2 rounded uppercase leading-none shadow-xs">
                            LOG
                          </span>
                        )}
                      </div>

                      {/* Name & Type Tag */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.badgeBg} ${meta.badgeText} ${meta.borderColor}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <h4
                          className="font-semibold text-slate-800 text-xs truncate mt-1"
                          title={att.name}
                        >
                          {att.name}
                        </h4>
                      </div>
                    </div>
                  )}

                  {/* If it was an image, show its name & badge under the thumbnail */}
                  {isImage && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.badgeBg} ${meta.badgeText} ${meta.borderColor}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <h4
                        className="font-semibold text-slate-800 text-xs truncate"
                        title={att.name}
                      >
                        {att.name}
                      </h4>
                    </div>
                  )}

                  {/* Metadata Row: File Size & Upload Time */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                    <span className="font-mono">{formatFileSize(att.sizeBytes)}</span>
                    <span title={new Date(att.uploadedAt).toLocaleString()}>
                      {new Date(att.uploadedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Direct Action Buttons: Download, View/Preview, Delete */}
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/80">
                  {/* Direct Download Link */}
                  <button
                    type="button"
                    id={`btn-download-${att.id}`}
                    onClick={(e) => handleDownload(att, e)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                    title={`Download ${att.name}`}
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Download</span>
                  </button>

                  {/* Quick View Button for Log or Code */}
                  {(isLog || meta.canPreviewText) && (
                    <button
                      type="button"
                      onClick={(e) => handleOpenTextViewer(att, e)}
                      className="px-2 py-1.5 bg-white hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                      title="Inspect log content"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-600" />
                    </button>
                  )}

                  {/* Quick View Button for Image */}
                  {isImage && (
                    <button
                      type="button"
                      onClick={() => setSelectedImage(att)}
                      className="px-2 py-1.5 bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                      title="View full image preview"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                  )}

                  {/* Quick Open for PDF or External */}
                  {meta.category === 'pdf' && (
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 bg-white hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors inline-flex items-center"
                      title="Open PDF in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
                    </a>
                  )}

                  {/* Remove Button (if editable) */}
                  {!readOnly && onRemoveAttachment && (
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(att.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal for Image Preview */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <h3 className="font-bold text-slate-900 text-sm truncate">
                  {selectedImage.name}
                </h3>
                <span className="font-mono text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-semibold shrink-0">
                  {formatFileSize(selectedImage.sizeBytes)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleDownload(selectedImage, e)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Canvas */}
            <div className="p-6 bg-slate-900 flex items-center justify-center overflow-auto flex-1">
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                referrerPolicy="no-referrer"
                className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-md"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>MIME Type: <strong className="text-slate-700 font-mono">{selectedImage.mimeType}</strong></span>
              <span>Uploaded: {new Date(selectedImage.uploadedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Log / Text Viewer Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-slate-900 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[85vh] text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2 min-w-0">
                <Terminal className="w-4 h-4 text-amber-500 shrink-0" />
                <h3 className="font-bold text-slate-100 text-sm truncate font-mono">
                  {selectedLog.attachment.name}
                </h3>
                <span className="font-mono text-[11px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-slate-700 shrink-0">
                  {formatFileSize(selectedLog.attachment.sizeBytes)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(selectedLog.content)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-700"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Log</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDownload(selectedLog.attachment, e)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Terminal Log Content */}
            <div className="p-4 bg-slate-950 font-mono text-[12px] leading-relaxed overflow-auto flex-1 select-text">
              <pre className="text-emerald-400 whitespace-pre-wrap break-all">
                {selectedLog.content}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Lines: {selectedLog.content.split('\n').length}</span>
              <span>Uploaded: {new Date(selectedLog.attachment.uploadedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
