import { Select as BaseSelect } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'
import { inputBase } from './Input'

export const Select = BaseSelect.Root
export const SelectRoot = Select
export function SelectPortal(props: ComponentProps<typeof BaseSelect.Portal>) {
  return <BaseSelect.Portal data-slot="select-portal" {...props} />
}

export function SelectValue({ className, ...props }: ComponentProps<typeof BaseSelect.Value>) {
  return <BaseSelect.Value data-slot="select-value" className={state => cn('truncate', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function SelectGroup({ className, ...props }: ComponentProps<typeof BaseSelect.Group>) {
  return <BaseSelect.Group data-slot="select-group" className={state => cn('', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function SelectLabel({ className, ...props }: ComponentProps<typeof BaseSelect.GroupLabel>) {
  return <BaseSelect.GroupLabel data-slot="select-label" className={state => cn('px-3 py-1.5 text-xs text-muted', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function SelectSeparator({ className, ...props }: ComponentProps<typeof BaseSelect.Separator>) {
  return <BaseSelect.Separator data-slot="select-separator" className={state => cn('my-1 border-border-default', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function SelectTrigger({ className, children, ...props }: ComponentProps<typeof BaseSelect.Trigger>) {
  return (
    <BaseSelect.Trigger data-slot="select-trigger" className={state => cn(inputBase, 'flex cursor-pointer items-center justify-between gap-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50', typeof className === 'function' ? className(state) : className)} {...props}>
      {children}
      <BaseSelect.Icon data-slot="select-icon" className="flex shrink-0 items-center justify-center text-muted"><ChevronDown size={14} /></BaseSelect.Icon>
    </BaseSelect.Trigger>
  )
}

export function SelectContent({ className, children, side = 'bottom', align = 'center', sideOffset = 4, alignOffset = 0, alignItemWithTrigger = true, ...props }: ComponentProps<typeof BaseSelect.Popup> & Pick<ComponentProps<typeof BaseSelect.Positioner>, 'side' | 'align' | 'sideOffset' | 'alignOffset' | 'alignItemWithTrigger'>) {
  return (
    <SelectPortal>
      <BaseSelect.Positioner data-slot="select-positioner" className="z-50 outline-none" side={side} align={align} sideOffset={sideOffset} alignOffset={alignOffset} alignItemWithTrigger={alignItemWithTrigger}>
        <BaseSelect.Popup data-slot="select-content" className={state => cn('max-h-70 min-w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-y-auto rounded-[10px] border border-border-default bg-surface p-1 shadow-md shadow-overlay/20 outline-none transition-[opacity,scale,translate] duration-150 data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.96] data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.96] data-[side=bottom]:data-[starting-style]:-translate-y-0.5 data-[side=bottom]:data-[ending-style]:-translate-y-0.5 data-[side=top]:data-[starting-style]:translate-y-0.5 data-[side=top]:data-[ending-style]:translate-y-0.5 data-[side=left]:data-[starting-style]:translate-x-0.5 data-[side=left]:data-[ending-style]:translate-x-0.5 data-[side=right]:data-[starting-style]:-translate-x-0.5 data-[side=right]:data-[ending-style]:-translate-x-0.5 motion-reduce:transition-none', typeof className === 'function' ? className(state) : className)} {...props}>
          <BaseSelect.List data-slot="select-list">{children}</BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </SelectPortal>
  )
}

export function SelectItem({ className, children, ...props }: ComponentProps<typeof BaseSelect.Item>) {
  return (
    <BaseSelect.Item data-slot="select-item" className={state => cn('flex h-10 cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 text-sm leading-none text-secondary outline-none transition-colors duration-150 data-[highlighted]:bg-interactive-overlay/5 data-[highlighted]:text-primary data-[selected]:text-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 sm:h-7', typeof className === 'function' ? className(state) : className)} {...props}>
      <BaseSelect.ItemText data-slot="select-item-text" className="min-w-0 truncate">{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator data-slot="select-item-indicator" className="flex shrink-0 items-center justify-center text-accent"><Check size={14} /></BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  )
}

export interface SelectOption<T extends string | number> {
  value: T
  label: string
}

export interface SelectProps<T extends string | number> {
  id?: string
  value: T
  onValueChange: (value: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export default function SelectWrapper<T extends string | number>({ id, value, onValueChange, options, placeholder, disabled, className, ...rest }: SelectProps<T>) {
  return (
    <Select value={value} onValueChange={next => { if (next !== null) onValueChange(next) }} disabled={disabled} items={options}>
      <SelectTrigger id={id} className={className} {...rest}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
