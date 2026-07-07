import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export interface AlertProps extends ComponentProps<'div'> {}

export default function Alert({ className, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'bg-[#331212] border border-[#ef4444]/30 text-[#ef4444] text-sm rounded-md px-4 py-3',
        className
      )}
      {...props}
    />
  )
}
