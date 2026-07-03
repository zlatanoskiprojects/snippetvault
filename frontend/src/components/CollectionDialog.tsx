import { useState, useEffect } from 'react'

const inputBase =
  'w-full bg-[#222] border border-[#2a2a2a] rounded-md text-sm text-white placeholder-[#595e69] px-3 focus:outline-none focus:border-[#6366f1] transition-colors duration-150'

export interface CollectionDialogInitialData {
  name?: string | null
  description?: string | null
}

export interface CollectionDialogSubmitData {
  name: string
  description: string | null
}

interface CollectionDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CollectionDialogSubmitData) => void
  initialData?: CollectionDialogInitialData | null
}

export default function CollectionDialog({ open, onClose, onSubmit, initialData }: CollectionDialogProps) {
  const isEditing = Boolean(initialData)
  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [nameError, setNameError] = useState('')
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setName(initialData?.name ?? '')
      setDescription(initialData?.description ?? '')
      setNameError('')
    }
  }

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  function handleSubmit() {
    if (!name.trim()) {
      setNameError('Name is required.')
      return
    }
    onSubmit({ name: name.trim(), description: description.trim() || null })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <h1 className="text-lg font-semibold text-white">
            {isEditing ? 'Edit collection' : 'New collection'}
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9ba3af] hover:text-white transition-colors duration-150 text-sm leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <div>
            <label className="block text-xs text-[#9ba3af] mb-1.5 font-normal">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value)
                if (nameError) setNameError('')
              }}
              placeholder="e.g. React Hooks"
              className={`${inputBase} h-[38px] ${nameError ? 'border-[#ef4444]' : ''}`}
            />
            {nameError && (
              <p className="text-[11px] text-[#ef4444] mt-1">{nameError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-[#9ba3af] mb-1.5 font-normal">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description..."
              className={`${inputBase} h-[60px] py-2 resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-[#6366f1] hover:bg-indigo-500 text-white text-sm font-medium px-5 h-[36px] rounded-md transition-colors duration-150"
            >
              {isEditing ? 'Save changes' : 'Create collection'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] hover:bg-[#222] text-sm px-5 h-[36px] rounded-md transition-colors duration-150"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}