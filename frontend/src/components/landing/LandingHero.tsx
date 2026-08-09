import { Cloud } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LandingHero() {
  return (
    <section className="flex flex-col items-center text-center px-6 pt-20 pb-16">
      <h1 className="text-5xl md:text-6xl lg:text-[72px] font-bold leading-tight max-w-4xl mx-auto">
        <span className="text-white">Save code. Understand it. </span>
        <span className="text-[#6366f1]">Reuse it faster.</span>
      </h1>

      <p className="text-[#9ba3af] text-base md:text-lg leading-relaxed max-w-xl mx-auto mt-6">
        SnippetVault gives developers a smarter snippet workspace with local hosting, SaaS availability, and AI-powered code explanation.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 w-full sm:w-auto">
        <Link
          to="/login"
          aria-label="Open SnippetVault Cloud sign-in"
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] text-sm font-medium px-6 h-[44px] rounded-lg hover:bg-[#222] hover:text-white transition-colors duration-150"
        >
          <Cloud size={16} /> Cloud
        </Link>
        <Link
          to="/docs/quick-start"
          aria-label="Read the SnippetVault Quick Start guide"
          className="w-full sm:w-auto bg-[#6366f1] hover:bg-indigo-500 text-white text-sm font-medium px-8 h-[44px] rounded-lg transition-colors duration-150 flex items-center justify-center"
        >
          Get Started
        </Link>
        <a
          href="https://github.com/Zlatanoski/snippetvault"
          aria-label="View SnippetVault on GitHub"
          className="w-full sm:w-auto bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] text-sm font-medium px-6 h-[44px] rounded-lg hover:bg-[#222] hover:text-white transition-colors duration-150 flex items-center justify-center gap-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className="shrink-0"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          GitHub
        </a>
      </div>
    </section>
  )
}
