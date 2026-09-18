import { useState } from 'react'
import { Menu, UserPlus, Users } from 'lucide-react'
import InviteMemberDialog from '../components/InviteMemberDialog'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { useUser } from '../hooks/useUser'

interface MembersViewProps {
  onMenuClick?: () => void
}

export default function MembersView({ onMenuClick }: MembersViewProps) {
  const { user, loading, error } = useUser()
  const [dialogOpen, setDialogOpen] = useState(false)
  const displayName = user?.display_name || user?.username || ''
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?'

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border-default px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {onMenuClick && (
            <Button variant="secondary" onClick={onMenuClick} aria-label="Open menu" className="h-10 w-10 shrink-0 p-0 sm:h-10 lg:hidden">
              <Menu size={14} />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight text-primary">Members</h1>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => setDialogOpen(true)} className="ml-auto shrink-0 px-4 text-xs">
          <UserPlus size={14} /> Invite member
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : error ? (
          <Alert>Failed to load members: {error}</Alert>
        ) : user ? (
          <div className="overflow-hidden rounded-lg border border-border-default bg-surface">
            <table className="w-full table-fixed text-left text-sm">
              <caption className="sr-only">Members across your projects</caption>
              <thead className="border-b border-border-default bg-surface-muted text-xs text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Member</th>
                  <th scope="col" className="w-24 px-4 py-3 font-medium sm:w-32">Role</th>
                  <th scope="col" className="hidden w-32 px-4 py-3 font-medium sm:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" className="size-9 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-avatar text-xs font-semibold text-accent">{initials}</span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-primary" title={displayName}>{displayName}</p>
                        <p className="text-xs text-muted">You</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><Badge variant="accent">Owner</Badge></td>
                  <td className="hidden px-4 py-4 text-muted sm:table-cell"><span aria-label="Joined date unavailable">—</span></td>
                </tr>
              </tbody>
            </table>
            <div className="flex flex-col items-center gap-2 border-t border-border-default px-4 py-10 text-center">
              <Users size={24} aria-hidden="true" className="mb-1 text-muted" />
              <h2 className="text-sm font-medium text-primary">No additional members yet</h2>
              <p className="max-w-sm text-xs leading-relaxed text-secondary">You’re the only member across your projects. Invitations are not available yet.</p>
            </div>
          </div>
        ) : (
          <Alert>Unable to load your member profile.</Alert>
        )}
      </div>

      <InviteMemberDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
