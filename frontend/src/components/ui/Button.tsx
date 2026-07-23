import { forwardRef, type ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-[#6366f1] hover:bg-indigo-500 text-white',
        secondary: 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] hover:text-white hover:bg-[#222] transition-colors duration-150',
        ghost: 'text-[#9ba3af] hover:text-white hover:bg-white/5',
        danger: 'bg-[#331212] hover:bg-[#3d1515] text-[#ef4444]',
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
