const TAG_COLORS = {
  react: '#3d77fc',
  utils: '#22c55e',
  auth:  '#8c5af3',
  db:    '#fba528',
}

const libraryItems = [
  { label: 'All Snippets', view: 'list',        count: 24 },
  { label: 'Favourites',   view: 'favourites',  count: 6  },
  { label: 'Private',      view: 'private',     count: 3  },
  { label: 'Collections',  view: 'collections', count: 6  },
]

const tagItems = [
  { label: 'react', count: 8 },
  { label: 'utils', count: 5 },
  { label: 'auth',  count: 4 },
  { label: 'db',    count: 7 },
]

export default function Sidebar({ searchQuery = '', onSearchChange, onSearchFocus, onSearchBlur, isSearchActive = false, activeView = 'list', onViewChange }) {
  return (
    <aside className="w-48 bg-[#161616] border-r border-[#2a2a2a] flex flex-col h-full shrink-0">
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="rounded-lg bg-[#6366f1] w-7 h-7 flex items-center justify-center shrink-0">
          <span className="text-white font-bold font-mono text-[11px]">&lt;/&gt;</span>
        </div>
        <span className="text-sm font-medium text-white flex-1 min-w-0 truncate">Snippet Vault</span>
        <span className="text-[#9ba3af] text-[10px] shrink-0">∨</span>
      </div>

      <div className="mx-3 mt-2">
        <div className="bg-[#222] border border-[#2a2a2a] rounded-md h-[30px] flex items-center gap-2 px-2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-[#595e69]">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7.5 7.5L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={e => onSearchChange?.(e.target.value)}
            onFocus={() => onSearchFocus?.()}
            onBlur={() => { if (!searchQuery && !isSearchActive) onSearchBlur?.() }}
            placeholder="Search snippets…"
            className="bg-transparent border-none outline-none text-[11px] text-[#9ba3af] placeholder:text-[#595e69] w-full"
          />
        </div>
      </div>

      <div className="mt-5 px-3">
        <p className="text-[9px] font-medium text-[#595e69] uppercase tracking-wider mb-1">Library</p>
        {libraryItems.map((item) => {
          const isActive = activeView === item.view
          return (
            <div
              key={item.label}
              onClick={() => onViewChange?.(item.view)}
              className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors duration-150 ${
                isActive ? 'bg-[#6366f1]' : 'hover:bg-white/5'
              }`}
            >
              <span className={`text-[13px] ${isActive ? 'text-white' : 'text-[#9ba3af]'}`}>
                {item.label}
              </span>
              <span className={`text-[11px] font-medium ${isActive ? 'text-white' : 'text-[#595e69]'}`}>
                {item.count}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-5 px-3">
        <p className="text-[9px] font-medium text-[#595e69] uppercase tracking-wider mb-1">Tags</p>
        {tagItems.map((tag) => (
          <div
            key={tag.label}
            className="flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors duration-150"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-sm inline-block shrink-0"
                style={{ backgroundColor: TAG_COLORS[tag.label] ?? '#9ba3af' }}
              />
              <span className="text-[13px] text-[#9ba3af] truncate">{tag.label}</span>
            </div>
            <span className="text-[11px] text-[#595e69] font-medium ml-2 shrink-0">{tag.count}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <div
          onClick={() => onViewChange?.('profile')}
          className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors duration-150 border-t border-[#2a2a2a] ${
            activeView === 'profile' ? 'bg-white/5' : 'hover:bg-white/5'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-[#2e2457] flex items-center justify-center shrink-0">
            <span className="text-[#6366f1] text-[10px] font-bold">D</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`text-[12px] font-medium truncate ${activeView === 'profile' ? 'text-white' : 'text-[#9ba3af]'}`}>
              Zlatanoski
            </span>
            <span className="text-[10px] text-[#595e69] truncate">Profile &amp; Settings</span>
          </div>
        </div>
        <div className="px-4 py-3">
          <span className="text-xs text-[#595e69]">☀ Light mode</span>
        </div>
      </div>
    </aside>
  )
}
