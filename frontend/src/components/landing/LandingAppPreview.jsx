const TAGS = [
  { label: 'react', dotClass: 'bg-[#3d77fc]' },
  { label: 'utils', dotClass: 'bg-[#22c55e]' },
  { label: 'auth', dotClass: 'bg-[#8c5af3]' },
  { label: 'db', dotClass: 'bg-[#fba528]' },
]

const SNIPPETS = [
  {
    title: 'useDebounce hook',
    description: 'Debounces a value by delay ms',
    lang: 'TS',
    dotClass: 'bg-[#3d77fc]',
    badgeClass: 'bg-[#0b152d] text-[#3d77fc]',
  },
  {
    title: 'Flatten nested dict',
    description: 'Recursively flattens nested dict',
    lang: 'PY',
    dotClass: 'bg-[#22c55e]',
    badgeClass: 'bg-[#062311] text-[#22c55e]',
  },
  {
    title: 'Docker cleanup all',
    description: 'Prunes stopped containers',
    lang: 'SH',
    dotClass: 'bg-[#8c5af3]',
    badgeClass: 'bg-[#19102c] text-[#8c5af3]',
  },
]

function MiniSidebar() {
  return (
    <div className="hidden sm:flex w-[172px] shrink-0 bg-[#161616] border-r border-[#2a2a2a] flex-col p-3 gap-2">
      <div className="flex items-center gap-1.5">
        <div className="bg-[#6366f1] rounded w-[26px] h-[26px] flex items-center justify-center shrink-0">
          <span className="text-[8px] font-bold font-mono text-white">&lt;/&gt;</span>
        </div>
        <span className="text-[10px] font-medium text-white">Snippet Vault</span>
      </div>

      <div className="bg-[#222] rounded text-[9px] text-[#595e69] px-2 py-1 mt-1">
        Search snippets...
      </div>

      <p className="text-[7px] font-medium text-[#595e69] mt-2 tracking-wider">LIBRARY</p>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 bg-[#6366f1] rounded px-1.5 py-0.5">
          <span className="text-[9px] text-white">⊞ All snippets</span>
        </div>
        <div className="flex items-center gap-1.5 px-1.5 py-0.5">
          <span className="text-[9px] text-[#9ba3af]">☆ Favourites</span>
        </div>
        <div className="flex items-center gap-1.5 px-1.5 py-0.5">
          <span className="text-[9px] text-[#9ba3af]">🔒 Private</span>
        </div>
      </div>

      <p className="text-[7px] font-medium text-[#595e69] mt-2 tracking-wider">TAGS</p>
      <div className="flex flex-col gap-0.5">
        {TAGS.map(tag => (
          <div key={tag.label} className="flex items-center gap-1.5 px-1.5 py-0.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tag.dotClass}`} />
            <span className="text-[9px] text-[#9ba3af]">{tag.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniTopBar() {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a] shrink-0">
      <div>
        <p className="text-[12px] font-medium text-white leading-none">All snippets</p>
        <p className="text-[8px] text-[#595e69] mt-0.5">5 snippets</p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] rounded text-[8px] px-2 h-[20px] flex items-center">
          Filter
        </div>
        <div className="bg-[#6366f1] text-white rounded text-[8px] px-2 h-[20px] flex items-center">
          + New snippet
        </div>
      </div>
    </div>
  )
}

function MiniSnippetRow({ title, description, lang, dotClass, badgeClass }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#2a2a2a] bg-[#1a1a1a]">
      <div className="min-w-0 mr-3">
        <p className="text-[10px] font-medium text-white truncate">{title}</p>
        <p className="text-[8px] text-[#595e69] mt-0.5 truncate">{description}</p>
      </div>
      <div className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium ${badgeClass}`}>
        <span className={`w-1 h-1 rounded-full shrink-0 ${dotClass}`} />
        {lang}
      </div>
    </div>
  )
}

export default function LandingAppPreview() {
  return (
    <section className="flex justify-center px-6 pb-20 mt-4">
      <div className="w-full max-w-[1048px] mx-auto">
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden shadow-2xl">
          <div className="flex min-h-[260px]">
            <MiniSidebar />

            <div className="flex-1 flex flex-col min-w-0">
              <MiniTopBar />
              <div>
                {SNIPPETS.map(s => (
                  <MiniSnippetRow key={s.title} {...s} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-16 bg-gradient-to-b from-[#0f0f0f]/0 to-[#0f0f0f] -mt-1 pointer-events-none" />
      </div>
    </section>
  )
}