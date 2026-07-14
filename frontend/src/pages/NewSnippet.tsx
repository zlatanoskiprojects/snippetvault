import { useState, type KeyboardEvent } from 'react'
import CodeEditor from '../components/CodeEditor'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Select from '../components/ui/Select'
import Field from '../components/ui/Field'
import { createSnippet, updateSnippet, type SnippetInput } from '../api/snippets'
import { getOrCreateTag, assignTagToSnippet, removeTagFromSnippet, getAllTags } from '../api/tags'
import { useToast } from '../hooks/useToast'
import { useCollections } from '../hooks/useCollections'
import type { Snippet } from '../api/types'
import { SUPPORTED_LANGUAGES } from '../constants/languages'

const LANGUAGE_OPTIONS = SUPPORTED_LANGUAGES.map(l => ({ value: l, label: l }))
const VISIBILITY_OPTIONS = [
  { value: 'Private', label: 'Private' },
  { value: 'Public', label: 'Public' },
]

interface NewSnippetProps {
  snippet?: Snippet | null
  onCancel: () => void
  onSaved: (snippet: Snippet) => void
}

export default function NewSnippet({ snippet, onCancel, onSaved }: NewSnippetProps) {
  const isEditing = Boolean(snippet)
  const toast = useToast()
  const { collections } = useCollections()

  const [title, setTitle] = useState(snippet?.title ?? '')
  const [description, setDescription] = useState(snippet?.description ?? '')
  const [language, setLanguage] = useState(snippet?.language ?? 'TypeScript')
  const [visibility, setVisibility] = useState(
    snippet?.visibility ? snippet.visibility.charAt(0).toUpperCase() + snippet.visibility.slice(1) : 'Private'
  )
  const [tags, setTags] = useState<string[]>(snippet?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [collectionId, setCollectionId] = useState<number | ''>(snippet?.collection_id ?? '')
  const [code, setCode] = useState(snippet?.code ?? '')
  const [changeNote, setChangeNote] = useState('')
  const [saving, setSaving] = useState(false)

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      const val = tagInput.replace(/,$/, '').trim()
      if (!val) return
      e.preventDefault()
      setTags(prev => prev.includes(val) ? prev : [...prev, val])
      setTagInput('')
    }
  }

  function removeTag(i: number) {
    setTags(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Title is required.')
      return
    }
    const finalTags = [...new Set(tagInput.trim() ? [...tags, tagInput.trim()] : tags)]
    const payload: SnippetInput = {
      title: title.trim(),
      description: description.trim() || null,
      code,
      language,
      visibility: visibility.toLowerCase(),
      collection_id: collectionId || null,
      ...(isEditing && changeNote.trim() ? { change_note: changeNote.trim() } : {}),
    }
    setSaving(true)
    try {
      if (isEditing && snippet) {
        const updated = await updateSnippet(snippet.id, payload)
        console.log('share_token:', updated.share_token)
        const existingTags = snippet.tags || []
        const toAdd = finalTags.filter(t => !existingTags.includes(t))
        const toRemove = existingTags.filter(t => !finalTags.includes(t))
        if (toAdd.length || toRemove.length) {
          const allTags = await getAllTags()
          for (const name of toAdd) {
            const tag = await getOrCreateTag(name)
            if (tag) await assignTagToSnippet(tag.id, snippet.id)
          }
          for (const name of toRemove) {
            const tag = allTags.find(t => t.name === name)
            if (tag) await removeTagFromSnippet(tag.id, snippet.id)
          }
        }
        toast.success('Snippet updated.')
        onSaved({ ...updated, tags: finalTags })
      } else {
        const created = await createSnippet(payload)
        console.log('share_token:', created.share_token)
        for (const name of finalTags) {
          const tag = await getOrCreateTag(name)
          if (tag) await assignTagToSnippet(tag.id, created.id)
        }
        toast.success('Snippet created.')
        onSaved({ ...created, tags: finalTags })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.')
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

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-x-hidden overflow-y-auto lg:overflow-y-hidden">

        <div className="flex flex-col min-w-0 px-6 py-5 gap-4 lg:flex-1 lg:overflow-y-auto">

          <Field label="Title">
            <Input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. useDebounce hook"
            />
          </Field>

          <Field label="Description">
            <Textarea
              value={description ?? ''}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description..."
            />
          </Field>

          {isEditing && (
            <Field label={<>Change note <span className="text-[#595e69]">(optional)</span></>}>
              <Input
                type="text"
                value={changeNote}
                onChange={e => setChangeNote(e.target.value)}
                placeholder="e.g. Fixed off-by-one error"
              />
            </Field>
          )}

          <div className="flex gap-3">
            <Field label="Language" className="flex-1">
              <Select value={language} onValueChange={setLanguage} options={LANGUAGE_OPTIONS} />
            </Field>

            <Field label="Visibility" className="flex-1">
              <Select value={visibility} onValueChange={setVisibility} options={VISIBILITY_OPTIONS} />
            </Field>
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
                  <Button
                    variant="ghost"
                    onClick={() => removeTag(i)}
                    className="h-auto p-0 text-[#595e69] hover:text-white hover:bg-transparent leading-none ml-0.5"
                  >
                    ×
                  </Button>
                </span>
              ))}
              <Input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tag…"
                className="bg-transparent border-0 h-auto p-0 flex-1 min-w-[80px] focus:border-transparent"
              />
            </div>
          </div>

          <Field label="Collection">
            <Select
              value={collectionId}
              onValueChange={setCollectionId}
              options={[{ value: '' as number | '', label: 'No collection' }, ...collections.map(c => ({ value: c.id, label: c.name }))]}
            />
          </Field>

          <div className="flex flex-col gap-3 mt-auto pt-5 sm:flex-row">
            <Button variant="primary" onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save snippet'}
            </Button>
            <Button variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
          </div>
        </div>

        <div className="flex h-[340px] lg:h-auto lg:w-[55%] min-h-[300px] min-w-0 px-6 pb-6 pt-5 lg:pt-5 shrink-0 lg:shrink">
          <CodeEditor language={language} code={code} onChange={setCode} />
        </div>
      </div>
    </div>
  )
}
