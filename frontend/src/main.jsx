import './wdyr.js'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from './components/Toast.jsx'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <ToastProvider>
            <StrictMode>
                <App />
            </StrictMode>
        </ToastProvider>
    </BrowserRouter>
)
