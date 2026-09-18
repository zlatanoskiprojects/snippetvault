import { useId } from 'react'
import { Menu } from '@base-ui/react/menu'
import { Check, ChevronDown, Plus } from 'lucide-react'
import Button from './ui/Button'

export interface WorkspaceOption {
  id: string
  name: string
}

export interface WorkspaceSwitcherProps {
  workspaces: WorkspaceOption[]
  selectedWorkspaceId: string
  onSelectWorkspace: (id: string) => void
}

export default function WorkspaceSwitcher({ workspaces, selectedWorkspaceId, onSelectWorkspace }: WorkspaceSwitcherProps) {
  const unavailableId = useId()
  const selectedName = workspaces.find(workspace => workspace.id === selectedWorkspaceId)?.name || 'Select workspace'

  return (
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
            <Menu.RadioGroup value={selectedWorkspaceId} onValueChange={onSelectWorkspace}>
              <Menu.GroupLabel className="px-3 py-2 text-xs font-medium text-muted">Workspaces</Menu.GroupLabel>
              {workspaces.map(workspace => (
                <Menu.RadioItem
                  key={workspace.id}
                  value={workspace.id}
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
            <Menu.Item disabled aria-describedby={unavailableId} className="flex h-10 cursor-not-allowed items-center gap-2 rounded-md px-3 text-sm text-secondary data-disabled:opacity-50">
              <Plus size={14} aria-hidden="true" /> Add workspace
            </Menu.Item>
            <p id={unavailableId} className="px-3 pb-2 text-xs leading-relaxed text-muted">Workspace creation is not available yet.</p>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
