import { useState, useRef, useEffect } from 'react'
import { ToastContext } from '../contexts/ToastContext'

const MAX_TOASTS = 5

const STYLES = {
  success: {
    bg: '#1a3d1a',
    border: '#22c55e',
    text: '#22c55e',
  },
  error: {
    bg: '#331212',
    border: '#ef4444',
    text: '#ef4444',
  },
}

function ToastItem({ toast, onDismiss }) {
  const s = STYLES[toast.type] || STYLES.error
  return (
    <div
      style={{ backgroundColor: s.bg, borderColor: s.border }}
      className="flex items-start gap-3 border rounded-md px-4 py-3 min-w-[260px] max-w-[360px] shadow-lg"
    >
      <span style={{ color: s.text }} className="text-sm flex-1 leading-snug">
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{ color: s.text }}
        className="text-lg leading-none opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout)
    }
  }, [])

  function removeToast(id) {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  function addToast(type, message) {
    if (toasts.length >= MAX_TOASTS) return
    const id = Date.now()
    timers.current[id] = setTimeout(() => removeToast(id), 3000)
    setToasts(prev => [...prev, { id, type, message }])
  }

  const value = {
    success: (message) => addToast('success', message),
    error: (message) => addToast('error', message),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}