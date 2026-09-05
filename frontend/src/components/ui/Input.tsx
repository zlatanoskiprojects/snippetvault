import { forwardRef, type ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export const inputBase =
  'w-full bg-control border border-border-default rounded-md text-sm text-primary placeholder-muted px-3 h-[38px] focus:outline-none focus:border-accent transition-colors duration-150'

export interface InputProps extends ComponentProps<'input'> {
  invalid?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(inputBase, invalid && 'border-danger', className)}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export default Input
