import { useEffect, useState } from 'react'
import { Trash2, TriangleAlert } from 'lucide-react'
import Button from './ui/Button'
import Input from './ui/Input'
import { FieldRoot, FieldLabel } from './ui/Field'
import ConfirmDialog from './ui/AlertDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select'
import { deleteWorkspace, getWorkspaceMembers, transferWorkspaceOwnership, updateWorkspace } from '../api/workspaces'
import type { Workspace, WorkspaceMember } from '../api/types'
import { useToast } from '../hooks/useToast'

interface WorkspaceSettingsPanelProps {
  workspace: Pick<Workspace, 'id' | 'name' | 'role'>
  onRenamed: (name: string) => void
  onDeleted: () => void
  onOwnershipTransferred: () => void
}

const nameOf = (member: WorkspaceMember) => member.display_name || member.username

export default function WorkspaceSettingsPanel({ workspace, onRenamed, onDeleted, onOwnershipTransferred }: WorkspaceSettingsPanelProps) {
  const toast = useToast()
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [name, setName] = useState(workspace.name)
  const [saving, setSaving] = useState(false)
  const [newOwnerId, setNewOwnerId] = useState<number | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    getWorkspaceMembers(workspace.id).then(list => { if (active) setMembers(list) }).catch(() => {})
    return () => { active = false }
  }, [workspace.id])

  const owner = members.find(member => member.role === 'owner')
  const candidates = members.filter(member => member.role === 'editor' || member.role === 'viewer')
  const chosen = candidates.find(member => member.user_id === newOwnerId) ?? null
  const trimmed = name.trim()
  const ownerName = owner ? nameOf(owner) : ''
  const initials = ownerName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?'

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateWorkspace(workspace.id, trimmed)
      toast.success('Workspace renamed.')
      onRenamed(trimmed)
    } catch {
      return
    } finally {
      setSaving(false)
    }
  }

  const handleTransfer = async () => {
    if (!chosen) return
    setTransferring(true)
    try {
      await transferWorkspaceOwnership(workspace.id, chosen.user_id)
      toast.success(`${nameOf(chosen)} is now the owner of ${workspace.name}.`)
      setTransferOpen(false)
      onOwnershipTransferred()
    } catch {
      setTransferring(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteWorkspace(workspace.id)
      toast.success('Workspace deleted.')
      setDeleteOpen(false)
      onDeleted()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="flex w-full max-w-4xl flex-col gap-8">
      <section>
        <h2 className="text-lg font-semibold text-primary">Workspace settings</h2>
        <p className="mt-1 text-sm text-muted">Manage the name, ownership and lifecycle of this workspace.</p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-border-default bg-surface">
          <FieldRoot className="p-4">
            <FieldLabel>Workspace name</FieldLabel>
            <div className="flex max-w-md items-center gap-2">
              <Input type="text" value={name} maxLength={255} onChange={event => setName(event.target.value)} className="min-w-0 flex-1 text-[13px]" />
              <Button variant="primary" size="md" onClick={handleSave} disabled={saving || !trimmed || trimmed === workspace.name} className="shrink-0 text-[13px]">
                Save
              </Button>
            </div>
          </FieldRoot>
        </div>
      </section>

      <section>
        <h2 className="text-[15px] font-medium text-primary">Ownership</h2>
        <p className="mt-1 text-xs text-muted">The owner manages members and can delete the workspace.</p>
        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-border-default bg-surface p-4">
          {owner && (
            <div className="flex min-w-0 items-center gap-3">
              {owner.avatar_url ? (
                <img src={owner.avatar_url} alt="" referrerPolicy="no-referrer" className="size-9 shrink-0 rounded-full object-cover" />
              ) : (
                <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-avatar text-xs font-semibold text-accent">{initials}</span>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-primary" title={ownerName}>{ownerName}</p>
                <p className="truncate text-xs text-muted">Owner</p>
              </div>
            </div>
          )}
          <div className="flex max-w-md items-center gap-2">
            <div className="min-w-0 flex-1">
              <Select
                value={newOwnerId}
                onValueChange={next => setNewOwnerId(next)}
                disabled={candidates.length === 0}
                items={candidates.map(member => ({ value: member.user_id, label: nameOf(member) }))}
              >
                <SelectTrigger aria-label="New owner" className="w-full text-[13px]">
                  <SelectValue placeholder="Choose a member" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map(member => <SelectItem key={member.user_id} value={member.user_id}>{nameOf(member)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="secondary" size="md" disabled={!chosen} onClick={() => setTransferOpen(true)} className="shrink-0 text-[13px]">
              Transfer
            </Button>
          </div>
        </div>
        <ConfirmDialog
          open={transferOpen}
          onOpenChange={setTransferOpen}
          title="Transfer ownership"
          description={`Make ${chosen ? nameOf(chosen) : ''} the owner of ${workspace.name}? You'll become an editor and won't be able to undo this yourself.`}
          confirmLabel={transferring ? 'Transferring…' : 'Transfer ownership'}
          confirming={transferring}
          onConfirm={handleTransfer}
        />
      </section>

      <section>
        <div className="flex items-center gap-2 text-sm font-medium text-danger">
          <TriangleAlert size={14} />
          <h2>Danger zone</h2>
        </div>
        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-danger-zone-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium text-primary">Delete workspace</div>
            <p className="mt-1 text-xs text-muted">Permanently delete this workspace and everything in it.</p>
          </div>
          <Button variant="danger" onClick={() => setDeleteOpen(true)} className="shrink-0 bg-danger-action px-3 text-[12px] hover:bg-danger-action-hover">
            <Trash2 size={14} /> Delete workspace
          </Button>
        </div>
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Are you sure?"
          description="All snippets, projects, comments and history in this workspace will be permanently deleted for every member. This can't be undone."
          confirmLabel={deleting ? 'Deleting…' : 'Delete'}
          danger
          confirming={deleting}
          onConfirm={handleDelete}
        />
      </section>
    </div>
  )
}
