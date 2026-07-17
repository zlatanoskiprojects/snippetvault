import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  children: ReactNode
  className?: string
}

export default function Dialog({ open, onOpenChange, title, children, className }: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <BaseDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <BaseDialog.Popup
            className={cn(
              'w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg outline-none transition-all duration-150 data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
              className
            )}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
              <BaseDialog.Title className="text-lg font-semibold text-white">
                {title}
              </BaseDialog.Title>
              <BaseDialog.Close className="text-[#9ba3af] hover:text-white transition-colors duration-150 leading-none">
                <X size={16} />
              </BaseDialog.Close>
            </div>
            {children}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}
