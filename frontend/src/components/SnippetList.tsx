import SnippetRow from './SnippetRow'
import type { Snippet } from '../api/types'

interface SnippetListProps {
  snippets?: Snippet[]
  selectedSnippetId?: number | null
  onSelectSnippet?: (snippet: Snippet) => void
}

export default function SnippetList({ snippets = [], selectedSnippetId, onSelectSnippet }: SnippetListProps) {
  if (snippets.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-[#595e69]">
        No snippets yet. Create your first one.
      </div>
    )
  }

  return (
    <div>
      {snippets.map((snippet) => (
        <SnippetRow
          key={snippet.id}
          snippet={snippet}
          isSelected={snippet.id === selectedSnippetId}
          onSelect={onSelectSnippet}
        />
      ))}
    </div>
  )
}