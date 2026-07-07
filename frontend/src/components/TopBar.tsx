import Button from './ui/Button'

interface TopBarProps {
  snippetCount: number
  onMenuClick?: () => void
  onNewSnippet?: () => void
  onSearch?: () => void
  title?: string
  onBack?: () => void
}

export default function TopBar({ snippetCount, onMenuClick, onNewSnippet, onSearch, title = 'All snippets', onBack }: TopBarProps) {
  return (
    <header className="flex items-end justify-between px-6 py-3 border-b border-[#2a2a2a]">
      <div className="flex items-center gap-2 min-w-0">
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="h-auto p-0 shrink-0 leading-none"
          >
            ←
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-white leading-tight truncate">{title}</h1>
          <p className="text-xs text-[#595e69] mt-0.5">{snippetCount} snippets</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="lg:hidden w-[30px] h-[30px] p-0"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect y="2" width="14" height="1.5" rx="0.75" fill="currentColor" />
            <rect y="6.25" width="14" height="1.5" rx="0.75" fill="currentColor" />
            <rect y="10.5" width="14" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
        </Button>

        <Button
          variant="secondary"
          onClick={onSearch}
          aria-label="Search"
          className="lg:hidden w-[30px] h-[30px] p-0"
        >
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7.5 7.5L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </Button>

        <Button variant="secondary" size="sm" className="text-xs">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 3h10M3 6h6M5 9h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">Filter</span>
        </Button>

        <Button variant="primary" size="sm" onClick={onNewSnippet} className="text-xs">
          <span className="hidden sm:inline">+ New snippet</span>
          <span className="sm:hidden">+</span>
        </Button>
      </div>
    </header>
  )
}