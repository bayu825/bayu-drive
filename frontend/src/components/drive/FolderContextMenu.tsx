import { Edit3, Scissors, Trash2, UserPlus, Lock, Unlock, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FolderItem } from '@/data/drive-data'

export function FolderContextMenu({ x, y, folder, onClose, onCut, onRename, onInvite, onDelete, onLockToggle, onResetLock }: { x: number; y: number; folder: FolderItem | null; onClose: () => void; onCut: () => void; onRename: () => void; onInvite: () => void; onDelete: () => void; onLockToggle: () => void; onResetLock: () => void }) {
  if (!folder) return null
  const safeX = Math.max(12, Math.min(x, window.innerWidth - 220))
  const safeY = Math.max(12, Math.min(y, window.innerHeight - 340))

  return (
    <>
      <button className="fixed inset-0 z-40 cursor-default bg-slate-950/20 sm:bg-transparent" aria-label="Close folder menu" onClick={onClose} />
        <div className="fixed inset-x-3 bottom-3 z-50 rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15 sm:inset-x-auto sm:bottom-auto sm:w-52 sm:rounded-2xl" style={{ left: window.innerWidth >= 640 ? safeX : undefined, top: window.innerWidth >= 640 ? safeY : undefined }}>
          <p className="truncate px-3 py-2 text-xs font-bold text-slate-500">{folder.name}</p>
        <Button variant="ghost" className="h-12 w-full justify-start sm:h-11" onClick={onCut}><Scissors className="h-4 w-4" />Cut</Button>
        <Button variant="ghost" className="h-12 w-full justify-start sm:h-11" onClick={onRename}><Edit3 className="h-4 w-4" />Rename</Button>
        <Button variant="ghost" className="h-12 w-full justify-start sm:h-11" onClick={onInvite}><UserPlus className="h-4 w-4" />Invite Member</Button>
        <Button variant="ghost" className="h-12 w-full justify-start sm:h-11" onClick={onLockToggle}>{folder.isLocked ? <><Unlock className="h-4 w-4" />Unlock</> : <><Lock className="h-4 w-4" />Lock</>}</Button>
        {folder.isLocked && <Button variant="ghost" className="h-12 w-full justify-start sm:h-11 text-amber-600 hover:bg-amber-50 hover:text-amber-700" onClick={onResetLock}><ShieldAlert className="h-4 w-4" />Reset Lock</Button>}
        <Button variant="danger" className="h-12 w-full justify-start sm:h-11" onClick={onDelete}><Trash2 className="h-4 w-4" />Delete</Button>
      </div>
    </>
  )
}
