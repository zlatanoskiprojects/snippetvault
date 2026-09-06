import { Code2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const linkClass = 'text-sm text-secondary transition-colors duration-150 hover:text-primary focus-visible:outline-none focus-visible:text-primary'

export default function LandingFooter() {
  return (
    <footer className="border-t border-border-default bg-sidebar px-6 py-12 sm:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-5 md:gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent">
              <Code2 size={16} className="text-on-accent" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-primary">Snippet Vault</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
            Save code. Understand it. Reuse it faster.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-3">
          <nav aria-label="Product links">
            <h2 className="text-sm font-medium text-primary">Product</h2>
            <ul className="mt-4 space-y-3">
              <li><Link to="/login" className={linkClass}>Cloud</Link></li>
              <li><Link to="/docs/quick-start" className={linkClass}>Getting started</Link></li>
              <li><Link to="/docs/snippets" className={linkClass}>Snippets</Link></li>
              <li><Link to="/docs/api-reference" className={linkClass}>API reference</Link></li>
            </ul>
          </nav>

          <nav aria-label="Resource links">
            <h2 className="text-sm font-medium text-primary">Resources</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <a href="https://github.com/Zlatanoski/snippetvault" target="_blank" rel="noopener noreferrer" className={linkClass}>GitHub</a>
              </li>
              <li><Link to="/docs" className={linkClass}>Documentation</Link></li>
              <li>
                <a href="https://github.com/Zlatanoski/snippetvault/blob/stable/LICENSE" target="_blank" rel="noopener noreferrer" className={linkClass}>MIT License</a>
              </li>
            </ul>
          </nav>

          <nav aria-label="Community links">
            <h2 className="text-sm font-medium text-primary">Community</h2>
            <ul className="mt-4 space-y-3">
              <li>
                <a href="https://github.com/Zlatanoski/snippetvault/issues" target="_blank" rel="noopener noreferrer" className={linkClass}>Issues</a>
              </li>
              <li>
                <a href="https://github.com/sponsors/Zlatanoski" target="_blank" rel="noopener noreferrer" className={linkClass}>Sponsor</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
