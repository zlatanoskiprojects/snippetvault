import { forwardRef, type ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export interface CardProps extends ComponentProps<'div'> {
  accentColor?: string
  accentClassName?: string
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ accentColor, accentClassName = 'h-[3px]', className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden', className)}
      {...props}
    >
      {accentColor && (
        <div className={cn('w-full shrink-0', accentClassName)} style={{ backgroundColor: accentColor }} />
      )}
      {children}
    </div>
  )
)
Card.displayName = 'Card'

export default Card
