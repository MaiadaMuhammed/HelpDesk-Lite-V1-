export interface FileTypeMeta {
  category: 'image' | 'pdf' | 'log' | 'code' | 'spreadsheet' | 'document' | 'archive' | 'audio' | 'video' | 'other';
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  canThumbnail: boolean;
  canPreviewText: boolean;
}

export function detectFileType(fileName: string, mimeType: string): FileTypeMeta {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const lowerMime = (mimeType || '').toLowerCase();

  // 1. Images
  if (
    lowerMime.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)
  ) {
    return {
      category: 'image',
      label: ext ? `${ext.toUpperCase()} Image` : 'Image',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      borderColor: 'border-emerald-200',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      canThumbnail: true,
      canPreviewText: false,
    };
  }

  // 2. PDFs
  if (lowerMime === 'application/pdf' || ext === 'pdf') {
    return {
      category: 'pdf',
      label: 'PDF Document',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      borderColor: 'border-rose-200',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      canThumbnail: false,
      canPreviewText: false,
    };
  }

  // 3. Log files
  if (
    lowerMime === 'text/x-log' ||
    ext === 'log' ||
    (lowerMime === 'text/plain' && (fileName.includes('log') || ext === 'log'))
  ) {
    return {
      category: 'log',
      label: 'System Log',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      borderColor: 'border-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      canThumbnail: false,
      canPreviewText: true,
    };
  }

  // 4. Code / Scripts / Data
  if (
    lowerMime.includes('json') ||
    lowerMime.includes('javascript') ||
    lowerMime.includes('typescript') ||
    lowerMime.includes('xml') ||
    lowerMime.includes('yaml') ||
    ['json', 'js', 'ts', 'jsx', 'tsx', 'py', 'sh', 'bash', 'yml', 'yaml', 'xml', 'html', 'css', 'sql'].includes(ext)
  ) {
    return {
      category: 'code',
      label: ext ? `${ext.toUpperCase()} File` : 'Code File',
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      canThumbnail: false,
      canPreviewText: true,
    };
  }

  // 5. Spreadsheets
  if (
    lowerMime.includes('spreadsheet') ||
    lowerMime.includes('excel') ||
    lowerMime === 'text/csv' ||
    ['csv', 'xlsx', 'xls', 'tsv'].includes(ext)
  ) {
    return {
      category: 'spreadsheet',
      label: ext === 'csv' ? 'CSV Sheet' : 'Spreadsheet',
      badgeBg: 'bg-teal-50',
      badgeText: 'text-teal-700',
      borderColor: 'border-teal-200',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      canThumbnail: false,
      canPreviewText: ext === 'csv',
    };
  }

  // 6. Documents
  if (
    lowerMime.includes('word') ||
    lowerMime.includes('document') ||
    ['doc', 'docx', 'rtf', 'odt', 'txt'].includes(ext)
  ) {
    return {
      category: 'document',
      label: ext === 'txt' ? 'Text Document' : 'Document',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      canThumbnail: false,
      canPreviewText: ext === 'txt',
    };
  }

  // 7. Archives
  if (
    lowerMime.includes('zip') ||
    lowerMime.includes('compressed') ||
    lowerMime.includes('tar') ||
    ['zip', 'tar', 'gz', 'tgz', 'rar', '7z'].includes(ext)
  ) {
    return {
      category: 'archive',
      label: 'Archive (ZIP/TAR)',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      borderColor: 'border-purple-200',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      canThumbnail: false,
      canPreviewText: false,
    };
  }

  // 8. Media
  if (lowerMime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
    return {
      category: 'audio',
      label: 'Audio File',
      badgeBg: 'bg-violet-50',
      badgeText: 'text-violet-700',
      borderColor: 'border-violet-200',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      canThumbnail: false,
      canPreviewText: false,
    };
  }
  if (lowerMime.startsWith('video/') || ['mp4', 'mov', 'webm', 'mkv'].includes(ext)) {
    return {
      category: 'video',
      label: 'Video Clip',
      badgeBg: 'bg-pink-50',
      badgeText: 'text-pink-700',
      borderColor: 'border-pink-200',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
      canThumbnail: false,
      canPreviewText: false,
    };
  }

  // Default Fallback
  return {
    category: 'other',
    label: ext ? `${ext.toUpperCase()} File` : 'Attachment',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    borderColor: 'border-slate-200',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    canThumbnail: false,
    canPreviewText: false,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
