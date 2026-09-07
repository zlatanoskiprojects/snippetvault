import Button from './ui/Button'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ui] render error', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-app flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-primary text-lg font-semibold">Something went wrong</h1>
          <p className="text-secondary text-sm mt-2">
            An unexpected error occurred while rendering this page.
          </p>
          <Button variant="unstyled" size="unstyled"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-md bg-accent hover:bg-accent-hover transition-colors duration-150 text-on-accent text-sm px-4 py-2"
          >
            Reload page
          </Button>
        </div>
      </div>
    )
  }
}
