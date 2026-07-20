import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void; theme?: string },
      ) => string
      remove: (id: string) => void
    }
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
  if (existing) {
    return new Promise(resolve => existing.addEventListener('load', () => resolve(), { once: true }))
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Turnstile'))
    document.head.appendChild(script)
  })
}

interface TurnstileProps {
  onVerify: (token: string) => void
}

function Turnstile({ onVerify }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!SITE_KEY) return
    let widgetId: string | undefined
    let cancelled = false

    loadScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: onVerify,
        'expired-callback': () => onVerify(''),
        theme: 'dark',
      })
    })

    return () => {
      cancelled = true
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [onVerify])

  if (!SITE_KEY) return null
  return <div ref={containerRef} />
}

export default Turnstile
