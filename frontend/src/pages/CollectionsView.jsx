import { useState } from 'react'
import CollectionCard from '../components/CollectionCard'

const MOCK_COLLECTIONS = [
  {
    id: 1,
    name: 'React Hooks',
    description: 'Custom hooks for React apps',
    snippetCount: 8,
    updatedAt: '5d ago',
    accentColor: '#6366f1',
  },
  {
    id: 2,
    name: 'Database Utils',
    description: 'SQL helpers and ORM utilities',
    snippetCount: 12,
    updatedAt: '2d ago',
    accentColor: '#22c55e',
  },
  {
    id: 3,
    name: 'Auth Patterns',
    description: 'JWT, OAuth, session management',
    snippetCount: 6,
    updatedAt: '1w ago',
    accentColor: '#8c5af3',
  },
  {
    id: 4,
    name: 'API Templates',
    description: 'Reusable API endpoint patterns',
    snippetCount: 4,
    updatedAt: '3d ago',
    accentColor: '#fba528',
  },
  {
    id: 5,
    name: 'Docker & DevOps',
    description: 'Container management scripts',
    snippetCount: 9,
    updatedAt: '4d ago',
    accentColor: '#3d77fc',
  },
  {
    id: 6,
    name: 'TypeScript Utils',
    description: 'Type helpers and generics',
    snippetCount: 7,
    updatedAt: '1d ago',
    accentColor: '#ef4444',
  },
]

export default function CollectionsView() {
  const [collections, setCollections] = useState(MOCK_COLLECTIONS)

  const handleDelete = (id) => {
    setCollections(prev => prev.filter(c => c.id !== id))
  }

  const handleEdit = (id) => {
    console.log('edit collection', id)
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
          onClick={() => console.log('new collection')}
          className="bg-[#6366f1] hover:bg-indigo-500 text-white text-xs font-medium px-4 h-[30px] rounded-md transition-colors duration-150"
        >
          + New collection
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 overflow-y-auto">
        {collections.map(collection => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            onEdit={() => handleEdit(collection.id)}
            onDelete={() => handleDelete(collection.id)}
          />
        ))}
      </div>
    </div>
  )
}