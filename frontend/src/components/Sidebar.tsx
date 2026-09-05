import { useNavigate } from 'react-router-dom'
import { ChevronDown, Search, Sun } from 'lucide-react'
import { logout } from '../api/auth'
import { useUser } from '../hooks/useUser'
import Input from './ui/Input'
import Button from './ui/Button'
import type { Snippet } from '../api/types'

const TAG_DOT_COLORS = [
  'var(--color-category-blue)',
  'var(--color-category-green)',
  'var(--color-category-purple)',
  'var(--color-category-orange)',
  'var(--color-category-red)',
  'var(--color-category-indigo)',
]

const libraryItems = [
  { label: 'All Snippets', view: 'list'        },
  { label: 'Collections',  view: 'collections' },
]

interface SidebarProps {
  snippets?: Snippet[]
  searchQuery?: string
  onSearchChange?: (value: string) => void
  onSearchFocus?: () => void
  onSearchBlur?: () => void
  isSearchActive?: boolean
  activeView?: string
  onViewChange?: (view: string) => void
  activeTag?: string | null
  onTagChange?: (tag: string) => void
}

export default function Sidebar({ snippets = [], searchQuery = '', onSearchChange, onSearchFocus, onSearchBlur, isSearchActive = false, activeView = 'list', onViewChange, activeTag = null, onTagChange }: SidebarProps) {
  const navigate = useNavigate()
  const { user } = useUser()

  const avatarLetter = user ? (user.display_name || user.username || '?')[0].toUpperCase() : '?'
  const displayName = user?.display_name || user?.username || '…'

  async function handleLogout() {
    try {
      await logout()
    } catch {
    } finally {
      navigate('/login')
    }
  }
  const tagItems = snippets
    .flatMap(s => s.tags || [])
    .reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {})
  const tagList = Object.entries(tagItems).map(([label, count]) => ({ label, count }))
  return (
    <aside className="w-72 lg:w-48 bg-sidebar border-r border-border-default flex flex-col h-full shrink-0">
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="rounded-lg bg-accent w-7 h-7 flex items-center justify-center shrink-0">
          <span className="text-on-accent font-bold font-mono text-[11px]">&lt;/&gt;</span>
        </div>
        <span className="text-sm font-medium text-primary flex-1 min-w-0 truncate">Snippet Vault</span>
        <ChevronDown size={10} className="text-secondary shrink-0" />
      </div>

      <div className="mx-3 mt-2">
        <div className="bg-control border border-border-default rounded-md h-[30px] flex items-center gap-2 px-2">
          <Search size={12} className="shrink-0 text-muted" />
          <Input
            type="search"
            value={searchQuery}
            onChange={e => onSearchChange?.(e.target.value)}
            onFocus={() => onSearchFocus?.()}
            onBlur={() => { if (!searchQuery && !isSearchActive) onSearchBlur?.() }}
            placeholder="Search snippets…"
            className="bg-transparent border-0 h-auto p-0 text-[11px] text-secondary placeholder-muted focus:border-transparent"
          />
        </div>
      </div>

      <div className="mt-5 px-3">
        <p className="text-xs lg:text-[9px] font-medium text-muted uppercase tracking-wider mb-1">Library</p>
        {libraryItems.map((item) => {
          const isActive = activeView === item.view
          return (
            <div
              key={item.label}
              onClick={() => onViewChange?.(item.view)}
              className={`flex items-center justify-between px-2 py-2.5 lg:py-1.5 min-h-10 lg:min-h-0 rounded-md cursor-pointer transition-colors duration-150 ${
                isActive ? 'bg-accent' : 'hover:bg-interactive-overlay/5'
              }`}
            >
              <span className={`text-[13px] ${isActive ? 'text-on-accent' : 'text-secondary'}`}>
                {item.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-5 px-3">
        <p className="text-xs lg:text-[9px] font-medium text-muted uppercase tracking-wider mb-1">Tags</p>
        {tagList.map((tag, i) => {
          const isActive = activeTag === tag.label
          return (
            <div
              key={tag.label}
              onClick={() => onTagChange?.(tag.label)}
              className={`flex items-center justify-between px-2 py-2.5 lg:py-1.5 min-h-10 lg:min-h-0 rounded-md cursor-pointer transition-colors duration-150 ${
                isActive ? 'bg-accent' : 'hover:bg-interactive-overlay/5'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-sm inline-block shrink-0"
                  style={{ backgroundColor: TAG_DOT_COLORS[i % TAG_DOT_COLORS.length] }}
                />
                <span className={`text-[13px] truncate ${isActive ? 'text-on-accent' : 'text-secondary'}`}>{tag.label}</span>
              </div>
              <span className={`text-[11px] font-medium ml-2 shrink-0 ${isActive ? 'text-on-accent/70' : 'text-muted'}`}>{tag.count}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-auto">
        <div
          onClick={() => onViewChange?.('profile')}
          className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors duration-150 border-t border-border-default ${
            activeView === 'profile' ? 'bg-interactive-overlay/5' : 'hover:bg-interactive-overlay/5'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-avatar flex items-center justify-center shrink-0">
            <span className="text-accent text-[10px] font-bold">{avatarLetter}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`text-[12px] font-medium truncate ${activeView === 'profile' ? 'text-primary' : 'text-secondary'}`}>
              {displayName}
            </span>
            <span className="text-xs lg:text-[10px] text-muted truncate">Profile &amp; Settings</span>
          </div>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            className="h-10 lg:h-auto text-xs text-muted hover:text-primary flex items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0 transition-colors duration-150 focus:outline-none"
          >
            <Sun size={14} /> Light mode
          </button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="h-10 sm:h-10 lg:h-auto px-0 text-xs text-muted hover:text-danger hover:bg-transparent"
          >
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  )
}
