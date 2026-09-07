import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

export const alertVariants = cva('border text-sm rounded-md px-4 py-3', {
  variants: {
    variant: {
      danger: 'bg-danger-surface border-danger/30 text-danger',
      info: 'bg-accent/10 border-accent/30 text-secondary',
      warning: 'bg-warning/10 border-warning/30 text-secondary',
    },
  },
  defaultVariants: { variant: 'danger' },
})

export interface AlertProps extends ComponentProps<'div'>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

export function AlertTitle({ className, ...props }: ComponentProps<'h3'>) {
  return <h3 data-slot="alert-title" className={cn('mb-1 text-xs font-semibold', className)} {...props} />
}

export function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="alert-description" className={cn('leading-6', className)} {...props} />
}

export default Alert
