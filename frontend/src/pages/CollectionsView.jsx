import { useState } from 'react'
import CollectionCard from '../components/CollectionCard'
import CollectionDialog from '../components/CollectionDialog'
import { useCollections } from '../hooks/useCollections'

export default function CollectionsView({ onSelectCollection }) {
  const { collections, loading, error, addCollection, editCollection, removeCollection } = useCollections()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const handleNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const handleEdit = (collection) => {
    setEditing(collection)
    setDialogOpen(true)
  }

  const handleSubmit = (values) => {
    if (editing) {
      editCollection(editing.id, values)
    } else {
      addCollection(values)
    }
  }

  const handleDelete = (id) => {
    removeCollection(id)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-end justify-between px-6 py-3 border-b border-[#2a2a2a] shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-white leading-tight">Collections</h1>
          <p className="text-xs text-[#595e69] mt-0.5">{collections.length} collections</p>
        </div>
        <button
          type="button"
          onClick={handleNew}
          className="bg-[#6366f1] hover:bg-indigo-500 text-white text-xs font-medium px-4 h-[30px] rounded-md transition-colors duration-150"
        >
          + New collection
        </button>
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
          {collections.map(collection => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onEdit={() => handleEdit(collection)}
              onDelete={() => handleDelete(collection.id)}
              onSelect={() => onSelectCollection?.(collection)}
            />
          ))}
        </div>
      )}

      <CollectionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initialData={editing}
      />
    </div>
  )
}