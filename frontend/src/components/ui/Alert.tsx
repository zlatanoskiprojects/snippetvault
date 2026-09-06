import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export interface AlertProps extends ComponentProps<'div'> {}

export default function Alert({ className, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'bg-danger-surface border border-danger/30 text-danger text-sm rounded-md px-4 py-3',
        className
      )}
      {...props}
    />
  )
}
