import { forwardRef, type ComponentProps } from 'react'
import { cn } from '../../lib/utils'

const accentColors: Record<string, string> = {
  'var(--color-accent)': 'bg-accent',
  'var(--color-category-blue)': 'bg-category-blue',
  'var(--color-category-green)': 'bg-category-green',
  'var(--color-category-purple)': 'bg-category-purple',
  'var(--color-category-orange)': 'bg-category-orange',
}

export interface CardProps extends ComponentProps<'div'> {
  accentColor?: string
  accentClassName?: string
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ accentColor, accentClassName, className, children, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card"
      className={cn('bg-surface border border-border-default rounded-lg overflow-hidden', className)}
      {...props}
    >
      {accentColor && (
        <CardAccent className={cn(accentColors[accentColor], accentClassName)} />
      )}
      {children}
    </div>
  )
)
Card.displayName = 'Card'

export function CardAccent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-accent" className={cn('h-0.75 w-full shrink-0', className)} {...props} />
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1 px-4 py-3', className)} {...props} />
}

export function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return <h3 data-slot="card-title" className={cn('text-sm font-semibold text-primary', className)} {...props} />
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="card-description" className={cn('text-xs text-muted', className)} {...props} />
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-4 py-3', className)} {...props} />
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('flex items-center gap-2 px-4 py-3', className)} {...props} />
}

export default Card
