import './wdyr'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App'
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from './components/Toast'

createRoot(document.getElementById('root') as HTMLElement).render(
    <BrowserRouter>
        <ToastProvider>
            <StrictMode>
                <App />
            </StrictMode>
        </ToastProvider>
    </BrowserRouter>
)
