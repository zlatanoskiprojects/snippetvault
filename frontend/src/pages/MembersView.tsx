import { useEffect, useState } from 'react'
import { Menu, Users } from 'lucide-react'
import { getWorkspaceMembers, removeWorkspaceMember, updateWorkspaceMemberRole } from '../api/workspaces'
import type { WorkspaceMember, WorkspaceRole } from '../api/types'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../hooks/useToast'

interface MembersViewProps {
  workspaceId: number
  canManage: boolean
  onMenuClick?: () => void
}

const ROLE_OPTIONS: Array<{ value: Exclude<WorkspaceRole, 'owner'>; label: string }> = [
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
]

export default function MembersView({ workspaceId, canManage, onMenuClick }: MembersViewProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingUserId, setPendingUserId] = useState<number | null>(null)
  const toast = useToast()

  useEffect(() => {
    let current = true
    setLoading(true)
    setError(null)
    getWorkspaceMembers(workspaceId)
      .then(data => { if (current) setMembers(data) })
      .catch(err => { if (current) setError(err instanceof Error ? err.message : 'Could not load members') })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [workspaceId])

  async function changeRole(member: WorkspaceMember, role: Exclude<WorkspaceRole, 'owner'>) {
    setPendingUserId(member.user_id)
    try {
      await updateWorkspaceMemberRole(workspaceId, member.user_id, role)
      setMembers(current => current.map(item => item.user_id === member.user_id ? { ...item, role } : item))
      toast.success('Member role updated.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update member role')
    } finally {
      setPendingUserId(null)
    }
  }

  async function removeMember(member: WorkspaceMember) {
    setPendingUserId(member.user_id)
    try {
      await removeWorkspaceMember(workspaceId, member.user_id)
      setMembers(current => current.filter(item => item.user_id !== member.user_id))
      toast.success('Member removed.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove member')
    } finally {
      setPendingUserId(null)
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-2 border-b border-border-default px-4 py-3 sm:px-6">
        {onMenuClick && (
          <Button variant="secondary" onClick={onMenuClick} aria-label="Open menu" className="h-10 w-10 shrink-0 p-0 sm:h-10 lg:hidden">
            <Menu size={14} />
          </Button>
        )}
        <h1 className="truncate text-lg font-semibold leading-tight text-primary">Members</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : error ? (
          <Alert>Failed to load members: {error}</Alert>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Users size={24} aria-hidden="true" className="text-muted" />
            <p className="text-sm text-secondary">No workspace members found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border-default bg-surface">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">Workspace members</caption>
              <thead className="border-b border-border-default bg-surface-muted text-xs text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Member</th>
                  <th scope="col" className="w-36 px-4 py-3 font-medium">Role</th>
                  <th scope="col" className="w-32 px-4 py-3 font-medium">Joined</th>
                  {canManage && <th scope="col" className="w-28 px-4 py-3 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {members.map(member => {
                  const displayName = member.display_name || member.username
                  const initials = displayName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?'
                  const pending = pendingUserId === member.user_id
                  return (
                    <tr key={member.user_id}>
                      <td className="px-4 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" referrerPolicy="no-referrer" className="size-9 shrink-0 rounded-full object-cover" />
                          ) : (
                            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-avatar text-xs font-semibold text-accent">{initials}</span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-primary" title={displayName}>{displayName}</p>
                            <p className="truncate text-xs text-muted">@{member.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {canManage && member.role !== 'owner' ? (
                          <Select
                            value={member.role}
                            onValueChange={role => changeRole(member, role)}
                            options={ROLE_OPTIONS}
                            disabled={pending}
                            aria-label={`Role for ${displayName}`}
                            className="h-8"
                          />
                        ) : (
                          <Badge variant={member.role === 'owner' ? 'accent' : 'outline'}>{member.role[0].toUpperCase() + member.role.slice(1)}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-muted">{new Date(member.joined_at).toLocaleDateString()}</td>
                      {canManage && (
                        <td className="px-4 py-4 text-right">
                          {member.role !== 'owner' && (
                            <Button variant="danger" size="sm" disabled={pending} onClick={() => removeMember(member)}>Remove</Button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
