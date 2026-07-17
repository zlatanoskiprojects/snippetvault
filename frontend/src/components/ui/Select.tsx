import { Select as BaseSelect } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

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

export default function Select<T extends string | number>({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
  ...rest
}: SelectProps<T>) {
  return (
    <BaseSelect.Root
      value={value}
      onValueChange={next => { if (next !== null) onValueChange(next) }}
      disabled={disabled}
      items={options.map(option => ({ value: option.value, label: option.label }))}
    >
      <BaseSelect.Trigger
        id={id}
        className={cn(
          'w-full h-[38px] flex items-center justify-between gap-2 bg-[#222] border border-[#2a2a2a] rounded-md text-sm text-white px-3 cursor-pointer transition-colors duration-150 focus:outline-none focus:border-[#6366f1] data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
          className
        )}
        {...rest}
      >
        <BaseSelect.Value placeholder={placeholder} className="truncate" />
        <BaseSelect.Icon className="shrink-0 text-[#595e69] leading-none">
          <ChevronDown size={14} />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className="z-50 outline-none" sideOffset={4}>
          <BaseSelect.Popup className="min-w-[var(--anchor-width)] max-h-[280px] overflow-y-auto bg-[#1a1a1a] border border-[#2a2a2a] rounded-md py-1 shadow-lg shadow-black/40 outline-none">
            <BaseSelect.List>
              {options.map(option => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-[#9ba3af] cursor-pointer select-none outline-none transition-colors duration-150 data-[highlighted]:bg-white/5 data-[highlighted]:text-white data-[selected]:text-[#6366f1]"
                >
                  <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="shrink-0 text-[#6366f1]">
                    <Check size={14} />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
