import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { useSnippets } from '../hooks/useSnippets'
import SnippetRow from '../components/SnippetRow'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import type { Snippet } from '../api/types'

const LANG_MAP: Record<string, string> = { ts: 'TypeScript', js: 'JavaScript', py: 'Python', rs: 'Rust', sql: 'SQL', sh: 'Shell', go: 'Go' }

const LANG_CHIPS = [
  { label: 'All',        value: 'all' },
  { label: 'JavaScript', value: 'js'  },
  { label: 'TypeScript', value: 'ts'  },
  { label: 'Python',     value: 'py'  },
  { label: 'Rust',       value: 'rs'  },
  { label: 'SQL',        value: 'sql' },
  { label: 'Shell',      value: 'sh'  },
  { label: 'Go',         value: 'go'  },
]


const SORT_CHIPS = [
  { label: 'Date modified', value: 'modified' },
  { label: 'Date created',  value: 'created'  },
  { label: 'Title A–Z',     value: 'alpha'    },
]

interface SearchViewProps {
  query: string
  onQueryChange: (query: string) => void
  onClose: () => void
  onSelectSnippet: (snippet: Snippet) => void
}

export default function SearchView({ query, onQueryChange, onClose, onSelectSnippet }: SearchViewProps) {
  const { snippets, loading, error } = useSnippets()
  const [activeLang, setActiveLang] = useState('all')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [activeSort, setActiveSort] = useState('modified')

  const tagChips = [...new Set(snippets.flatMap(s => s.tags || []))]
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      onQueryChange('')
      onClose()
    }
  }

  function toggleTag(tag: string) {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  function toggleLang(value: string) {
    setActiveLang(prev => (prev === value ? 'all' : value))
  }

  const filtered = snippets
    .filter(s => {
      const q = query.toLowerCase()
      const tags = s.tags || []
      const matchesQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.code || '').toLowerCase().includes(q) ||
        tags.some(t => t.toLowerCase().includes(q))

      const matchesLang =
        activeLang === 'all' || s.language === LANG_MAP[activeLang]

      const matchesTags =
        activeTags.length === 0 ||
        activeTags.every(t => tags.includes(t))

      return matchesQuery && matchesLang && matchesTags
    })
    .sort((a, b) => {
      if (activeSort === 'alpha') return a.title.localeCompare(b.title)
      if (activeSort === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      <div className="flex items-center justify-between px-6 py-3 border-b border-[#2a2a2a] shrink-0">
        <h1 className="text-lg font-semibold text-white">Search snippets</h1>
        <button
          onClick={() => { onQueryChange(''); onClose() }}
          aria-label="Close search"
          className="flex items-center justify-center w-[28px] h-[28px] rounded-md text-[#9ba3af] hover:text-white hover:bg-white/5 transition-colors duration-150"
        >
          <X size={14} />
        </button>
      </div>

      <div className="px-6 pt-4 pb-3 flex flex-col gap-3 shrink-0">

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by title, description, tags, or code..."
          className="w-full h-[48px] bg-[#222] border-2 border-[#6366f1] rounded-lg text-sm text-white px-4 outline-none placeholder-[#595e69]"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#595e69] shrink-0 w-[60px]">Language:</span>
          {LANG_CHIPS.map(chip => (
            <button
              key={chip.value}
              type="button"
              onClick={() => toggleLang(chip.value)}
              className={
                activeLang === chip.value
                  ? 'bg-[#6366f1] text-white text-xs px-3 h-[28px] rounded-md font-medium transition-colors duration-150'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] text-xs px-3 h-[28px] rounded-md hover:bg-[#222] hover:text-white transition-colors duration-150 cursor-pointer'
              }
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#595e69] shrink-0 w-[60px]">Tags:</span>
          {tagChips.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={
                activeTags.includes(tag)
                  ? 'bg-[#6366f1] text-white text-xs px-3 h-[28px] rounded-md transition-colors duration-150'
                  : 'bg-[#242424] text-[#9ba3af] text-xs px-3 h-[28px] rounded-md hover:bg-[#2a2a2a] hover:text-white transition-colors duration-150 cursor-pointer'
              }
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#595e69] shrink-0 w-[60px]">Sort by:</span>
          {SORT_CHIPS.map(chip => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setActiveSort(chip.value)}
              className={
                activeSort === chip.value
                  ? 'bg-[#2e295c] text-[#6366f1] text-xs px-3 h-[28px] rounded-md font-medium transition-colors duration-150'
                  : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] text-xs px-3 h-[28px] rounded-md hover:bg-[#222] transition-colors duration-150 cursor-pointer'
              }
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="border-t border-[#2a2a2a] mt-1" />
        <p className="text-xs text-[#595e69] -mt-1">{filtered.length} results</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="text-white" />
          </div>
        ) : error ? (
          <div className="px-6 py-4">
            <Alert>Failed to load snippets: {error}</Alert>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[#595e69] text-sm">No snippets match your search.</p>
            <p className="text-[#595e69] text-xs mt-1">Try different keywords or clear your filters.</p>
          </div>
        ) : (
          filtered.map(snippet => (
            <SnippetRow key={snippet.id} snippet={snippet} onSelect={onSelectSnippet} />
          ))
        )}
      </div>

    </div>
  )
}
