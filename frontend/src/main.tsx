import './wdyr'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import Root from './Root'

const container = document.getElementById('root') as HTMLElement
const app = <Root router={children => <BrowserRouter>{children}</BrowserRouter>} />

if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
