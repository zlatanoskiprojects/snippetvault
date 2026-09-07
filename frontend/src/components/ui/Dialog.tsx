import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export const Dialog = BaseDialog.Root
export const DialogRoot = Dialog
export function DialogPortal(props: ComponentProps<typeof BaseDialog.Portal>) {
  return <BaseDialog.Portal data-slot="dialog-portal" {...props} />
}

export function DialogTrigger({ className, ...props }: ComponentProps<typeof BaseDialog.Trigger>) {
  return <BaseDialog.Trigger data-slot="dialog-trigger" className={state => cn('', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function DialogClose({ className, ...props }: ComponentProps<typeof BaseDialog.Close>) {
  return <BaseDialog.Close data-slot="dialog-close" className={state => cn('focus-visible:outline-2 focus-visible:outline-accent', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function DialogOverlay({ className, ...props }: ComponentProps<typeof BaseDialog.Backdrop>) {
  return <BaseDialog.Backdrop data-slot="dialog-overlay" className={state => cn('fixed inset-0 z-50 bg-overlay/60 backdrop-blur-sm transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) {
  return <BaseDialog.Title data-slot="dialog-title" className={state => cn('text-lg font-semibold text-primary', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof BaseDialog.Description>) {
  return <BaseDialog.Description data-slot="dialog-description" className={state => cn('text-sm text-secondary', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="dialog-header" className={cn('flex items-center justify-between px-6 py-4 border-b border-border-default', className)} {...props} />
}

export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="dialog-footer" className={cn('flex flex-col-reverse gap-3 sm:flex-row sm:justify-end', className)} {...props} />
}

export function DialogContent({ className, children, showCloseButton = true, ...props }: ComponentProps<typeof BaseDialog.Popup> & { showCloseButton?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <BaseDialog.Viewport data-slot="dialog-viewport" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <BaseDialog.Popup
          data-slot="dialog-content"
          className={state => cn('relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-surface border border-border-default rounded-lg outline-none transition-all duration-150 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95', typeof className === 'function' ? className(state) : className)}
          {...props}
        >
          {children}
          {showCloseButton && <DialogClose aria-label="Close dialog" className="absolute right-4 top-4 flex size-10 items-center justify-center text-secondary hover:text-primary"><X size={16} /></DialogClose>}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </DialogPortal>
  )
}

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  children: ReactNode
  className?: string
}

export default function DialogWrapper({ open, onOpenChange, title, children, className }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogClose aria-label="Close dialog" className="flex items-center justify-center size-10 -m-2 text-secondary hover:text-primary transition-colors duration-150 leading-none">
            <X size={16} />
          </DialogClose>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
