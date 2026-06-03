import { useState } from 'react'
import CodeEditor from '../components/CodeEditor'
import { createSnippet, updateSnippet } from '../api/snippets'
import { getOrCreateTag, assignTagToSnippet, removeTagFromSnippet, getAllTags } from '../api/tags'
import { useToast } from '../hooks/useToast'
import { useCollections } from '../hooks/useCollections'

const LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Shell', 'SQL', 'Go', 'Rust']

const inputBase =
  'w-full bg-[#222] border border-[#2a2a2a] rounded-md text-sm text-white placeholder-[#595e69] px-3 focus:outline-none focus:border-[#6366f1] transition-colors duration-150'

const selectBase =
  'w-full h-[38px] bg-[#222] border border-[#2a2a2a] rounded-md text-sm text-white px-3 appearance-none cursor-pointer focus:outline-none focus:border-[#6366f1] transition-colors duration-150'

function SelectWrapper({ label, children }) {
  return (
    <div className="flex-1">
      <label className="block text-xs text-[#9ba3af] mb-1.5 font-normal">{label}</label>
      <div className="relative">
        {children}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#595e69] text-xs pointer-events-none">
          ∨
        </span>
      </div>
    </div>
  )
}

export default function NewSnippet({ snippet, onCancel, onSaved }) {
  const isEditing = Boolean(snippet)
  const toast = useToast()
  const { collections } = useCollections()

  const [title, setTitle] = useState(snippet?.title ?? '')
  const [description, setDescription] = useState(snippet?.description ?? '')
  const [language, setLanguage] = useState(snippet?.language ?? 'TypeScript')
  const [visibility, setVisibility] = useState(
    snippet?.visibility ? snippet.visibility.charAt(0).toUpperCase() + snippet.visibility.slice(1) : 'Private'
  )
  const [tags, setTags] = useState(snippet?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [collectionId, setCollectionId] = useState(snippet?.collection_id ?? '')
  const [code, setCode] = useState(snippet?.code ?? '')
  const [saving, setSaving] = useState(false)

  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      const val = tagInput.replace(/,$/, '').trim()
      if (!val) return
      e.preventDefault()
      setTags(prev => [...prev, val])
      setTagInput('')
    }
  }

  function removeTag(i) {
    setTags(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Title is required.')
      return
    }
    const finalTags = tagInput.trim() ? [...tags, tagInput.trim()] : tags
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      code,
      language,
      visibility: visibility.toLowerCase(),
      collection_id: collectionId || null,
    }
    setSaving(true)
    try {
      if (isEditing) {
        await updateSnippet(snippet.id, payload)
        const existingTags = snippet.tags || []
        const toAdd = finalTags.filter(t => !existingTags.includes(t))
        const toRemove = existingTags.filter(t => !finalTags.includes(t))
        if (toAdd.length || toRemove.length) {
          const allTags = await getAllTags()
          for (const name of toAdd) {
            const tag = await getOrCreateTag(name)
            await assignTagToSnippet(tag.id, snippet.id)
          }
          for (const name of toRemove) {
            const tag = allTags.find(t => t.name === name)
            if (tag) await removeTagFromSnippet(tag.id, snippet.id)
          }
        }
        toast.success('Snippet updated.')
        onSaved({ ...snippet, ...payload, tags: finalTags })
      } else {
        const created = await createSnippet(payload)
        for (const name of finalTags) {
          const tag = await getOrCreateTag(name)
          await assignTagToSnippet(tag.id, created.id)
        }
        toast.success('Snippet created.')
        onSaved({ ...created, tags: finalTags })
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="flex items-center px-6 py-4 border-b border-[#2a2a2a] shrink-0">
        <h1 className="text-lg font-semibold text-white">
          {isEditing ? 'Edit snippet' : 'Create new snippet'}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

        <div className="flex flex-col flex-1 min-w-0 px-6 py-5 gap-4 overflow-y-auto">

          <div>
            <label className="block text-xs text-[#9ba3af] mb-1.5 font-normal">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. useDebounce hook"
              className={`${inputBase} h-[38px]`}
            />
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

          <div className="flex gap-3">
            <SelectWrapper label="Language">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className={selectBase}
              >
                {LANGUAGES.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </SelectWrapper>

            <SelectWrapper label="Visibility">
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value)}
                className={selectBase}
              >
                <option value="Private">Private</option>
                <option value="Public">Public</option>
              </select>
            </SelectWrapper>
          </div>

          <div>
            <label className="block text-xs text-[#9ba3af] mb-1.5 font-normal">Tags</label>
            <div className="min-h-[38px] bg-[#222] border border-[#2a2a2a] rounded-md px-2 py-1.5 flex flex-wrap gap-1.5 items-center focus-within:border-[#6366f1] transition-colors duration-150">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 bg-[#242424] text-[#595e69] text-[10px] px-2 py-0.5 rounded"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(i)}
                    className="text-[#595e69] hover:text-white leading-none ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tag…"
                className="bg-transparent text-sm text-white placeholder-[#595e69] outline-none flex-1 min-w-[80px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#9ba3af] mb-1.5 font-normal">Collection</label>
            <div className="relative">
              <select
                value={collectionId}
                onChange={e => setCollectionId(e.target.value ? Number(e.target.value) : '')}
                className={selectBase}
              >
                <option value="">No collection</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#595e69] text-xs pointer-events-none">
                ∨
              </span>
            </div>
          </div>

          <div className="flex gap-3 mt-auto pt-5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#6366f1] hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-5 h-[36px] rounded-md transition-colors duration-150"
            >
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save snippet'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] hover:bg-[#222] text-sm px-5 h-[36px] rounded-md transition-colors duration-150"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="flex lg:w-[55%] min-h-[300px] min-w-0 px-6 pb-6 pt-5 lg:pt-5">
          <CodeEditor language={language} code={code} onChange={setCode} />
        </div>
      </div>
    </div>
  )
}
