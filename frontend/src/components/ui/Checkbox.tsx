import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { Check, Minus } from 'lucide-react'
import { cn } from '../../lib/utils'

export type CheckboxProps = BaseCheckbox.Root.Props

export function CheckboxIndicator({ className, children, ...props }: BaseCheckbox.Indicator.Props) {
  return (
    <BaseCheckbox.Indicator
      data-slot="checkbox-indicator"
      className={state => cn('flex items-center justify-center text-current', typeof className === 'function' ? className(state) : className)}
      {...props}
    >
      {children ?? <><Check aria-hidden="true" className="size-3 group-data-indeterminate/checkbox:hidden" /><Minus aria-hidden="true" className="hidden size-3 group-data-indeterminate/checkbox:block" /></>}
    </BaseCheckbox.Indicator>
  )
}

export function Checkbox({ className, children, ...props }: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      data-slot="checkbox"
      className={state => cn('group/checkbox inline-flex size-4 shrink-0 items-center justify-center rounded border border-border-default bg-control text-on-accent transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent data-checked:border-accent data-checked:bg-accent data-indeterminate:border-accent data-indeterminate:bg-accent data-disabled:cursor-not-allowed data-disabled:opacity-50 data-invalid:border-danger', typeof className === 'function' ? className(state) : className)}
      {...props}
    >
      {children ?? <CheckboxIndicator />}
    </BaseCheckbox.Root>
  )
}

export default Checkbox
