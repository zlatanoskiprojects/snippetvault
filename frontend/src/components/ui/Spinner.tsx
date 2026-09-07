import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

export const spinnerVariants = cva('inline-block animate-spin rounded-full border-solid border-current border-r-transparent', {
  variants: { size: { sm: 'size-4 border-2', md: 'size-8 border-3' } },
  defaultVariants: { size: 'md' },
})

export interface SpinnerProps extends ComponentProps<'div'>, VariantProps<typeof spinnerVariants> {}

export function Spinner({ size, className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      data-slot="spinner"
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export default Spinner
