import { useEffect, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Menu } from 'lucide-react'
import { getInvitations, type Invitation } from '../api/invitations'
import { ApiError } from '../api/utils'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'

interface InvitationsViewProps {
  onMenuClick?: () => void
}

function formatExpiry(value?: string | null) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Expiry unavailable'
}

export default function InvitationsView({ onMenuClick }: InvitationsViewProps) {
  const unavailableId = useId()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let current = true
    setLoading(true)
    setError(null)
    getInvitations()
      .then(data => { if (current) setInvitations(data) })
      .catch(err => {
        if (!current) return
        if (err instanceof ApiError && err.status === 401) navigate('/login')
        else setError(err instanceof Error ? err.message : 'Could not load invitations')
      })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [navigate])

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
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : error ? (
          <Alert>Failed to load invitations: {error}</Alert>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border-default bg-surface">
          {invitations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Mail size={24} aria-hidden="true" className="mb-1 text-muted" />
              <h2 className="text-sm font-medium text-primary">No pending invitations</h2>
              <p className="max-w-sm text-xs leading-relaxed text-secondary">You have no pending workspace invitations for your account email.</p>
            </div>
          ) : (
            <>
              <ul aria-label="Pending workspace invitations" className="divide-y divide-border-default">
                {invitations.map(invitation => {
                  const workspace = invitation.workspace_name.trim() || 'Workspace name unavailable'
                  const inviter = invitation.inviter_name?.trim() || 'Inviter unavailable'
                  return (
                    <li key={invitation.id} className="grid min-w-0 grid-cols-1 items-center gap-4 px-4 py-4 sm:grid-cols-2 xl:grid-cols-4">
                      <dl className="min-w-0">
                        <dt className="mb-1 text-xs text-muted">Workspace</dt>
                        <dd className="min-w-0">
                          <p className="truncate text-sm font-medium text-primary" title={workspace}>{workspace}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Badge variant="accent">Pending</Badge>
                            <Badge variant="outline">{invitation.role === 'editor' ? 'Editor' : 'Viewer'}</Badge>
                          </div>
                        </dd>
                      </dl>
                      <dl className="min-w-0">
                        <dt className="mb-1 text-xs text-muted">Invited by</dt>
                        <dd className="truncate text-sm text-secondary" title={inviter}>{inviter}</dd>
                      </dl>
                      <dl className="min-w-0">
                        <dt className="mb-1 text-xs text-muted">Expires</dt>
                        <dd className="text-sm text-secondary">{formatExpiry(invitation.expires_at)}</dd>
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
        )}
      </div>
    </div>
  )
}
