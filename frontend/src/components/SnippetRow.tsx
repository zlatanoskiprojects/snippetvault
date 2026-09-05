import LanguageBadge from './LanguageBadge'
import TagPill from './TagPill'
import type { Snippet } from '../api/types'

export interface SnippetRowData extends Snippet {
  timestamp?: string
}

function formatDate(isoString?: string | null): string {
  if (!isoString) return ''
  const now = new Date()
  const date = new Date(isoString)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000)
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 14) return '1w ago'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface SnippetRowProps {
  snippet: SnippetRowData
  isSelected?: boolean
  onSelect?: (snippet: SnippetRowData) => void
}

export default function SnippetRow({ snippet, isSelected = false, onSelect }: SnippetRowProps) {
  const tags = snippet.tags || []
  const displayTime = snippet.timestamp ?? formatDate(snippet.updated_at ?? snippet.created_at)
  return (
    <div
      className={[
        'flex items-start justify-between py-4 border-b border-border-default bg-surface cursor-pointer transition-colors duration-150',
        isSelected
          ? 'bg-surface-selected border-l-[3px] border-l-accent pl-[21px] pr-6'
          : 'hover:bg-surface-hover px-6',
      ].join(' ')}
      onClick={() => onSelect?.(snippet)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary truncate">{snippet.title}</p>
        <p className="text-xs text-muted mt-0.5 truncate">{snippet.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 ml-6 shrink-0">
        <LanguageBadge language={snippet.language} />
        <span className="text-[10px] text-muted">{displayTime}</span>
      </div>
    </div>
  )
}