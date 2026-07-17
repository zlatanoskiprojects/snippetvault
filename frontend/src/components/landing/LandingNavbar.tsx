import { Link } from 'react-router-dom'
import { ChevronDown, Code2 } from 'lucide-react'

interface LandingNavbarProps {
  onGetStarted?: () => void
  showNavLinks?: boolean
}

export default function LandingNavbar({ onGetStarted, showNavLinks = true }: LandingNavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full flex items-center justify-between px-6 h-[56px] border-b border-[#2a2a2a] bg-[#0f0f0f]">
      <div className="flex items-center gap-2.5">
        <div className="rounded-lg bg-[#6366f1] w-7 h-7 flex items-center justify-center shrink-0">
          <Code2 size={16} className="text-white" />
        </div>
        <span className="text-sm font-medium text-white">Snippet Vault</span>
      </div>

      {showNavLinks && (
        <nav className="hidden md:flex items-center gap-8">
          <span className="flex items-center gap-1 text-[13px] text-[#9ba3af] hover:text-white transition-colors duration-150 cursor-pointer">
            Product <ChevronDown size={14} />
          </span>
          <Link
            to="/docs"
            className="text-[13px] text-[#9ba3af] hover:text-white transition-colors duration-150 cursor-pointer"
          >
            Docs
          </Link>
          <span className="flex items-center gap-1 text-[13px] text-[#9ba3af] hover:text-white transition-colors duration-150 cursor-pointer">
            About <ChevronDown size={14} />
          </span>
        </nav>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="hidden sm:flex bg-[#262147] text-[#6366f1] text-[12px] font-medium px-4 h-[28px] rounded-md hover:bg-[#2e2660] transition-colors duration-150 items-center"
        >
          Sponsor
        </button>
        <button
          type="button"
          onClick={onGetStarted}
          className="hidden sm:block text-[#9ba3af] text-[13px] font-medium hover:text-white transition-colors duration-150 cursor-pointer"
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={onGetStarted}
          className="bg-[#6366f1] hover:bg-indigo-500 text-white text-[12px] font-medium px-4 h-[28px] rounded-md transition-colors duration-150"
        >
          Get Started
        </button>
      </div>
    </header>
  )
}