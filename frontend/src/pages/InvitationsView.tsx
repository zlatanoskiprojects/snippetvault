import { useId } from 'react'
import { Mail, Menu } from 'lucide-react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

export interface InvitationDisplay {
  id: string | number
  workspaceName?: string | null
  inviterName?: string | null
  expiresAt?: string | null
}

interface InvitationsViewProps {
  invitations?: InvitationDisplay[]
  onMenuClick?: () => void
}

function formatExpiry(value?: string | null) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Expiry unavailable'
}

export default function InvitationsView({ invitations = [], onMenuClick }: InvitationsViewProps) {
  const unavailableId = useId()

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-2 border-b border-border-default px-4 py-3 sm:px-6">
        {onMenuClick && (
          <Button variant="secondary" onClick={onMenuClick} aria-label="Open menu" className="h-10 w-10 shrink-0 p-0 sm:h-10 lg:hidden">
            <Menu size={14} />
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-tight text-primary">Pending invitations</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="overflow-hidden rounded-lg border border-border-default bg-surface">
          {invitations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Mail size={24} aria-hidden="true" className="mb-1 text-muted" />
              <h2 className="text-sm font-medium text-primary">No pending invitations</h2>
              <p className="max-w-sm text-xs leading-relaxed text-secondary">Receiving and responding to workspace invitations are not available yet.</p>
            </div>
          ) : (
            <>
              <ul aria-label="Pending workspace invitations" className="divide-y divide-border-default">
                {invitations.map(invitation => {
                  const workspace = invitation.workspaceName?.trim() || 'Workspace name pending'
                  const inviter = invitation.inviterName?.trim() || 'Inviter unavailable'
                  return (
                    <li key={invitation.id} className="grid min-w-0 grid-cols-1 items-center gap-4 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4">
                      <dl className="min-w-0">
                        <dt className="mb-1 text-xs text-muted">Workspace</dt>
                        <dd className="min-w-0">
                          <p className="truncate text-sm font-medium text-primary" title={workspace}>{workspace}</p>
                          <Badge variant="accent" className="mt-1">Pending</Badge>
                        </dd>
                      </dl>
                      <dl className="min-w-0">
                        <dt className="mb-1 text-xs text-muted">Invited by</dt>
                        <dd className="truncate text-sm text-secondary" title={inviter}>{inviter}</dd>
                      </dl>
                      <dl className="min-w-0">
                        <dt className="mb-1 text-xs text-muted">Expires</dt>
                        <dd className="text-sm text-secondary">{formatExpiry(invitation.expiresAt)}</dd>
                      </dl>
                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <Button variant="primary" size="sm" disabled aria-label={`Accept invitation to ${workspace} from ${inviter}`} aria-describedby={unavailableId}>Accept</Button>
                        <Button variant="secondary" size="sm" disabled aria-label={`Decline invitation to ${workspace} from ${inviter}`} aria-describedby={unavailableId}>Decline</Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <p id={unavailableId} className="border-t border-border-default bg-surface-muted px-4 py-3 text-xs leading-relaxed text-secondary">Accepting and declining invitations are not available yet.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
