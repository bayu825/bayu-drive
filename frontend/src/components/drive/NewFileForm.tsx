import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAccessToken } from '@/lib/auth'
import { API_URL } from '@/lib/api'

interface NewFileFormProps {
  onSuccess: () => void
  folderId?: string | null
}

const templates = {
  xlsx: { url: '/templates/blank.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  docx: { url: '/templates/blank.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  pptx: { url: '/templates/blank.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
}

export function NewFileForm({ onSuccess, folderId }: NewFileFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<keyof typeof templates>('xlsx')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setLoading(true)

    try {
      const template = templates[type]
      const res = await fetch(template.url)
      const blob = await res.blob()
      
      const fileName = `${name.trim()}.${type}`
      const file = new File([blob], fileName, { type: template.mimeType })

      const meta = {
        fieldName: 'file-0',
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        folderId: folderId || undefined,
      }

      const form = new FormData()
      form.append('filesMeta', JSON.stringify([meta]))
      form.append('file-0', file)

      const token = getAccessToken()
      const uploadRes = await fetch(`${API_URL}/uploads`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.message || 'Failed to create file')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">File Name (without extension)</label>
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="My Document" disabled={loading} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">File Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          disabled={loading}
          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="xlsx">Excel Spreadsheet (.xlsx)</option>
          <option value="docx">Word Document (.docx)</option>
          <option value="pptx">PowerPoint Presentation (.pptx)</option>
        </select>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={!name.trim() || loading}>
          {loading ? 'Creating...' : 'Create File'}
        </Button>
      </div>
    </form>
  )
}
