import { useEffect, useState } from 'react'
import { CheckCircle, Clock, Copy, FileArchive, Folder, Link, Trash2, Users, UserCheck } from 'lucide-react'
import { MetricCard } from '@/components/drive/MetricCard'
import { PageHeader } from '@/components/drive/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { apiFetch, formatBytes, formatDate } from '@/lib/api'
import { cn } from '@/lib/utils'

type InviteTarget = { id: string; name: string; type: 'file' | 'folder'; mimeType?: string; sizeBytes?: string }
type Invite = {
  id: string
  email: string
  role: string
  status: string
  targetType: 'file' | 'folder'
  targetId: string
  target: InviteTarget | null
  createdAt: string
  acceptedAt: string | null
  user: { id: string; name: string; email: string } | null
}

type ShareLinkFile = { id: string; name: string; mimeType: string; sizeBytes: string; connectedAccount?: { email: string; provider: string } | null; folder?: { id: string; name: string } | null }
type ShareLink = { id: string; url: string | null; createdAt: string; expiresAt: string | null; file: ShareLinkFile }

function ResourceIcon({ type }: { type: 'file' | 'folder' }) {
  return type === 'folder' ? <Folder className="h-5 w-5 text-blue-600" /> : <FileArchive className="h-5 w-5 text-blue-600" />
}

export function SharedPage() {
  const [sentInvites, setSentInvites] = useState<Invite[]>([])
  const [receivedInvites, setReceivedInvites] = useState<Invite[]>([])
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const pendingCount = sentInvites.filter((invite) => invite.status === 'pending').length
  const acceptedCount = sentInvites.filter((invite) => invite.status === 'accepted').length

  async function loadInvites() {
    const data = await apiFetch<{ sent: Invite[]; received: Invite[] }>('/invites')
    setSentInvites(data.sent)
    setReceivedInvites(data.received)
  }

  async function loadShareLinks() {
    const data = await apiFetch<{ shares: ShareLink[] }>('/files/shared-links')
    setShareLinks(data.shares)
  }

  useEffect(() => {
    Promise.all([
      loadInvites(),
      loadShareLinks(),
    ]).catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to load shared resources'))
    window.addEventListener('9drive:invites-changed', loadInvites)
    return () => window.removeEventListener('9drive:invites-changed', loadInvites)
  }, [])

  async function revokeInvite(id: string) {
    await apiFetch(`/invites/${id}`, { method: 'DELETE' })
    await loadInvites()
  }

  async function revokeShareLink(fileId: string) {
    await apiFetch(`/files/${fileId}/share`, { method: 'DELETE' })
    await loadShareLinks()
  }

  async function copyShareLink(id: string, url: string) {
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    window.setTimeout(() => setCopiedId(null), 1600)
  }

  return (
    <>
      <PageHeader title="Shared" description="Files and folders shared with members or shared with you." />
      {message ? <p className="mt-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">{message}</p> : null}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <MetricCard label="Shared Resources" value={String(sentInvites.length + receivedInvites.length + shareLinks.length)} icon={Users} />
        <MetricCard label="Accepted Members" value={String(acceptedCount)} icon={UserCheck} />
        <MetricCard label="Pending Invites" value={String(pendingCount)} icon={Clock} />
      </div>

      <Card className="mt-8 p-5">
        <h2 className="font-extrabold">Public Share Links</h2>
        <div className="mt-4 grid gap-3">
          {shareLinks.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No public share links yet. Right-click a file and choose <b>Share Link</b> to generate one.</p>
          ) : shareLinks.map((share) => (
            <div key={share.id} className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Link className="h-5 w-5 shrink-0 text-blue-600" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{share.file.name}</p>
                  {share.url ? (
                    <p className="mt-0.5 break-all text-xs text-slate-500">{share.url}</p>
                  ) : (
                    <p className="mt-0.5 text-xs text-red-500">Link unavailable</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Created {formatDate(share.createdAt)}
                    {share.file.sizeBytes ? ` • ${formatBytes(share.file.sizeBytes)}` : ''}
                    {share.expiresAt ? ` • Expires ${formatDate(share.expiresAt)}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {share.url ? (
                  <Button variant="outline" size="sm" onClick={() => copyShareLink(share.id, share.url!)}>
                    {copiedId === share.id ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    {copiedId === share.id ? 'Copied!' : 'Copy Link'}
                  </Button>
                ) : null}
                <Button variant="danger" size="sm" onClick={() => revokeShareLink(share.file.id)}>
                  <Trash2 className="h-4 w-4" />Revoke
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="font-extrabold">Shared With You</h2>
        <div className="mt-4 grid gap-3">
          {receivedInvites.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No files or folders have been shared with you yet.</p> : receivedInvites.map((invite) => (
            <div key={invite.id} className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <ResourceIcon type={invite.targetType} />
                <div className="min-w-0"><p className="truncate font-semibold text-slate-950">{invite.target?.name ?? 'Unavailable resource'}</p><p className="text-sm text-slate-500 capitalize">{invite.targetType} • {invite.role}{invite.target?.sizeBytes ? ` • ${formatBytes(invite.target.sizeBytes)}` : ''}</p></div>
              </div>
              <span className={cn('w-fit rounded-full px-3 py-1 text-xs font-bold capitalize', invite.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{invite.status}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="font-extrabold">Resources You Shared</h2>
        <div className="mt-4 grid gap-3">
          {sentInvites.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No files or folders shared yet. Use Invite Members from the top bar.</p> : sentInvites.map((invite) => (
            <div key={invite.id} className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <ResourceIcon type={invite.targetType} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{invite.target?.name ?? 'Unavailable resource'}</p>
                  <p className="break-all text-sm text-slate-500">Shared with {invite.email}</p>
                  <p className="mt-1 text-xs text-slate-500">Invited {formatDate(invite.createdAt)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-slate-600">{invite.role}</span>
                <span className={cn('rounded-full px-3 py-1 text-xs font-bold capitalize', invite.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{invite.status}</span>
                <Button variant="danger" size="sm" onClick={() => revokeInvite(invite.id)}><Trash2 className="h-4 w-4" />Revoke</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
