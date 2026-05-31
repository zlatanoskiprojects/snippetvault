import SnippetRow from './SnippetRow'

export default function SnippetList({ snippets = [] }) {
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
        <SnippetRow key={snippet.id} snippet={snippet} />
      ))}
    </div>
  )
}