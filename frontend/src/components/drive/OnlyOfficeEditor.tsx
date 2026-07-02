import { DocumentEditor } from '@onlyoffice/document-editor-react'
import { X } from 'lucide-react'

interface OnlyOfficeEditorProps {
  file: {
    id: string
    name: string
    mimeType: string
    sizeBytes: string
  }
  previewUrl: string
  onClose: () => void
}

export function OnlyOfficeEditor({ file, previewUrl, onClose }: OnlyOfficeEditorProps) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'xlsx'

  // The OnlyOffice Document Server is running on port 8080 via our docker-compose
  const documentServerUrl = 'http://localhost:8080'

  // If the backend returned `localhost:4000`, the docker container can't access it.
  // We rewrite `localhost:4000` to `backend:4000` for OnlyOffice to download via the internal docker network.
  const downloadableUrl = previewUrl.replace('localhost:4000', 'backend:4000')

  const onDocumentReady = function () {
    console.log('Document is loaded')
  }

  const onLoadComponentError = function (errorCode: number, errorDescription: string) {
    console.log('Error loading OnlyOffice', errorCode, errorDescription)
  }

  const getDocumentType = (ext: string): 'word' | 'cell' | 'slide' => {
    if (['doc', 'docx', 'rtf', 'odt', 'txt'].includes(ext)) return 'word'
    if (['ppt', 'pptx', 'odp'].includes(ext)) return 'slide'
    return 'cell'
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col">
      <button
        onClick={onClose}
        className="absolute top-2 right-4 z-[110] p-1.5 bg-slate-800/80 text-white rounded-lg hover:bg-slate-900 transition shadow-sm backdrop-blur-sm"
        aria-label="Close Editor"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="flex-1 relative w-full h-full">
        <DocumentEditor
          id="docxEditor"
          documentServerUrl={documentServerUrl}
          config={{
            document: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              fileType: extension as any,
              key: `${file.id}_${file.sizeBytes || '0'}`,
              title: file.name,
              url: downloadableUrl,
            },
            documentType: getDocumentType(extension),
            editorConfig: {
              mode: 'edit',
              callbackUrl: downloadableUrl.replace('/preview/', '/onlyoffice-callback/'),
            },
            type: 'desktop',
            height: '100%',
            width: '100%',
          }}
          events_onDocumentReady={onDocumentReady}
          onLoadComponentError={onLoadComponentError}
        />
      </div>
    </div>
  )
}
