import { useState } from 'react'
import CollectionCard, { type CollectionWithMeta } from '../components/CollectionCard'
import Button from '../components/ui/Button'
import CollectionDialog, {
  type CollectionDialogInitialData,
  type CollectionDialogSubmitData,
} from '../components/CollectionDialog'
import { useCollections } from '../hooks/useCollections'
import type { Collection } from '../api/types'

interface CollectionsViewProps {
  onSelectCollection?: (collection: Collection) => void
}

export default function CollectionsView({ onSelectCollection }: CollectionsViewProps) {
  const { collections, loading, error, addCollection, editCollection, removeCollection } = useCollections()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Collection | null>(null)

  const handleNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const handleEdit = (collection: Collection) => {
    setEditing(collection)
    setDialogOpen(true)
  }

  const handleSubmit = (values: CollectionDialogSubmitData) => {
    if (editing) {
      editCollection(editing.id, values)
    } else {
      addCollection(values)
    }
  }

  const handleDelete = (id: number) => {
    removeCollection(id)
  }

  const editingInitialData: CollectionDialogInitialData | null = editing
    ? { name: editing.name, description: editing.description }
    : null

  return (
    <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
      <header className="flex items-end justify-between px-6 py-3 border-b border-[#2a2a2a] shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white leading-tight">Collections</h1>
          <p className="text-xs text-[#595e69] mt-0.5">{collections.length} collections</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleNew} className="px-4 text-xs">
          + New collection
        </Button>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#595e69] text-sm">Loading collections…</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#ef4444] text-sm">Failed to load collections: {error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 overflow-y-auto">
          {collections.map(collection => {
            const collectionWithMeta: CollectionWithMeta = {
              ...collection,
              snippetCount: 0,
              accentColor: '#6366f1',
            }
            return (
              <CollectionCard
                key={collection.id}
                collection={collectionWithMeta}
                onEdit={() => handleEdit(collection)}
                onDelete={() => handleDelete(collection.id)}
                onSelect={() => onSelectCollection?.(collection)}
              />
            )
          })}
        </div>
      )}

      <CollectionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingInitialData}
      />
    </div>
  )
}
