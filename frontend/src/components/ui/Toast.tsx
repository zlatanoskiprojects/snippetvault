import { Toast as BaseToast } from '@base-ui/react/toast'
import { X } from 'lucide-react'
import { useEffect, useMemo, type ReactNode } from 'react'
import { ToastContext, setToastHandler } from '../../contexts/ToastContext'
import type { ToastContextValue } from '../../contexts/ToastContext'
import { cn } from '../../lib/utils'

const AUTO_DISMISS_MS = 3000
const MAX_TOASTS = 5

const TYPE_CLASSES: Record<string, string> = {
  success: 'bg-[#1a3d1a] border-[#22c55e] text-[#22c55e]',
  error: 'bg-[#331212] border-[#ef4444] text-[#ef4444]',
}

function ToastBridge({ children }: { children: ReactNode }) {
  const { add } = BaseToast.useToastManager()

  const value: ToastContextValue = useMemo(
    () => ({
      success: (message: string) => {
        add({ type: 'success', description: message, timeout: AUTO_DISMISS_MS })
      },
      error: (message: string) => {
        add({ type: 'error', description: message, timeout: AUTO_DISMISS_MS })
      },
    }),
    [add]
  )

  useEffect(() => {
    setToastHandler(value)
    return () => setToastHandler(null)
  }, [value])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

function ToastList() {
  const { toasts } = BaseToast.useToastManager()

  return (
    <>
      {toasts.map(toast => {
        const typeClass = TYPE_CLASSES[toast.type ?? 'error'] ?? TYPE_CLASSES.error
        return (
          <BaseToast.Root
            key={toast.id}
            toast={toast}
            className={cn(
              'flex items-start gap-3 border rounded-md px-4 py-3 min-w-[260px] max-w-[360px] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] transition-all duration-150 data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1 data-[ending-style]:opacity-0',
              typeClass
            )}
          >
            <BaseToast.Content className="flex-1 min-w-0 flex items-start gap-3">
              <BaseToast.Description className="text-sm leading-snug flex-1" />
              <BaseToast.Close
                aria-label="Dismiss notification"
                className="leading-none opacity-70 hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </BaseToast.Close>
            </BaseToast.Content>
          </BaseToast.Root>
        )
      })}
    </>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <BaseToast.Provider timeout={AUTO_DISMISS_MS} limit={MAX_TOASTS}>
      <ToastBridge>{children}</ToastBridge>
      <BaseToast.Portal>
        <BaseToast.Viewport className="fixed z-toast flex flex-col gap-2 inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-auto sm:top-4 sm:right-4">
          <ToastList />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  )
}
