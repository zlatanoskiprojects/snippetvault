export default function TopBar({ snippetCount, onMenuClick, onNewSnippet, title = 'All snippets', onBack }) {
  return (
    <header className="flex items-end justify-between px-6 py-3 border-b border-[#2a2a2a]">
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-[#9ba3af] hover:text-white transition-colors duration-150 shrink-0 leading-none"
          >
            ←
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-white leading-tight truncate">{title}</h1>
          <p className="text-xs text-[#595e69] mt-0.5">{snippetCount} snippets</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="lg:hidden flex items-center justify-center w-[30px] h-[30px] bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] rounded-md hover:bg-[#222] transition-colors duration-150"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect y="2" width="14" height="1.5" rx="0.75" fill="currentColor" />
            <rect y="6.25" width="14" height="1.5" rx="0.75" fill="currentColor" />
            <rect y="10.5" width="14" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
        </button>

        <button
          type="button"
          className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] rounded-md text-xs px-3 h-[30px] flex items-center gap-1.5 hover:bg-[#222] transition-colors duration-150"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 3h10M3 6h6M5 9h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">Filter</span>
        </button>

        <button
          type="button"
          onClick={onNewSnippet}
          className="bg-[#6366f1] hover:bg-indigo-500 text-white rounded-md text-xs font-medium px-3 h-[30px] flex items-center transition-colors duration-150"
        >
          <span className="hidden sm:inline">+ New snippet</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>
    </header>
  )
}