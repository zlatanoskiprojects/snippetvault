import { useNavigate } from 'react-router-dom'
import { ChevronDown, Moon, Search, Sun } from 'lucide-react'
import { logout } from '../api/auth'
import { useUser } from '../hooks/useUser'
import { useThemeStore } from '../store/theme'
import Input from './ui/Input'
import Button from './ui/Button'
import type { Snippet } from '../api/types'

const TAG_DOT_COLORS = [
  'bg-category-blue',
  'bg-category-green',
  'bg-category-purple',
  'bg-category-orange',
  'bg-category-red',
  'bg-category-indigo',
]

const libraryItems = [
  { label: 'All Snippets', view: 'list'        },
  { label: 'Projects',  view: 'projects' },
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
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

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

  function handleThemeToggle() {
    if ('startViewTransition' in document) {
      document.startViewTransition(() => {
        toggleTheme()
      })
    } else {
      toggleTheme()
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
        <div className="flex h-10 items-center gap-2 rounded-lg border border-border-default bg-control px-2 transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-1 focus-within:ring-offset-sidebar lg:h-8">
          <Search size={14} className="shrink-0 text-muted" />
          <Input
            variant="unstyled"
            type="search"
            value={searchQuery}
            onChange={e => onSearchChange?.(e.target.value)}
            onFocus={() => onSearchFocus?.()}
            onBlur={() => { if (!searchQuery && !isSearchActive) onSearchBlur?.() }}
            placeholder="Search snippets…"
            className="h-full min-w-0 flex-1 bg-transparent p-0 text-xs leading-none text-secondary placeholder-muted outline-none lg:text-[11px]"
          />
        </div>
      </div>

      <div className="mt-5 px-3">
        <p className="text-xs lg:text-[9px] font-medium text-muted uppercase tracking-wider mb-1">Library</p>
        {libraryItems.map((item) => {
          const isActive = activeView === item.view
          return (
            <Button variant="unstyled" size="unstyled"
              key={item.label}
              onClick={() => onViewChange?.(item.view)}
              aria-pressed={isActive}
              className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-lg px-2 text-left text-sm leading-none transition-colors duration-150 lg:h-8 ${
                isActive ? 'bg-accent' : 'hover:bg-interactive-overlay/5'
              }`}
            >
              <span className={`truncate ${isActive ? 'text-on-accent' : 'text-secondary'}`}>
                {item.label}
              </span>
            </Button>
          )
        })}
      </div>

      <div className="mt-5 px-3">
        <p className="text-xs lg:text-[9px] font-medium text-muted uppercase tracking-wider mb-1">Tags</p>
        {tagList.map((tag, i) => {
          const isActive = activeTag === tag.label
          return (
            <Button variant="unstyled" size="unstyled"
              key={tag.label}
              onClick={() => onTagChange?.(tag.label)}
              aria-pressed={isActive}
              className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-lg px-2 text-left text-sm leading-none transition-colors duration-150 lg:h-8 ${
                isActive ? 'bg-accent' : 'hover:bg-interactive-overlay/5'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2 h-2 rounded-sm inline-block shrink-0 ${TAG_DOT_COLORS[i % TAG_DOT_COLORS.length]}`}
                />
                <span className={`truncate ${isActive ? 'text-on-accent' : 'text-secondary'}`}>{tag.label}</span>
              </div>
              <span className={`text-[11px] font-medium ml-2 shrink-0 ${isActive ? 'text-on-accent/70' : 'text-muted'}`}>{tag.count}</span>
            </Button>
          )
        })}
      </div>

      <div className="mt-auto">
        <Button variant="unstyled" size="unstyled"
          onClick={() => onViewChange?.('profile')}
          aria-pressed={activeView === 'profile'}
          className={`flex h-14 w-full cursor-pointer items-center gap-2 border-t border-border-default px-3 text-left transition-colors duration-150 lg:h-12 ${
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
        </Button>
        <div className="flex items-center justify-between px-3 py-2">
          <Button variant="unstyled" size="unstyled"
            type="button"
            onClick={handleThemeToggle}
            className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs text-muted transition-colors duration-150 hover:bg-interactive-overlay/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:h-8"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
          <Button
            variant="ghost"
            size="unstyled"
            onClick={handleLogout}
            className="h-10 rounded-lg px-2 text-xs text-muted hover:text-danger lg:h-8"
          >
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  )
}
