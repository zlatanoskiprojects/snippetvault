import { forwardRef, type ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-accent hover:bg-accent-hover text-on-accent',
        secondary: 'bg-surface border border-border-default text-secondary hover:text-primary hover:bg-control-hover transition-colors duration-150',
        ghost: 'text-secondary hover:text-primary hover:bg-interactive-overlay/5',
        danger: 'bg-danger-surface hover:bg-danger-surface-hover text-danger',
      },
      size: {
        sm: 'h-[40px] px-3 text-xs sm:h-[30px]',
        md: 'h-[40px] px-5 text-sm sm:h-[36px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export default Button
