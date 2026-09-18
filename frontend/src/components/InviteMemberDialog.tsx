import { useState } from 'react'
import Dialog, { DialogDescription, DialogFooter } from './ui/Dialog'
import Button from './ui/Button'
import Field from './ui/Field'
import Input from './ui/Input'

interface InviteMemberDialogProps {
  open: boolean
  onClose: () => void
}

export default function InviteMemberDialog({ open, onClose }: InviteMemberDialogProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  function validate(input: HTMLInputElement) {
    setError(input.validity.valueMissing ? 'Email is required.' : input.validity.typeMismatch ? 'Enter a valid email address.' : '')
  }

  function handleClose() {
    setEmail('')
    setError('')
    setTouched(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={next => { if (!next) handleClose() }} title="Invite member">
      <form noValidate onSubmit={event => event.preventDefault()}>
        <div className="flex flex-col gap-4 px-6 py-5">
          <DialogDescription>
            Members will collaborate across your projects. Invitations are not available yet.
          </DialogDescription>
          <Field label="Email" error={error}>
            <Input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              placeholder="colleague@company.com"
              invalid={Boolean(error)}
              onBlur={event => { setTouched(true); validate(event.currentTarget) }}
              onChange={event => {
                setEmail(event.currentTarget.value)
                if (touched) validate(event.currentTarget)
              }}
            />
          </Field>
        </div>
        <DialogFooter className="border-t border-border-default bg-surface-muted px-6 py-4">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" disabled>Send invitation</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
