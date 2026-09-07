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
    <div className="flex flex-col h-full bg-panel">
      <div className="flex items-center justify-between gap-3 px-4 h-[56px] bg-panel-header border-b border-border-default shrink-0 min-w-0">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center justify-center w-10 h-10 -m-2 sm:w-auto sm:h-auto sm:m-0 sm:p-0 text-sm">
            <ArrowLeft size={16} />
          </Button>
          <span className="text-[13px] font-medium text-primary whitespace-nowrap">Version History</span>
        </div>
        <span className="text-[12px] text-muted truncate min-w-0">{snippet.title}</span>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className={`w-full md:w-[220px] shrink-0 border-r border-border-default overflow-y-auto flex-col ${selectedVersion ? 'hidden md:flex' : 'flex'}`}>
          {loading ? (
            <div className="flex flex-1 items-center justify-center p-4">
              <Spinner size="sm" className="text-secondary" />
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-4">
              <p className="text-[13px] text-muted text-center">No versions saved yet.<br />Edit code to create one.</p>
            </div>
          ) : (
            versions.map(v => (
              <Button variant="unstyled" size="unstyled"
                key={v.id}
                onClick={() => handleSelectVersion(v)}
                className={`w-full text-left px-4 py-3 border-b border-border-default transition-colors duration-150 ${
                  selectedVersion?.id === v.id ? 'bg-surface-selected-strong' : 'hover:bg-interactive-overlay/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={`text-[12px] font-medium ${selectedVersion?.id === v.id ? 'text-accent' : 'text-primary'}`}>
                    v{v.version_number}
                  </span>
                  <span className="text-[11px] text-muted">{timeAgo(v.created_at)}</span>
                </div>
                {v.change_note ? (
                  <p className="text-[11px] text-secondary truncate">{v.change_note}</p>
                ) : (
                  <p className="text-[11px] text-muted italic">No note</p>
                )}
              </Button>
            ))
          )}
        </div>

        <div className={`flex-col flex-1 min-w-0 min-h-0 ${selectedVersion ? 'flex' : 'hidden md:flex'}`}>
          {selectedVersion ? (
            <>
              <div className="px-4 py-2 border-b border-border-default flex items-center justify-between gap-2 shrink-0 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    onClick={() => { setSelectedVersion(null); setPreviewCode(null) }}
                    aria-label="Back to version list"
                    className="md:hidden w-[40px] h-[40px] p-0 -ml-2 shrink-0"
                  >
                    <ArrowLeft size={16} />
                  </Button>
                  <span className="text-[12px] font-medium text-primary shrink-0">v{selectedVersion.version_number}</span>
                  {selectedVersion.change_note && (
                    <span className="text-[12px] text-secondary truncate">{selectedVersion.change_note}</span>
                  )}
                </div>
                <span className="text-[11px] text-muted shrink-0">{new Date(selectedVersion.created_at).toLocaleString()}</span>
              </div>
              <div className="flex-1 overflow-hidden mx-3 my-3 min-h-0">
                {loadingPreview ? (
                  <div className="flex h-full items-center justify-center">
                    <Spinner size="sm" className="text-secondary" />
                  </div>
                ) : (
                  <CodeEditor language={language} code={previewCode ?? ''} editable={false} label={null} />
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-[13px] text-muted">Select a version to preview</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-5 h-[56px] border-t border-border-default shrink-0 bg-panel">
        <Button variant="secondary" size="md" onClick={onBack} className="px-4 text-[13px]">
          Back
        </Button>
        {selectedVersion && (
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="md"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={deleting}
              className="border border-danger-restore-border bg-danger-restore px-4 text-[13px] text-danger-soft hover:bg-danger-strong/40 hover:text-danger-soft-hover"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleRestore}
              disabled={restoring}
              className="px-4 text-[13px]"
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
