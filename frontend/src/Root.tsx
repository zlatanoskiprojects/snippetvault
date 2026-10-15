import { StrictMode, type ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import App from './App'
import { ToastProvider } from './components/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'
import ThemeProvider from './components/providers/ThemeProvider'

interface RootProps {
  router: (children: ReactNode) => ReactNode
}

export default function Root({ router }: RootProps) {
  return router(
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <ErrorBoundary>
          <StrictMode>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </StrictMode>
        </ErrorBoundary>
      </ToastProvider>
    </MotionConfig>
  )
}
