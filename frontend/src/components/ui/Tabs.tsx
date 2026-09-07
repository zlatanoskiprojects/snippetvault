import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export type TabsRootProps = ComponentProps<typeof BaseTabs.Root>
export type TabsListProps = ComponentProps<typeof BaseTabs.List>
export type TabsTabProps = ComponentProps<typeof BaseTabs.Tab>
export type TabsPanelProps = ComponentProps<typeof BaseTabs.Panel>

export function TabsRoot({ className, ...props }: ComponentProps<typeof BaseTabs.Root>) {
  return <BaseTabs.Root data-slot="tabs" className={state => cn('', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function TabsList({ className, children, ...props }: TabsListProps) {
  return (
    <BaseTabs.List data-slot="tabs-list" className={state => cn('relative flex items-end gap-8 border-b border-border-default', typeof className === 'function' ? className(state) : className)} {...props}>
      {children}
      <TabsIndicator />
    </BaseTabs.List>
  )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof BaseTabs.Tab>) {
  return <BaseTabs.Tab data-slot="tabs-trigger" className={state => cn('inline-flex h-10 items-center justify-center text-sm font-medium text-secondary outline-none transition-colors duration-150 hover:text-primary data-[active]:text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-app sm:h-8', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function TabsIndicator({ className, ...props }: ComponentProps<typeof BaseTabs.Indicator>) {
  return <BaseTabs.Indicator data-slot="tabs-indicator" className={state => cn('absolute bottom-0 h-0.5 bg-accent rounded-full transition-all duration-150 [left:var(--active-tab-left)] [width:var(--active-tab-width)]', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function TabsContent({ className, ...props }: ComponentProps<typeof BaseTabs.Panel>) {
  return <BaseTabs.Panel data-slot="tabs-content" className={state => cn('', typeof className === 'function' ? className(state) : className)} {...props} />
}

export const Tab = TabsTrigger
export const Panel = TabsContent

export const Tabs = Object.assign(TabsRoot, { Root: TabsRoot, List: TabsList, Tab, Panel })

export default Tabs
