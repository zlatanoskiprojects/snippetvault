import { useMemo, useState } from 'react'
import { Code2, LayoutGrid, Lock, Plus, Search, Star } from 'lucide-react'
import { SNIPPETS, TAGS, type DemoSnippet } from './demoData'

type Filter = 'all' | 'favourites' | 'private'

interface MiniSidebarProps {
  filter: Filter
  onFilterChange: (f: Filter) => void
  activeTag: string | null
  onTagToggle: (tag: string) => void
}

function navItemClass(active: boolean) {
  return active
    ? 'flex items-center gap-1.5 bg-[#6366f1] rounded px-1.5 py-0.5 w-full text-left'
    : 'flex items-center gap-1.5 px-1.5 py-0.5 w-full text-left hover:bg-white/5 transition-colors duration-150 rounded'
}

function MiniSidebar({ filter, onFilterChange, activeTag, onTagToggle }: MiniSidebarProps) {
  return (
    <div className="hidden sm:flex w-[172px] shrink-0 bg-[#161616] border-r border-[#2a2a2a] flex-col p-3 gap-2">
      <div className="flex items-center gap-1.5">
        <div className="bg-[#6366f1] rounded w-[26px] h-[26px] flex items-center justify-center shrink-0">
          <Code2 size={14} className="text-white" />
        </div>
        <span className="text-[10px] font-medium text-white">Snippet Vault</span>
      </div>

      <p className="text-[7px] font-medium text-[#595e69] mt-2 tracking-wider">LIBRARY</p>
      <div className="flex flex-col gap-0.5">
        <button type="button" className={navItemClass(filter === 'all')} onClick={() => onFilterChange('all')}>
          <LayoutGrid size={9} className={filter === 'all' ? 'text-white shrink-0' : 'text-[#9ba3af] shrink-0'} />
          <span className={`text-[9px] ${filter === 'all' ? 'text-white' : 'text-[#9ba3af]'}`}>All snippets</span>
        </button>
        <button type="button" className={navItemClass(filter === 'favourites')} onClick={() => onFilterChange('favourites')}>
          <Star size={9} className={filter === 'favourites' ? 'text-white shrink-0' : 'text-[#9ba3af] shrink-0'} />
          <span className={`text-[9px] ${filter === 'favourites' ? 'text-white' : 'text-[#9ba3af]'}`}>Favourites</span>
        </button>
        <button type="button" className={navItemClass(filter === 'private')} onClick={() => onFilterChange('private')}>
          <Lock size={9} className={filter === 'private' ? 'text-white shrink-0' : 'text-[#9ba3af] shrink-0'} />
          <span className={`text-[9px] ${filter === 'private' ? 'text-white' : 'text-[#9ba3af]'}`}>Private</span>
        </button>
      </div>

      <p className="text-[7px] font-medium text-[#595e69] mt-2 tracking-wider">TAGS</p>
      <div className="flex flex-col gap-0.5">
        {TAGS.map(tag => (
          <button
            key={tag.label}
            type="button"
            onClick={() => onTagToggle(tag.label)}
            className={`flex items-center gap-1.5 px-1.5 py-0.5 w-full text-left rounded transition-colors duration-150 ${
              activeTag === tag.label ? 'bg-white/10 ring-1 ring-[#6366f1]' : 'hover:bg-white/5'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tag.dotClass}`} />
            <span className="text-[9px] text-[#9ba3af]">{tag.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface MiniTopBarProps {
  title: string
  count: number
}

function MiniTopBar({ title, count }: MiniTopBarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a] shrink-0">
      <div>
        <p className="text-[12px] font-medium text-white leading-none">{title}</p>
        <p className="text-[8px] text-[#595e69] mt-0.5">{count} snippet{count === 1 ? '' : 's'}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] rounded text-[8px] px-2 h-[20px] flex items-center">
          Filter
        </div>
        <div className="bg-[#6366f1] text-white rounded text-[8px] px-2 h-[20px] flex items-center gap-1">
          <Plus size={9} /> New snippet
        </div>
      </div>
    </div>
  )
}

interface MiniSnippetRowProps {
  snippet: DemoSnippet
  expanded: boolean
  onToggle: () => void
}

function MiniSnippetRow({ snippet, expanded, onToggle }: MiniSnippetRowProps) {
  return (
    <div className="border-b border-[#2a2a2a]">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-left cursor-pointer transition-colors duration-150 ${
          expanded ? 'bg-[#1f1f1f]' : 'bg-[#1a1a1a] hover:bg-[#1f1f1f]'
        }`}
      >
        <div className="min-w-0 mr-3">
          <p className="text-[10px] font-medium text-white truncate">{snippet.title}</p>
          <p className="text-[8px] text-[#595e69] mt-0.5 truncate">{snippet.description}</p>
        </div>
        <div className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium ${snippet.badgeClass}`}>
          <span className={`w-1 h-1 rounded-full shrink-0 ${snippet.dotClass}`} />
          {snippet.lang}
        </div>
      </button>
      {expanded && (
        <pre className="bg-[#0f0f0f] text-[#9ba3af] text-[8px] leading-[1.5] font-mono px-3 py-2 overflow-x-auto whitespace-pre">
          {snippet.code}
        </pre>
      )}
    </div>
  )
}

export default function LandingAppPreview() {
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
    <section className="flex justify-center px-6 pb-20 mt-4">
      <div className="w-full max-w-[1048px] mx-auto">
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden shadow-2xl">
          <div className="flex h-[360px] overflow-hidden">
            <MiniSidebar
              filter={filter}
              onFilterChange={handleFilterChange}
              activeTag={activeTag}
              onTagToggle={handleTagToggle}
            />

            <div className="flex-1 flex flex-col min-w-0">
              <MiniTopBar title={filterLabel} count={visibleSnippets.length} />

              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#2a2a2a] shrink-0">
                <div className="flex-1 min-w-0 flex items-center gap-1 bg-[#222] rounded px-2 py-1">
                  <Search size={9} className="text-[#595e69] shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search snippets..."
                    className="bg-transparent text-[9px] text-white placeholder:text-[#595e69] outline-none w-full min-w-0"
                  />
                </div>
                <div className="flex sm:hidden items-center gap-1 overflow-x-auto">
                  {TAGS.map(tag => (
                    <button
                      key={tag.label}
                      type="button"
                      onClick={() => handleTagToggle(tag.label)}
                      className={`flex items-center gap-1 px-1.5 py-1 rounded text-[8px] shrink-0 transition-colors duration-150 ${
                        activeTag === tag.label ? 'bg-white/10 ring-1 ring-[#6366f1] text-white' : 'bg-[#222] text-[#9ba3af]'
                      }`}
                    >
                      <span className={`w-1 h-1 rounded-full shrink-0 ${tag.dotClass}`} />
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {visibleSnippets.length === 0 ? (
                  <p className="text-[9px] text-[#595e69] text-center py-6">No snippets</p>
                ) : (
                  visibleSnippets.map(s => (
                    <MiniSnippetRow
                      key={s.id}
                      snippet={s}
                      expanded={expandedId === s.id}
                      onToggle={() => setExpandedId(current => (current === s.id ? null : s.id))}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-16 bg-gradient-to-b from-[#0f0f0f]/0 to-[#0f0f0f] -mt-1 pointer-events-none" />
      </div>
    </section>
  )
}
