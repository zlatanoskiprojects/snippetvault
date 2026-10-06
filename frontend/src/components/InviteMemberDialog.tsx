import { useId, useState, type FormEvent } from 'react'
import { Info } from 'lucide-react'
import Dialog, { DialogDescription, DialogFooter } from './ui/Dialog'
import Button from './ui/Button'
import { FieldRoot, FieldLabel } from './ui/Field'
import Input from './ui/Input'
import Select from './ui/Select'
import { useToast } from '../hooks/useToast'

type InviteRole = 'viewer' | 'editor'

const ROLE_OPTIONS: Array<{ value: InviteRole; label: string }> = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
]

const ROLE_PERMISSIONS: Record<InviteRole, string> = {
  viewer: 'Can view workspace content and create, edit, or delete their own comments. Cannot change projects or snippets or manage members.',
  editor: 'Can view content, create projects, manage snippets, versions, and tags, and comment. Cannot rename or delete projects or invite or manage members.',
}

interface InviteMemberDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (email: string, role: InviteRole) => Promise<void>
}

export default function InviteMemberDialog({ open, onClose, onSubmit }: InviteMemberDialogProps) {
  const emailId = useId()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InviteRole>('viewer')
  const [sending, setSending] = useState(false)
  const toast = useToast()

  function handleClose() {
    if (sending) return
    setEmail('')
    setRole('viewer')
    onClose()
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return
    setSending(true)
    try {
      await onSubmit(email, role)
      setEmail('')
      setRole('viewer')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send invitation')
    } finally {
      setSending(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={next => { if (!next) handleClose() }} title="Invite member">
      <form onSubmit={handleSubmit} aria-busy={sending}>
        <div className="flex flex-col gap-4 px-6 py-5">
          <DialogDescription>
            Invite a member by email to collaborate across your projects. Choose the access they will have in this workspace.
          </DialogDescription>
          <FieldRoot name="email" className="min-w-0">
            <FieldLabel htmlFor={emailId}>Email address</FieldLabel>
            <div className="flex min-w-0 overflow-hidden rounded-[10px] border border-border-default bg-control transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-1 focus-within:ring-offset-app">
              <Input
                id={emailId}
                type="email"
                name="email"
                autoComplete="email"
                required
                disabled={sending}
                value={email}
                placeholder="colleague@company.com"
                className="min-w-0 flex-1 rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                onChange={event => setEmail(event.currentTarget.value)}
              />
              <FieldRoot name="role" className="flex w-1/3 min-w-0 shrink-0 border-l border-border-default">
                <Select value={role} onValueChange={setRole} options={ROLE_OPTIONS} disabled={sending} aria-label="Role" className="min-w-0 rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0" />
              </FieldRoot>
            </div>
          </FieldRoot>
          <div className="flex gap-2 rounded-lg border border-border-default bg-surface-muted px-3 py-2.5 text-xs leading-relaxed text-muted">
            <Info size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
            <p><span className="font-medium text-secondary">{role === 'viewer' ? 'Viewer' : 'Editor'} permissions:</span> {ROLE_PERMISSIONS[role]}</p>
          </div>
        </div>
        <DialogFooter className="border-t border-border-default bg-surface-muted px-6 py-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={sending}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={sending}>{sending ? 'Sending invitation…' : 'Send invitation'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
