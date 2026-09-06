import './wdyr'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from './components/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'
import ThemeProvider from './components/providers/ThemeProvider'

createRoot(document.getElementById('root') as HTMLElement).render(
    <BrowserRouter>
        <ToastProvider>
            <ErrorBoundary>
                <StrictMode>
                    <ThemeProvider>
                        <App />
                    </ThemeProvider>
                </StrictMode>
            </ErrorBoundary>
        </ToastProvider>
    </BrowserRouter>
)
