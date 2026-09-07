import Input from '../ui/Input'
import Button from '../ui/Button'
import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Code2, LayoutGrid, Lock, Plus, Search, Star } from 'lucide-react'
import { SNIPPETS, TAGS, type DemoSnippet } from './demoData'

type Filter = 'all' | 'favourites' | 'private'

interface MiniSidebarProps {
  filter: Filter
  onFilterChange: (f: Filter) => void
  activeTag: string | null
  onTagToggle: (tag: string) => void
  revealDelay: number
  shouldReduceMotion: boolean | null
}

function revealProps(shouldReduceMotion: boolean | null, delay: number) {
  return shouldReduceMotion ? {} : {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.5, ease: 'easeOut' as const, delay },
  }
}

function navItemClass(active: boolean) {
  return active
    ? 'flex items-center gap-1.5 bg-accent rounded px-1.5 py-0.5 w-full text-left'
    : 'flex items-center gap-1.5 px-1.5 py-0.5 w-full text-left hover:bg-interactive-overlay/5 transition-colors duration-150 rounded'
}

function MiniSidebar({ filter, onFilterChange, activeTag, onTagToggle, revealDelay, shouldReduceMotion }: MiniSidebarProps) {
  return (
    <motion.aside
      {...revealProps(shouldReduceMotion, revealDelay)}
      aria-label="Snippet preview filters"
      className="hidden sm:flex w-[172px] shrink-0 bg-sidebar border-r border-border-default flex-col p-3 gap-2"
    >
      <div className="flex items-center gap-1.5">
        <div className="bg-accent rounded w-[26px] h-[26px] flex items-center justify-center shrink-0">
          <Code2 size={14} className="text-on-accent" />
        </div>
        <span className="text-[10px] font-medium text-primary">Snippet Vault</span>
      </div>

      <p className="text-[7px] font-medium text-muted mt-2 tracking-wider">LIBRARY</p>
      <div className="flex flex-col gap-0.5">
        <Button variant="unstyled" size="unstyled" type="button" aria-pressed={filter === 'all'} className={navItemClass(filter === 'all')} onClick={() => onFilterChange('all')}>
          <LayoutGrid size={9} className={filter === 'all' ? 'text-on-accent shrink-0' : 'text-secondary shrink-0'} />
          <span className={`text-[9px] ${filter === 'all' ? 'text-on-accent' : 'text-secondary'}`}>All snippets</span>
        </Button>
        <Button variant="unstyled" size="unstyled" type="button" aria-pressed={filter === 'favourites'} className={navItemClass(filter === 'favourites')} onClick={() => onFilterChange('favourites')}>
          <Star size={9} className={filter === 'favourites' ? 'text-on-accent shrink-0' : 'text-secondary shrink-0'} />
          <span className={`text-[9px] ${filter === 'favourites' ? 'text-on-accent' : 'text-secondary'}`}>Favourites</span>
        </Button>
        <Button variant="unstyled" size="unstyled" type="button" aria-pressed={filter === 'private'} className={navItemClass(filter === 'private')} onClick={() => onFilterChange('private')}>
          <Lock size={9} className={filter === 'private' ? 'text-on-accent shrink-0' : 'text-secondary shrink-0'} />
          <span className={`text-[9px] ${filter === 'private' ? 'text-on-accent' : 'text-secondary'}`}>Private</span>
        </Button>
      </div>

      <p className="text-[7px] font-medium text-muted mt-2 tracking-wider">TAGS</p>
      <div className="flex flex-col gap-0.5">
        {TAGS.map(tag => (
          <Button variant="unstyled" size="unstyled"
            key={tag.label}
            type="button"
            onClick={() => onTagToggle(tag.label)}
            aria-pressed={activeTag === tag.label}
            className={`flex items-center gap-1.5 px-1.5 py-0.5 w-full text-left rounded transition-colors duration-150 ${
              activeTag === tag.label ? 'bg-interactive-overlay/10 ring-1 ring-accent' : 'hover:bg-interactive-overlay/5'
            }`}
          >
            <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full shrink-0 ${tag.dotClass}`} />
            <span className="text-[9px] text-secondary">{tag.label}</span>
          </Button>
        ))}
      </div>
    </motion.aside>
  )
}

interface MiniTopBarProps {
  title: string
  count: number
  revealDelay: number
  shouldReduceMotion: boolean | null
}

function MiniTopBar({ title, count, revealDelay, shouldReduceMotion }: MiniTopBarProps) {
  return (
    <motion.header
      {...revealProps(shouldReduceMotion, revealDelay)}
      className="flex items-center justify-between px-3 py-2 border-b border-border-default shrink-0"
    >
      <div>
        <h2 id="snippet-preview-heading" className="text-[12px] font-medium text-primary leading-none">{title}</h2>
        <p className="text-[8px] text-muted mt-0.5">{count} snippet{count === 1 ? '' : 's'}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="bg-surface border border-border-default text-secondary rounded text-[8px] px-2 h-[20px] flex items-center">
          Filter
        </div>
        <div className="bg-accent text-on-accent rounded text-[8px] px-2 h-[20px] flex items-center gap-1">
          <Plus size={9} /> New snippet
        </div>
      </div>
    </motion.header>
  )
}

interface MiniSnippetRowProps {
  snippet: DemoSnippet
  expanded: boolean
  onToggle: () => void
  revealDelay: number
  shouldReduceMotion: boolean | null
}

function MiniSnippetRow({ snippet, expanded, onToggle, revealDelay, shouldReduceMotion }: MiniSnippetRowProps) {
  return (
    <motion.div
      {...revealProps(shouldReduceMotion, revealDelay)}
      className="border-b border-border-default"
    >
      <Button variant="unstyled" size="unstyled"
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-left cursor-pointer transition-colors duration-150 ${
          expanded ? 'bg-surface-hover' : 'bg-surface hover:bg-surface-hover'
        }`}
      >
        <div className="min-w-0 mr-3">
          <p className="text-[10px] font-medium text-primary truncate">{snippet.title}</p>
          <p className="text-[8px] text-muted mt-0.5 truncate">{snippet.description}</p>
        </div>
        <div className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium ${snippet.badgeClass}`}>
          <span aria-hidden="true" className={`w-1 h-1 rounded-full shrink-0 ${snippet.dotClass}`} />
          {snippet.lang}
        </div>
      </Button>
      {expanded && (
        <pre className="bg-app text-secondary text-[8px] leading-[1.5] font-mono px-3 py-2 overflow-x-auto whitespace-pre">
          {snippet.code}
        </pre>
      )}
    </motion.div>
  )
}

export default function LandingAppPreview() {
  const shouldReduceMotion = useReducedMotion()
  const [filter, setFilter] = useState<Filter>('all')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const visibleSnippets = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SNIPPETS.filter(s => {
      if (filter === 'favourites' && !s.favourite) return false
      if (filter === 'private' && s.visibility !== 'private') return false
      if (activeTag && !s.tags.includes(activeTag)) return false
      if (q && !s.title.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q) && !s.lang.toLowerCase().includes(q)) {
        return false
      }
      return true
    })
  }, [filter, activeTag, query])

  const filterLabel = filter === 'all' ? 'All snippets' : filter === 'favourites' ? 'Favourites' : 'Private'

  function handleFilterChange(f: Filter) {
    setFilter(f)
    setExpandedId(null)
  }

  function handleTagToggle(tag: string) {
    setActiveTag(current => (current === tag ? null : tag))
    setExpandedId(null)
  }

  return (
    <section aria-labelledby="snippet-preview-heading" className="flex justify-center px-6 pb-20 mt-4">
      <div className="w-full max-w-[1048px] mx-auto">
        <div className="rounded-xl border border-border-default bg-surface overflow-hidden shadow-2xl">
          <div className="flex h-[360px] overflow-hidden">
            <MiniSidebar
              filter={filter}
              onFilterChange={handleFilterChange}
              activeTag={activeTag}
              onTagToggle={handleTagToggle}
              revealDelay={0}
              shouldReduceMotion={shouldReduceMotion}
            />

            <div className="flex-1 flex flex-col min-w-0">
              <MiniTopBar
                title={filterLabel}
                count={visibleSnippets.length}
                revealDelay={0.08}
                shouldReduceMotion={shouldReduceMotion}
              />

              <motion.div
                {...revealProps(shouldReduceMotion, 0.16)}
                className="flex items-center gap-1.5 px-3 py-2 border-b border-border-default shrink-0"
              >
                <div className="flex-1 min-w-0 flex items-center gap-1 bg-control rounded px-2 py-1">
                  <Search size={9} className="text-muted shrink-0" />
                  <Input variant="unstyled"
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    aria-label="Search demo snippets"
                    placeholder="Search snippets..."
                    className="bg-transparent text-[9px] text-primary placeholder:text-muted outline-none w-full min-w-0"
                  />
                </div>
                <div className="flex sm:hidden items-center gap-1 overflow-x-auto">
                  {TAGS.map(tag => (
                    <Button variant="unstyled" size="unstyled"
                      key={tag.label}
                      type="button"
                      onClick={() => handleTagToggle(tag.label)}
                      aria-pressed={activeTag === tag.label}
                      className={`flex items-center gap-1 px-1.5 py-1 rounded text-[8px] shrink-0 transition-colors duration-150 ${
                        activeTag === tag.label ? 'bg-interactive-overlay/10 ring-1 ring-accent text-primary' : 'bg-control text-secondary'
                      }`}
                    >
                      <span aria-hidden="true" className={`w-1 h-1 rounded-full shrink-0 ${tag.dotClass}`} />
                      {tag.label}
                    </Button>
                  ))}
                </div>
              </motion.div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {visibleSnippets.length === 0 ? (
                  <motion.p
                    {...revealProps(shouldReduceMotion, 0.24)}
                    className="text-[9px] text-muted text-center py-6"
                  >
                    No snippets
                  </motion.p>
                ) : (
                  visibleSnippets.map((s, index) => (
                    <MiniSnippetRow
                      key={s.id}
                      snippet={s}
                      expanded={expandedId === s.id}
                      onToggle={() => setExpandedId(current => (current === s.id ? null : s.id))}
                      revealDelay={0.24 + index * 0.08}
                      shouldReduceMotion={shouldReduceMotion}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-16 bg-gradient-to-b from-app/0 to-app -mt-1 pointer-events-none" />
      </div>
    </section>
  )
}
