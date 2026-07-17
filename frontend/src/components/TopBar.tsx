import { ArrowLeft, Menu, Plus, Search, SlidersHorizontal } from 'lucide-react'
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
            <ArrowLeft size={16} />
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
          <Menu size={14} />
        </Button>

        <Button
          variant="secondary"
          onClick={onSearch}
          aria-label="Search"
          className="lg:hidden w-[30px] h-[30px] p-0"
        >
          <Search size={13} />
        </Button>

        <Button variant="secondary" size="sm" className="text-xs">
          <SlidersHorizontal size={12} />
          <span className="hidden sm:inline">Filter</span>
        </Button>

        <Button variant="primary" size="sm" onClick={onNewSnippet} className="text-xs">
          <span className="hidden sm:inline-flex items-center gap-1"><Plus size={14} /> New snippet</span>
          <span className="sm:hidden flex items-center"><Plus size={14} /></span>
        </Button>
      </div>
    </header>
  )
}