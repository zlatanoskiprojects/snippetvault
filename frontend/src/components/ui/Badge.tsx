import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends Omit<ComponentProps<'span'>, 'children'> {
  label: ReactNode
  dotColor?: string
  textColor?: string
  bgColor?: string
}

export default function Badge({ label, dotColor, textColor, bgColor, className, style, ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium', className)}
      style={{ backgroundColor: bgColor, color: textColor, ...style }}
      {...props}
    >
      {dotColor && (
        <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ backgroundColor: dotColor }} />
      )}
      {label}
    </span>
  )
}
