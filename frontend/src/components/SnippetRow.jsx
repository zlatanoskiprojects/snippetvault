import LanguageBadge from './LanguageBadge'
import TagPill from './TagPill'

export default function SnippetRow({ snippet }) {
  return (
    <div className="flex items-start justify-between px-6 py-4 border-b border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#1f1f1f] cursor-pointer transition-colors duration-150">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{snippet.title}</p>
        <p className="text-xs text-[#595e69] mt-0.5 truncate">{snippet.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {snippet.tags.map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 ml-6 shrink-0">
        <LanguageBadge language={snippet.language} />
        <span className="text-[10px] text-[#595e69]">{snippet.timestamp}</span>
      </div>
    </div>
  )
}