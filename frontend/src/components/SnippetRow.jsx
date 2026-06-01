import LanguageBadge from './LanguageBadge'
import TagPill from './TagPill'

function formatDate(isoString) {
  if (!isoString) return ''
  const diffDays = Math.floor((Date.now() - new Date(isoString)) / 86400000)
  if (diffDays === 0) return 'today'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 14) return '1w ago'
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function SnippetRow({ snippet, isSelected = false, onSelect }) {
  const tags = snippet.tags || []
  const displayTime = snippet.timestamp ?? formatDate(snippet.updated_at ?? snippet.created_at)
  return (
    <div
      className={[
        'flex items-start justify-between py-4 border-b border-[#2a2a2a] bg-[#1a1a1a] cursor-pointer transition-colors duration-150',
        isSelected
          ? 'bg-[#1c1c38] border-l-[3px] border-l-[#6366f1] pl-[21px] pr-6'
          : 'hover:bg-[#1f1f1f] px-6',
      ].join(' ')}
      onClick={() => onSelect?.(snippet)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{snippet.title}</p>
        <p className="text-xs text-[#595e69] mt-0.5 truncate">{snippet.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 ml-6 shrink-0">
        <LanguageBadge language={snippet.language} />
        <span className="text-[10px] text-[#595e69]">{displayTime}</span>
      </div>
    </div>
  )
}