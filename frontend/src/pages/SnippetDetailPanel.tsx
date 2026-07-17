import { useState, useEffect } from 'react'
import { ArrowLeft, Check, ChevronDown, Copy, History, Pencil, Share2, Trash2, X } from 'lucide-react'
import LanguageBadge from '../components/LanguageBadge'
import TagPill from '../components/TagPill'
import CodeEditor from '../components/CodeEditor'
import VersionHistoryPanel from '../components/VersionHistoryPanel'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/AlertDialog'
import ShareDialog from '../components/ShareDialog'
import type { Snippet } from '../api/types'

const LANG_NAMES: Record<string, string> = {
  TS: 'TypeScript',
  JS: 'JavaScript',
  PY: 'Python',
  SH: 'Shell',
  SQL: 'SQL',
}

interface SnippetDetailPanelProps {
  snippet: Snippet
  onClose: () => void
  onEdit: (snippet: Snippet) => void
  onDelete: (id: number) => void
  onRestore: (updated: Snippet) => void
  onUpdate?: (updated: Snippet) => void
}

export default function SnippetDetailPanel({
  snippet,
  onClose,
  onEdit,
  onDelete,
  onRestore,
  onUpdate,
}: SnippetDetailPanelProps) {
  const [copied, setCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleCopy() {
    navigator.clipboard.writeText(snippet.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (showHistory) {
    return (
      <VersionHistoryPanel
        snippet={snippet}
        language={snippet.language}
        onBack={() => setShowHistory(false)}
        onRestore={updated => {
          setShowHistory(false)
          onRestore(updated)
        }}
      />
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#101010]">
      <div className="flex items-center justify-between px-4 h-[56px] bg-[#121212] border-b border-[#2a2a2a] shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="lg:hidden h-auto p-0 text-sm mr-1"
            onClick={onClose}
          >
            <ArrowLeft size={16} />
          </Button>
          <span className="text-[13px] font-medium text-[#9ba3af]">Editor 1</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[#222] border border-[#2a2a2a] rounded-md text-xs text-white px-3 h-[28px] flex items-center gap-1 select-none">
            {LANG_NAMES[snippet.language] ?? snippet.language}
            <ChevronDown size={14} className="text-[#9ba3af]" />
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            aria-label="Close"
            className="hidden lg:flex w-[28px] h-[28px] p-0"
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      <div className="px-5 pt-4 pb-3 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold text-white leading-tight min-w-0 truncate">
            {snippet.title}
          </h2>
          <div className="shrink-0">
            <LanguageBadge language={snippet.language} />
          </div>
        </div>

        <p className="text-[13px] text-[#595e69] mt-2 leading-relaxed">{snippet.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {(snippet.tags || []).map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </div>

        <div className="border-t border-[#2a2a2a] mt-4" />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden mx-3 my-3 min-h-0">
        <CodeEditor language={snippet.language} code={snippet.code} editable={false} label={null} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-t border-[#2a2a2a] shrink-0 bg-[#101010] sm:h-[56px] sm:flex-nowrap sm:py-0">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            className="h-[34px] px-4 text-[13px]"
            onClick={() => onEdit(snippet)}
          >
            <Pencil size={14} /> Edit
          </Button>
          <Button
            variant="secondary"
            className="h-[34px] px-4 text-[13px]"
            onClick={() => setShowHistory(true)}
          >
            <History size={14} /> History
          </Button>
          <Button
            variant="danger"
            className="h-[34px] px-4 text-[13px]"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 size={14} /> Delete
          </Button>
          <Button
            variant="secondary"
            className="h-[34px] px-4 text-[13px]"
            onClick={() => setShareDialogOpen(true)}
          >
            <Share2 size={14} /> Share
          </Button>
        </div>

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Delete snippet"
          description={`Are you sure you want to delete "${snippet.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            setDeleteConfirmOpen(false)
            onDelete(snippet.id)
          }}
        />

        <ShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          snippet={snippet}
          onUpdate={onUpdate || (() => {})}
        />

        <Button
          variant="secondary"
          className="h-[34px] px-4 text-[13px]"
          onClick={handleCopy}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
    </div>
  )
}
