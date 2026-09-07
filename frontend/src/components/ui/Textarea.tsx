import { forwardRef, type ComponentProps } from 'react'
import { cn } from '../../lib/utils'
import { inputBase } from './Input'

export interface TextareaProps extends ComponentProps<'textarea'> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      data-slot="textarea"
      aria-invalid={invalid || undefined}
      className={cn(inputBase, 'h-15 py-2 resize-none', invalid && 'border-danger', className)}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

export default Textarea
