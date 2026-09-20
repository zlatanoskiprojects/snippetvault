import { useState, type FormEvent } from 'react'
import { Menu } from '@base-ui/react/menu'
import { Check, ChevronDown, Plus } from 'lucide-react'
import type { Workspace } from '../api/types'
import Button from './ui/Button'
import Dialog, { DialogDescription, DialogFooter } from './ui/Dialog'
import Field from './ui/Field'
import Input from './ui/Input'

export interface WorkspaceSwitcherProps {
  workspaces: Workspace[]
  selectedWorkspaceId: number | null
  onSelectWorkspace: (id: number) => void
  onAddWorkspace: (name: string) => Promise<void>
}

export default function WorkspaceSwitcher({ workspaces, selectedWorkspaceId, onSelectWorkspace, onAddWorkspace }: WorkspaceSwitcherProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedName = workspaces.find(workspace => workspace.id === selectedWorkspaceId)?.name || 'Select workspace'

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open)
    setName('')
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextName = name.trim()
    if (!nextName) return
    setSaving(true)
    setError(null)
    try {
      await onAddWorkspace(nextName)
      handleDialogOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create workspace')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          render={<Button variant="ghost" size="unstyled" />}
          aria-label={`Switch workspace: ${selectedName}`}
          className="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg px-2 text-left text-sm font-medium text-primary data-open:bg-interactive-overlay/5"
        >
          <span className="min-w-0 flex-1 truncate" title={selectedName}>{selectedName}</span>
          <ChevronDown size={14} aria-hidden="true" className="shrink-0 text-secondary" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="start" sideOffset={4} collisionPadding={8} className="z-50 outline-none">
            <Menu.Popup className="max-h-[var(--available-height)] w-64 max-w-[var(--available-width)] origin-[var(--transform-origin)] overflow-y-auto rounded-[10px] border border-border-default bg-surface p-1 shadow-md shadow-overlay/20 outline-none transition-[opacity,scale] duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 motion-reduce:transition-none">
              <Menu.RadioGroup value={selectedWorkspaceId === null ? undefined : String(selectedWorkspaceId)} onValueChange={value => onSelectWorkspace(Number(value))}>
                <Menu.GroupLabel className="px-3 py-2 text-xs font-medium text-muted">Workspaces</Menu.GroupLabel>
                {workspaces.map(workspace => (
                  <Menu.RadioItem
                    key={workspace.id}
                    value={String(workspace.id)}
                    label={workspace.name}
                    closeOnClick
                    className="flex h-10 cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 text-sm text-secondary outline-none transition-colors duration-150 data-highlighted:bg-interactive-overlay/5 data-highlighted:text-primary data-checked:text-accent"
                  >
                    <span className="min-w-0 truncate" title={workspace.name}>{workspace.name}</span>
                    <Menu.RadioItemIndicator className="flex shrink-0 items-center justify-center"><Check size={14} aria-hidden="true" /></Menu.RadioItemIndicator>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
              <Menu.Separator className="my-1 border-t border-border-default" />
              <Menu.Item onClick={() => handleDialogOpenChange(true)} className="flex h-10 cursor-pointer items-center gap-2 rounded-md px-3 text-sm text-secondary outline-none data-highlighted:bg-interactive-overlay/5 data-highlighted:text-primary">
                <Plus size={14} aria-hidden="true" /> Add workspace
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange} title="Add workspace">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-5">
            <DialogDescription>Create a private workspace now. You can add members later.</DialogDescription>
            <Field label="Workspace name">
              <Input autoFocus value={name} onChange={event => setName(event.target.value)} maxLength={100} required />
            </Field>
            {error && <p role="alert" className="text-xs text-danger">{error}</p>}
          </div>
          <DialogFooter className="border-t border-border-default bg-surface-muted px-6 py-4">
            <Button type="button" variant="secondary" onClick={() => handleDialogOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving || !name.trim()}>{saving ? 'Creating…' : 'Create workspace'}</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
