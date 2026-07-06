import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export interface SpinnerProps extends ComponentProps<'div'> {
  size?: 'sm' | 'md'
}

const SIZE_CLASSES: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-[3px]',
}

export default function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      className={cn(
        'inline-block animate-spin rounded-full border-solid border-current border-r-transparent',
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
