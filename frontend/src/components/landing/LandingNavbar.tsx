import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import { ChevronDown, Code2, Menu, X } from 'lucide-react'

interface LandingNavbarProps {
  onGetStarted?: () => void
  showNavLinks?: boolean
}

export default function LandingNavbar({ onGetStarted, showNavLinks = true }: LandingNavbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full flex items-center justify-between px-6 h-[56px] border-b border-border-default bg-app">
      <div className="flex items-center gap-2.5">
        <div className="rounded-lg bg-accent w-7 h-7 flex items-center justify-center shrink-0">
          <Code2 size={16} className="text-on-accent" />
        </div>
        <span className="text-sm font-medium text-primary">Snippet Vault</span>
      </div>

      {showNavLinks && (
        <nav aria-label="Primary" className="hidden md:flex items-center gap-8">
          <span className="flex items-center gap-1 text-[13px] text-secondary hover:text-primary transition-colors duration-150 cursor-pointer">
            Product <ChevronDown size={14} />
          </span>
          <Link
            to="/docs"
            className="text-[13px] text-secondary hover:text-primary transition-colors duration-150 cursor-pointer"
          >
            Docs
          </Link>
          <span className="flex items-center gap-1 text-[13px] text-secondary hover:text-primary transition-colors duration-150 cursor-pointer">
            About <ChevronDown size={14} />
          </span>
        </nav>
      )}

      <div className="flex items-center gap-3">
        <a
          href="https://github.com/sponsors/Zlatanoski"
          className="hidden sm:flex bg-accent-surface text-accent text-[12px] font-medium px-4 h-[40px] sm:h-[28px] rounded-md hover:bg-accent-surface-hover transition-colors duration-150 items-center"
        >
          Sponsor
        </a>
        <button
          type="button"
          onClick={onGetStarted}
          className="hidden sm:block text-secondary text-[13px] font-medium hover:text-primary transition-colors duration-150 cursor-pointer"
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={onGetStarted}
          className="bg-accent hover:bg-accent-hover text-on-accent text-[12px] font-medium px-4 h-[40px] sm:h-[28px] rounded-md transition-colors duration-150"
        >
          Get Started
        </button>

        {showNavLinks && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="md:hidden w-[40px] h-[40px] flex items-center justify-center rounded-md border border-border-default text-secondary hover:text-primary hover:bg-interactive-overlay/5 transition-colors duration-150"
          >
            <Menu size={18} />
          </button>
        )}
      </div>

      {showNavLinks && (
        <BaseDialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <BaseDialog.Portal>
            <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-overlay/50 md:hidden transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
            <BaseDialog.Popup className="fixed right-0 top-0 z-40 h-dvh w-64 md:hidden outline-none transition-transform duration-150 data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full bg-sidebar border-l border-border-default flex flex-col px-4 py-4 gap-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-primary">Menu</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="w-[40px] h-[40px] flex items-center justify-center rounded-md text-secondary hover:text-primary hover:bg-interactive-overlay/5 transition-colors duration-150"
                >
                  <X size={18} />
                </button>
              </div>

              <span className="flex items-center gap-1 h-[44px] px-2 text-sm text-secondary hover:text-primary transition-colors duration-150 cursor-pointer">
                Product <ChevronDown size={14} />
              </span>
              <Link
                to="/docs"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center h-[44px] px-2 text-sm text-secondary hover:text-primary transition-colors duration-150 rounded-md hover:bg-interactive-overlay/5"
              >
                Docs
              </Link>
              <span className="flex items-center gap-1 h-[44px] px-2 text-sm text-secondary hover:text-primary transition-colors duration-150 cursor-pointer">
                About <ChevronDown size={14} />
              </span>

              <div className="h-px bg-divider my-2" />

              <a
                href="https://github.com/sponsors/Zlatanoski"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center h-[44px] px-2 rounded-md bg-accent-surface text-accent text-sm font-medium hover:bg-accent-surface-hover transition-colors duration-150"
              >
                Sponsor
              </a>
              <button
                type="button"
                onClick={() => { setDrawerOpen(false); onGetStarted?.() }}
                className="flex items-center h-[44px] px-2 rounded-md text-secondary text-sm font-medium hover:text-primary hover:bg-interactive-overlay/5 transition-colors duration-150"
              >
                Sign In
              </button>
            </BaseDialog.Popup>
          </BaseDialog.Portal>
        </BaseDialog.Root>
      )}
    </header>
  )
}
