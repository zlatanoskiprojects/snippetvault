import Card from './ui/Card'
import Button from './ui/Button'
import type { Collection } from '../api/types'

export interface CollectionWithMeta extends Collection {
  snippetCount: number
  accentColor: string
}

interface CollectionCardProps {
  collection: CollectionWithMeta
  onEdit?: () => void
  onDelete?: () => void
  onSelect?: () => void
}

export default function CollectionCard({ collection, onEdit, onDelete, onSelect }: CollectionCardProps) {
  const { name, description, snippetCount, accentColor } = collection

  return (
    <Card
      onClick={onSelect}
      accentColor={accentColor}
      accentClassName="h-[4px]"
      className="group relative hover:border-[#3a3a3a] transition-colors duration-150 cursor-pointer min-h-[138px] flex flex-col"
    >
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[15px] font-medium text-white leading-tight truncate min-w-0">{name}</span>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              className="h-[22px] px-2 text-[11px]"
              onClick={e => { e.stopPropagation(); onEdit?.() }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="h-[22px] px-2 text-[11px] bg-[#2b0c0c] border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444] hover:text-white"
              onClick={e => { e.stopPropagation(); onDelete?.() }}
            >
              Delete
            </Button>
          </div>
        </div>

        <p className="text-xs text-[#595e69] leading-relaxed line-clamp-2">{description}</p>

        <div className="mt-auto pt-1">
          <span className="text-xs text-[#595e69]">{snippetCount} snippets</span>
        </div>
      </div>
    </Card>
  )
}
