import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog'
import type { ComponentProps, ReactNode } from 'react'
import Button from './Button'
import { cn } from '../../lib/utils'

export const AlertDialog = BaseAlertDialog.Root
export const AlertDialogRoot = AlertDialog
export function AlertDialogPortal(props: ComponentProps<typeof BaseAlertDialog.Portal>) {
  return <BaseAlertDialog.Portal data-slot="alert-dialog-portal" {...props} />
}

export function AlertDialogTrigger({ className, ...props }: ComponentProps<typeof BaseAlertDialog.Trigger>) {
  return <BaseAlertDialog.Trigger data-slot="alert-dialog-trigger" className={state => cn('', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function AlertDialogCancel({ className, ...props }: ComponentProps<typeof BaseAlertDialog.Close>) {
  return <BaseAlertDialog.Close render={<Button variant="secondary" />} data-slot="alert-dialog-cancel" className={state => cn('', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function AlertDialogOverlay({ className, ...props }: ComponentProps<typeof BaseAlertDialog.Backdrop>) {
  return <BaseAlertDialog.Backdrop data-slot="alert-dialog-overlay" className={state => cn('fixed inset-0 z-50 bg-overlay/60 backdrop-blur-sm transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function AlertDialogTitle({ className, ...props }: ComponentProps<typeof BaseAlertDialog.Title>) {
  return <BaseAlertDialog.Title data-slot="alert-dialog-title" className={state => cn('text-[15px] font-semibold text-primary', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function AlertDialogDescription({ className, ...props }: ComponentProps<typeof BaseAlertDialog.Description>) {
  return <BaseAlertDialog.Description data-slot="alert-dialog-description" className={state => cn('text-[13px] text-secondary leading-relaxed', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function AlertDialogAction(props: ComponentProps<typeof Button>) {
  return <Button data-slot="alert-dialog-action" {...props} />
}

export function AlertDialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="alert-dialog-header" className={cn('flex flex-col gap-2', className)} {...props} />
}

export function AlertDialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="alert-dialog-footer" className={cn('flex flex-col-reverse gap-3 mt-4 sm:flex-row sm:justify-end', className)} {...props} />
}

export function AlertDialogContent({ className, ...props }: ComponentProps<typeof BaseAlertDialog.Popup>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <BaseAlertDialog.Viewport data-slot="alert-dialog-viewport" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <BaseAlertDialog.Popup data-slot="alert-dialog-content" className={state => cn('w-full max-w-md max-h-[90vh] overflow-y-auto bg-surface border border-border-default rounded-lg outline-none p-6 flex flex-col gap-2 transition-all duration-150 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95', typeof className === 'function' ? className(state) : className)} {...props} />
      </BaseAlertDialog.Viewport>
    </AlertDialogPortal>
  )
}

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  confirming?: boolean
  onConfirm: () => void
}

export default function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, confirming = false, onConfirm }: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        <AlertDialogFooter>
          <AlertDialogCancel render={<Button variant="secondary" className="w-full sm:w-auto">{cancelLabel}</Button>} />
          <AlertDialogAction variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={confirming} className={cn('w-full sm:w-auto', danger && 'bg-danger-action hover:bg-danger-action-hover text-danger')}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
