export default function CollectionCard({ collection, onEdit, onDelete }) {
  const { name, description, snippetCount, updatedAt, accentColor } = collection

  return (
    <div className="group relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden hover:border-[#3a3a3a] transition-colors duration-150 cursor-pointer min-h-[138px] flex flex-col">
      <div className="h-[4px] w-full shrink-0" style={{ backgroundColor: accentColor }} />

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[15px] font-medium text-white leading-tight truncate min-w-0">{name}</span>
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onEdit?.() }}
              className="bg-[#222] border border-[#2a2a2a] text-[#9ba3af] hover:text-white hover:bg-[#2a2a2a] text-[11px] font-medium px-2 h-[22px] rounded transition-colors duration-150"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onDelete?.() }}
              className="bg-[#222] border border-[#2a2a2a] text-[#9ba3af] hover:text-[#ef4444] hover:border-[#ef4444]/30 text-[11px] font-medium px-2 h-[22px] rounded transition-colors duration-150"
            >
              Delete
            </button>
          </div>
        </div>

        <p className="text-xs text-[#595e69] leading-relaxed line-clamp-2">{description}</p>

        <div className="mt-auto pt-1 flex flex-col gap-0.5">
          <span className="text-xs text-[#595e69]">{snippetCount} snippets</span>
          <span className="text-[11px] text-[#4d4d59]">Updated {updatedAt}</span>
        </div>
      </div>
    </div>
  )
}
