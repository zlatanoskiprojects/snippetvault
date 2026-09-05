import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export type TabsRootProps = ComponentProps<typeof BaseTabs.Root>

export function TabsRoot(props: TabsRootProps) {
  return <BaseTabs.Root {...props} />
}

export interface TabsListProps extends ComponentProps<typeof BaseTabs.List> {}

export function TabsList({ className, children, ...props }: TabsListProps) {
  return (
    <BaseTabs.List
      className={cn('relative flex items-end gap-8 border-b border-border-default', className)}
      {...props}
    >
      {children}
      <TabsIndicator />
    </BaseTabs.List>
  )
}

export interface TabsTabProps extends ComponentProps<typeof BaseTabs.Tab> {}

export function Tab({ className, ...props }: TabsTabProps) {
  return (
    <BaseTabs.Tab
      className={cn(
        'py-2.5 sm:py-0 sm:pb-2 text-sm font-normal text-secondary outline-none transition-colors duration-150 hover:text-primary data-[active]:text-primary data-[active]:font-medium',
        className
      )}
      {...props}
    />
  )
}

function TabsIndicator({ className }: { className?: string }) {
  return (
    <BaseTabs.Indicator
      className={cn(
        'absolute bottom-0 h-[2px] bg-accent rounded-full transition-all duration-150 [left:var(--active-tab-left)] [width:var(--active-tab-width)]',
        className
      )}
    />
  )
}

export interface TabsPanelProps extends ComponentProps<typeof BaseTabs.Panel> {}

export function Panel({ className, ...props }: TabsPanelProps) {
  return <BaseTabs.Panel className={className} {...props} />
}

export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Tab,
  Panel,
}

export default Tabs
