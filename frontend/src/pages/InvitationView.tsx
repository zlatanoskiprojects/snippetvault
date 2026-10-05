import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Code2, LogOut, Users } from 'lucide-react'
import { logout } from '../api/auth'
import { acceptInvitation, getInvitationByToken, type TokenInvitation } from '../api/invitations'
import { getProfile } from '../api/profile'
import type { User } from '../api/types'
import { ApiError } from '../api/utils'
import Alert from '../components/ui/Alert'
import Button, { buttonVariants } from '../components/ui/Button'
import { Card, CardContent, CardFooter } from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import { cn } from '../lib/utils'

type InvitationState =
  | { status: 'loading' }
  | { status: 'ready'; invitation: TokenInvitation }
  | { status: 'unavailable' }
  | { status: 'error' }

type SessionState =
  | { status: 'loading' }
  | { status: 'ready'; user: User | null }
  | { status: 'error' }

function InvitationPage({ token }: { token: string }) {
  const navigate = useNavigate()
  const [invitationState, setInvitationState] = useState<InvitationState>({ status: 'loading' })
  const [sessionState, setSessionState] = useState<SessionState>({ status: 'loading' })
  const [invitationAttempt, setInvitationAttempt] = useState(0)
  const [sessionAttempt, setSessionAttempt] = useState(0)
  const [action, setAction] = useState<'accept' | 'logout' | null>(null)
  const [actionError, setActionError] = useState('')
  const active = useRef(false)
  const actionPending = useRef(false)

  useEffect(() => {
    active.current = true
    return () => { active.current = false }
  }, [])

  useEffect(() => {
    let current = true
    getInvitationByToken(token).then(
      invitation => { if (current) setInvitationState({ status: 'ready', invitation }) },
      error => {
        if (!current) return
        setInvitationState({ status: error instanceof ApiError && [400, 404].includes(error.status) ? 'unavailable' : 'error' })
      },
    )
    return () => { current = false }
  }, [token, invitationAttempt])

  useEffect(() => {
    let current = true
    getProfile().then(
      profile => { if (current) setSessionState({ status: 'ready', user: profile.user }) },
      error => {
        if (!current) return
        setSessionState(error instanceof ApiError && error.status === 401 ? { status: 'ready', user: null } : { status: 'error' })
      },
    )
    return () => { current = false }
  }, [sessionAttempt])

  const invitation = invitationState.status === 'ready' ? invitationState.invitation : null
  const user = sessionState.status === 'ready' ? sessionState.user : null
  const matchesRecipient = Boolean(invitation && user && user.email.trim().toLowerCase() === invitation.email.trim().toLowerCase())
  const linkClassName = (variant: 'primary' | 'secondary') => cn(buttonVariants({ variant }), 'w-full')

  async function handleAccept() {
    if (!invitation || !matchesRecipient || sessionState.status !== 'ready' || actionPending.current) return
    actionPending.current = true
    setAction('accept')
    setActionError('')
    try {
      await acceptInvitation(invitation.id)
      if (active.current) navigate('/dashboard')
    } catch (error) {
      if (!active.current) return
      setActionError(error instanceof Error ? error.message : 'Unable to accept the invitation. Please try again.')
      if (error instanceof ApiError && error.status === 401) setSessionState({ status: 'ready', user: null })
      if (error instanceof ApiError && error.status === 404) setInvitationState({ status: 'unavailable' })
    } finally {
      actionPending.current = false
      if (active.current) setAction(null)
    }
  }

  async function handleLogout() {
    if (actionPending.current) return
    actionPending.current = true
    setAction('logout')
    setActionError('')
    try {
      await logout()
      if (!active.current) return
      setSessionState({ status: 'loading' })
      setSessionAttempt(attempt => attempt + 1)
    } catch (error) {
      if (active.current) setActionError(error instanceof Error ? error.message : 'Unable to sign out. Please try again.')
    } finally {
      actionPending.current = false
      if (active.current) setAction(null)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-4 py-8">
      <div className="w-full min-w-0 max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-on-accent">
            <Code2 className="size-5" aria-hidden="true" />
          </div>
          <p className="text-lg font-semibold text-primary">Snippet Vault</p>
        </div>
        <Card className="rounded-xl" aria-labelledby="invitation-heading">
          {!invitation && (
            <h1 id="invitation-heading" className="sr-only">
              {invitationState.status === 'loading' ? 'Loading invitation' : invitationState.status === 'unavailable' ? 'Invitation unavailable' : 'Unable to load invitation'}
            </h1>
          )}
          <CardContent className="flex min-w-0 flex-col gap-6 p-6">
            {invitationState.status === 'loading' && (
              <div className="flex flex-col items-center gap-3 py-6 text-secondary">
                <Spinner />
                <p className="text-sm">Loading invitation...</p>
              </div>
            )}
            {invitationState.status === 'unavailable' && (
              <>
                <Alert variant="info">This invitation is invalid, expired, or no longer pending. Ask the workspace owner for a new invitation.</Alert>
                <Link to={user ? '/dashboard' : '/login'} className={linkClassName('secondary')}>
                  {user ? 'Go to dashboard' : 'Sign in'}
                </Link>
              </>
            )}
            {invitationState.status === 'error' && (
              <>
                <Alert>Unable to load this invitation. Please try again.</Alert>
                <Button className="w-full" onClick={() => {
                  setInvitationState({ status: 'loading' })
                  setInvitationAttempt(attempt => attempt + 1)
                }}>Try again</Button>
              </>
            )}
            {invitation && (
              <>
                <div className="flex min-w-0 flex-col items-center gap-4 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-control text-primary">
                    <Users className="size-6" aria-hidden="true" />
                  </div>
                  <h1 id="invitation-heading" className="w-full min-w-0 break-words text-lg font-semibold text-primary">Join {invitation.workspace_name}</h1>
                  <p className="w-full min-w-0 break-words text-sm leading-6 text-secondary">
                    <span className="font-medium text-primary">{invitation.inviter_name || 'A workspace owner'}</span> has invited you to join their workspace as {invitation.role === 'editor' ? 'an editor' : 'a viewer'}.
                  </p>
                </div>
                {sessionState.status === 'loading' && (
                  <div className="flex items-center justify-center gap-2 text-sm text-secondary"><Spinner size="sm" />Checking your account...</div>
                )}
                {sessionState.status === 'error' && (
                  <div className="flex flex-col gap-3">
                    <Alert>Unable to check your account. Retry before accepting this invitation.</Alert>
                    <Button variant="secondary" className="w-full" onClick={() => {
                      setSessionState({ status: 'loading' })
                      setSessionAttempt(attempt => attempt + 1)
                    }}>Retry account check</Button>
                  </div>
                )}
                {sessionState.status === 'ready' && !user && (
                  <div className="flex flex-col gap-6">
                    <p className="break-words text-center text-sm text-secondary">Sign in or create an account with <span className="font-medium text-primary">{invitation.email}</span> to join.</p>
                    <div className="flex flex-col gap-3">
                      <Link to="/register" className={linkClassName('primary')}>Create account</Link>
                      <Link to={`/login?${new URLSearchParams({ returnTo: `/invitations/${token}` })}`} className={linkClassName('secondary')}>Sign in</Link>
                    </div>
                  </div>
                )}
                {sessionState.status === 'ready' && user && (
                  <div className="flex flex-col gap-3">
                    {matchesRecipient ? (
                      <Button className="w-full" disabled={action !== null} aria-busy={action === 'accept'} onClick={handleAccept}>
                        {action === 'accept' ? <Spinner size="sm" /> : <CheckCircle2 aria-hidden="true" />}
                        {action === 'accept' ? 'Accepting invitation...' : 'Accept invitation'}
                      </Button>
                    ) : (
                      <>
                        <Alert variant="warning" className="break-words">This invitation was sent to <span className="font-medium">{invitation.email}</span>. Sign out and use that account to accept it.</Alert>
                        <Button className="w-full" disabled={action !== null} aria-busy={action === 'logout'} onClick={handleLogout}>
                          {action === 'logout' ? <Spinner size="sm" /> : <LogOut aria-hidden="true" />}
                          {action === 'logout' ? 'Signing out...' : 'Sign out'}
                        </Button>
                      </>
                    )}
                    <Link to="/dashboard" className={linkClassName('secondary')}>Go to dashboard</Link>
                  </div>
                )}
              </>
            )}
            {actionError && <Alert className="break-words">{actionError}</Alert>}
          </CardContent>
          {user && (
            <CardFooter className="mx-6 justify-center border-t border-divider px-0 py-4">
              <p className="min-w-0 break-words text-center text-xs leading-5 text-muted">Signed in as <span className="font-medium text-secondary">{user.email}</span></p>
            </CardFooter>
          )}
        </Card>
      </div>
    </main>
  )
}

export default function InvitationView() {
  const { token = '' } = useParams<{ token: string }>()
  return <InvitationPage key={token} token={token} />
}
