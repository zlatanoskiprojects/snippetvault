interface LandingHeroProps {
  onGetStarted?: () => void
}

export default function LandingHero({ onGetStarted }: LandingHeroProps) {
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
        <button
          type="button"
          className="w-full sm:w-auto bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] text-sm font-medium px-6 h-[44px] rounded-lg hover:bg-[#222] hover:text-white transition-colors duration-150"
        >
          ☁ Cloud
        </button>
        <button
          type="button"
          onClick={onGetStarted}
          className="w-full sm:w-auto bg-[#6366f1] hover:bg-indigo-500 text-white text-sm font-medium px-8 h-[44px] rounded-lg transition-colors duration-150"
        >
          Get Started
        </button>
        <a
          href="https://github.com"
          className="w-full sm:w-auto bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] text-sm font-medium px-6 h-[44px] rounded-lg hover:bg-[#222] hover:text-white transition-colors duration-150 flex items-center justify-center"
        >
          ⎇ GitHub
        </a>
      </div>
    </section>
  )
}