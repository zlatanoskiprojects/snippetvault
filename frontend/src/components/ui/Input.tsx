import { forwardRef } from 'react'
import { Input as BaseInput } from '@base-ui/react/input'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

export const inputBase =
  'h-10 w-full rounded-[10px] border border-border-default bg-control px-3 text-sm leading-5 text-primary placeholder-muted transition-[border-color,box-shadow] duration-150 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-app disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger data-invalid:border-danger sm:h-9'

export const inputVariants = cva('', {
  variants: { variant: { default: inputBase, unstyled: '' } },
  defaultVariants: { variant: 'default' },
})

export interface InputProps extends BaseInput.Props, VariantProps<typeof inputVariants> {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, variant, ...props }, ref) => (
    <BaseInput
      ref={ref}
      data-slot="input"
      aria-invalid={invalid || undefined}
      className={state => cn(inputVariants({ variant }), invalid && 'border-danger', typeof className === 'function' ? className(state) : className)}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export default Input
