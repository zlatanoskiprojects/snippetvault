import { createContext } from 'react'

export interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

let handler: ToastContextValue | null = null

export function setToastHandler(value: ToastContextValue | null) {
  handler = value
}

export function notifyError(message: string) {
  if (handler) handler.error(message)
}
