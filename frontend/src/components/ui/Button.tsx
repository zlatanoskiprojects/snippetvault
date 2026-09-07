import { forwardRef } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

export const buttonVariants = cva(
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-app disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent hover:bg-accent-hover text-on-accent',
        secondary: 'bg-surface border border-border-default text-secondary hover:text-primary hover:bg-control-hover',
        ghost: 'text-secondary hover:text-primary hover:bg-interactive-overlay/5',
        danger: 'bg-danger-surface hover:bg-danger-surface-hover text-danger',
        unstyled: '',
      },
      size: {
        default: 'h-10 px-4 text-sm sm:h-8',
        sm: 'h-10 px-3 text-xs sm:h-7',
        md: 'h-10 px-5 text-sm sm:h-9',
        unstyled: '',
      },
    },
    compoundVariants: [{
      variant: ['primary', 'secondary', 'ghost', 'danger'],
      className: 'inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-[color,background-color,border-color,box-shadow,scale] duration-150 active:scale-[0.97] disabled:active:scale-100 data-disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:size-3.5 [&_svg]:shrink-0',
    }, {
      variant: ['primary', 'secondary', 'ghost', 'danger'],
      size: 'default',
      className: 'rounded-[10px]',
    }, {
      variant: ['primary', 'secondary', 'ghost', 'danger'],
      size: 'sm',
      className: 'rounded-lg',
    }, {
      variant: ['primary', 'secondary', 'ghost', 'danger'],
      size: 'md',
      className: 'rounded-[10px]',
    }],
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends BaseButton.Props,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <BaseButton
      ref={ref}
      type={type}
      data-slot="button"
      data-variant={variant ?? 'primary'}
      data-size={size ?? 'default'}
      className={state => cn(buttonVariants({ variant, size }), typeof className === 'function' ? className(state) : className)}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export default Button
