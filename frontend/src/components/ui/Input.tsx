import { forwardRef, type ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export const inputBase =
  'w-full bg-[#222] border border-[#2a2a2a] rounded-md text-sm text-white placeholder-[#595e69] px-3 h-[38px] focus:outline-none focus:border-[#6366f1] transition-colors duration-150'

export interface InputProps extends ComponentProps<'input'> {
  invalid?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(inputBase, invalid && 'border-[#ef4444]', className)}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export default Input
