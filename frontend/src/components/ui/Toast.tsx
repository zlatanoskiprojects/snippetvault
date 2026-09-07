import { Toast as BaseToast } from '@base-ui/react/toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { useEffect, useMemo, type ComponentProps, type ReactNode } from 'react'
import { ToastContext, setToastHandler } from '../../contexts/ToastContext'
import type { ToastContextValue } from '../../contexts/ToastContext'
import { cn } from '../../lib/utils'

const AUTO_DISMISS_MS = 3000
const MAX_TOASTS = 5

export const ToastRootProvider = BaseToast.Provider
export function ToastPortal(props: ComponentProps<typeof BaseToast.Portal>) {
  return <BaseToast.Portal data-slot="toast-portal" {...props} />
}

const toastVariants = cva('flex items-start gap-3 border rounded-md px-4 py-3 min-w-0 w-full sm:min-w-65 sm:max-w-90 shadow-[0_10px_15px_-3px_var(--theme-shadow-subtle),0_4px_6px_-4px_var(--theme-shadow-subtle)] transition-all duration-150 data-[starting-style]:opacity-0 data-[starting-style]:translate-y-1 data-[ending-style]:opacity-0', {
  variants: {
    variant: {
      success: 'bg-success-surface border-success text-success',
      error: 'bg-danger-surface border-danger text-danger',
    },
  },
  defaultVariants: { variant: 'error' },
})

export function Toast({ className, variant, ...props }: ComponentProps<typeof BaseToast.Root> & VariantProps<typeof toastVariants>) {
  return <BaseToast.Root data-slot="toast" data-variant={variant ?? 'error'} className={state => cn(toastVariants({ variant }), typeof className === 'function' ? className(state) : className)} {...props} />
}

export function ToastViewport({ className, ...props }: ComponentProps<typeof BaseToast.Viewport>) {
  return <BaseToast.Viewport data-slot="toast-viewport" className={state => cn('fixed z-toast flex flex-col gap-2 inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-auto sm:top-4 sm:right-4', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function ToastContent({ className, ...props }: ComponentProps<typeof BaseToast.Content>) {
  return <BaseToast.Content data-slot="toast-content" className={state => cn('flex-1 min-w-0 flex items-start gap-3', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function ToastTitle({ className, ...props }: ComponentProps<typeof BaseToast.Title>) {
  return <BaseToast.Title data-slot="toast-title" className={state => cn('text-sm font-medium', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function ToastDescription({ className, ...props }: ComponentProps<typeof BaseToast.Description>) {
  return <BaseToast.Description data-slot="toast-description" className={state => cn('text-sm leading-snug flex-1', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function ToastClose({ className, ...props }: ComponentProps<typeof BaseToast.Close>) {
  return <BaseToast.Close data-slot="toast-close" className={state => cn('leading-none opacity-70 hover:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-accent', typeof className === 'function' ? className(state) : className)} {...props} />
}

export function ToastAction({ className, ...props }: ComponentProps<typeof BaseToast.Action>) {
  return <BaseToast.Action data-slot="toast-action" className={state => cn('text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent', typeof className === 'function' ? className(state) : className)} {...props} />
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
  return toasts.map(toast => (
    <Toast key={toast.id} toast={toast} variant={toast.type === 'success' ? 'success' : 'error'}>
      <ToastContent>
        <ToastDescription />
        <ToastClose aria-label="Dismiss notification"><X size={16} /></ToastClose>
      </ToastContent>
    </Toast>
  ))
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <ToastRootProvider timeout={AUTO_DISMISS_MS} limit={MAX_TOASTS}>
      <ToastBridge>{children}</ToastBridge>
      <ToastPortal>
        <ToastViewport><ToastList /></ToastViewport>
      </ToastPortal>
    </ToastRootProvider>
  )
}
