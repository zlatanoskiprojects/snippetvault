import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog'
import type { ReactNode } from 'react'
import Button from './Button'
import { cn } from '../../lib/utils'

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

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  confirming = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <BaseAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseAlertDialog.Portal>
        <BaseAlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <BaseAlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <BaseAlertDialog.Popup className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg outline-none p-6 flex flex-col gap-2 transition-all duration-150 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95">
            <BaseAlertDialog.Title className="text-[15px] font-semibold text-white">
              {title}
            </BaseAlertDialog.Title>
            {description && (
              <BaseAlertDialog.Description className="text-[13px] text-[#9ba3af] leading-relaxed">
                {description}
              </BaseAlertDialog.Description>
            )}
            <div className="flex flex-col-reverse gap-3 mt-4 sm:flex-row sm:justify-end">
              <BaseAlertDialog.Close
                render={<Button variant="secondary" className="w-full sm:w-auto">{cancelLabel}</Button>}
              />
              <Button
                variant={danger ? 'danger' : 'primary'}
                onClick={onConfirm}
                disabled={confirming}
                className={cn('w-full sm:w-auto', danger && 'bg-[#3d1414] hover:bg-[#4a1a1a] text-[#ef4444]')}
              >
                {confirmLabel}
              </Button>
            </div>
          </BaseAlertDialog.Popup>
        </BaseAlertDialog.Viewport>
      </BaseAlertDialog.Portal>
    </BaseAlertDialog.Root>
  )
}
