import { forwardRef, type ComponentProps } from 'react'
import { cn } from '../../lib/utils'
import { inputBase } from './Input'

export interface TextareaProps extends ComponentProps<'textarea'> {
  invalid?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(inputBase, 'h-[60px] py-2 resize-none', invalid && 'border-danger', className)}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

export default Textarea
