import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { getSnippetVersions, getSnippetVersion, restoreSnippetVersion, deleteSnippetVersion } from '../api/snippets'
import CodeEditor from './CodeEditor'
import Button from './ui/Button'
import ConfirmDialog from './ui/AlertDialog'
import Spinner from './ui/Spinner'
import type { Snippet, SnippetVersion } from '../api/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

interface VersionHistoryPanelProps {
  snippet: Snippet
  onBack: () => void
  onRestore: (updated: Snippet) => void
  language: string
}

export default function VersionHistoryPanel({ snippet, onBack, onRestore, language }: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<SnippetVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<SnippetVersion | null>(null)
  const [previewCode, setPreviewCode] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    getSnippetVersions(snippet.id)
      .then(data => { if (!cancelled) setVersions(data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [snippet.id])

  async function handleSelectVersion(version: SnippetVersion) {
    if (selectedVersion?.id === version.id) {
      setSelectedVersion(null)
      setPreviewCode(null)
      return
    }
    setSelectedVersion(version)
    setLoadingPreview(true)
    try {
      const full = await getSnippetVersion(snippet.id, version.id)
      setPreviewCode(full.code)
    } finally {
      setLoadingPreview(false)
    }
  }

  async function handleDelete() {
    if (!selectedVersion) return
    setDeleting(true)
    try {
      await deleteSnippetVersion(snippet.id, selectedVersion.id)
      setVersions(prev => prev.filter(v => v.id !== selectedVersion.id))
      setSelectedVersion(null)
      setPreviewCode(null)
    } finally {
      setDeleting(false)
      setDeleteConfirmOpen(false)
    }
  }

  async function handleRestore() {
    if (!selectedVersion) return
    setRestoring(true)
    try {
      const updated = await restoreSnippetVersion(snippet.id, selectedVersion.id)
      onRestore(updated)
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#101010]">
      <div className="flex items-center justify-between px-4 h-[56px] bg-[#121212] border-b border-[#2a2a2a] shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-auto p-0 text-sm">
            <ArrowLeft size={16} />
          </Button>
          <span className="text-[13px] font-medium text-white">Version History</span>
        </div>
        <span className="text-[12px] text-[#595e69]">{snippet.title}</span>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-[220px] shrink-0 border-r border-[#2a2a2a] overflow-y-auto flex flex-col">
          {loading ? (
            <div className="flex flex-1 items-center justify-center p-4">
              <Spinner size="sm" className="text-[#9ba3af]" />
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-4">
              <p className="text-[13px] text-[#595e69] text-center">No versions saved yet.<br />Edit code to create one.</p>
            </div>
          ) : (
            versions.map(v => (
              <button
                key={v.id}
                onClick={() => handleSelectVersion(v)}
                className={`w-full text-left px-4 py-3 border-b border-[#2a2a2a] transition-colors duration-150 ${
                  selectedVersion?.id === v.id ? 'bg-[#1e1e2e]' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-[12px] font-medium ${selectedVersion?.id === v.id ? 'text-[#6366f1]' : 'text-white'}`}>
                    v{v.version_number}
                  </span>
                  <span className="text-[11px] text-[#595e69]">{timeAgo(v.created_at)}</span>
                </div>
                {v.change_note ? (
                  <p className="text-[11px] text-[#9ba3af] truncate">{v.change_note}</p>
                ) : (
                  <p className="text-[11px] text-[#595e69] italic">No note</p>
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          {selectedVersion ? (
            <>
              <div className="px-4 py-2 border-b border-[#2a2a2a] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-medium text-white">v{selectedVersion.version_number}</span>
                  {selectedVersion.change_note && (
                    <span className="text-[12px] text-[#9ba3af]">{selectedVersion.change_note}</span>
                  )}
                </div>
                <span className="text-[11px] text-[#595e69]">{new Date(selectedVersion.created_at).toLocaleString()}</span>
              </div>
              <div className="flex-1 overflow-hidden mx-3 my-3 min-h-0">
                {loadingPreview ? (
                  <div className="flex h-full items-center justify-center">
                    <Spinner size="sm" className="text-[#9ba3af]" />
                  </div>
                ) : (
                  <CodeEditor language={language} code={previewCode ?? ''} editable={false} label={null} />
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-[13px] text-[#595e69]">Select a version to preview</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-5 h-[56px] border-t border-[#2a2a2a] shrink-0 bg-[#101010]">
        <Button variant="secondary" onClick={onBack} className="h-[34px] px-4 text-[13px]">
          Back
        </Button>
        {selectedVersion && (
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={deleting}
              className="h-[34px] px-4 text-[13px] bg-[#2a0a0a] border border-[#5c1a1a] hover:bg-red-900/40 text-red-400 hover:text-red-300"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
            <Button
              variant="primary"
              onClick={handleRestore}
              disabled={restoring}
              className="h-[34px] px-4 text-[13px]"
            >
              {restoring ? 'Restoring…' : `Restore v${selectedVersion.version_number}`}
            </Button>
          </div>
        )}

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Delete version"
          description={selectedVersion ? `Delete v${selectedVersion.version_number}? This action cannot be undone.` : undefined}
          confirmLabel="Delete"
          danger
          confirming={deleting}
          onConfirm={handleDelete}
        />
      </div>
    </div>
  )
}