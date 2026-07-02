export type PreviewKind = 'image' | 'video' | 'document' | 'office'

const officeMimeTypes = new Set([
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

const googleDocumentMimeTypes = new Set([
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
])

export function getPreviewKind(mimeType: string | undefined, fileName?: string): PreviewKind | null {
  if (mimeType && mimeType.startsWith('image/') || mimeType === 'application/vnd.google-apps.drawing') return 'image'
  if (mimeType && mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf' || (mimeType && googleDocumentMimeTypes.has(mimeType))) return 'document'
  if (mimeType && officeMimeTypes.has(mimeType)) return 'office'
  
  if (fileName) {
    const lowerName = fileName.toLowerCase()
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].some(ext => lowerName.endsWith(ext))) return 'image'
    if (['.mp4', '.webm', '.ogg', '.mov'].some(ext => lowerName.endsWith(ext))) return 'video'
    if (lowerName.endsWith('.pdf')) return 'document'
    if (['.xlsx', '.docx', '.pptx', '.xls', '.doc', '.ppt'].some(ext => lowerName.endsWith(ext))) return 'office'
  }
  
  return null
}

export function officeViewerUrl(fileUrl: string) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
}

export function isSpreadsheetMimeType(mimeType: string | undefined) {
  return mimeType === 'application/vnd.google-apps.spreadsheet' || mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}
