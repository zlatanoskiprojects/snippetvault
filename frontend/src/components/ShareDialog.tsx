import { useState } from 'react'
import { Check, Copy, Globe, Lock } from 'lucide-react'
import Dialog from './ui/Dialog'
import Button from './ui/Button'
import Spinner from './ui/Spinner'
import { updateSnippet } from '../api/snippets'
import { useToast } from '../hooks/useToast'
import type { Snippet } from '../api/types'

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  snippet: Snippet
  onUpdate: (updated: Snippet) => void
}

export default function ShareDialog({ open, onClose, snippet, onUpdate }: ShareDialogProps) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const isPublic = snippet.visibility.toLowerCase() === 'public'
  const shareLink = snippet.share_token
    ? `${window.location.origin}/share/${snippet.share_token}`
    : ''

  async function handleToggleVisibility() {
    setLoading(true)
    try {
      const nextVisibility = isPublic ? 'private' : 'public'
      const updated = await updateSnippet(snippet.id, {
        visibility: nextVisibility,
      })
      onUpdate(updated)
      toast.success(
        nextVisibility === 'public'
          ? 'Snippet is now public and shareable.'
          : 'Snippet is now private.'
      )
    } catch {
      return
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!shareLink) return
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      title="Share Snippet"
    >
      <div className="flex flex-col gap-5 px-6 py-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3 text-secondary">
            <Spinner size="sm" />
            <span className="text-xs">Updating link visibility...</span>
          </div>
        ) : isPublic ? (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-secondary flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success-status animate-pulse" />
                Public Link
              </span>
              <p className="text-[12px] text-muted leading-relaxed">
                Anyone with this link can view this snippet. No login required.
              </p>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-panel-header border border-border-default rounded-md px-3 h-[38px] flex items-center text-xs text-primary overflow-x-auto whitespace-nowrap scrollbar-none">
                {shareLink}
              </div>
              <Button
                variant={copied ? 'secondary' : 'primary'}
                onClick={handleCopy}
                className="h-[38px] px-4 text-xs font-semibold shrink-0"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="border-t border-border-default my-1" />

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-primary">Revoke sharing?</span>
                <span className="text-[11px] text-muted">Make private to disable this link.</span>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={handleToggleVisibility}
                className="w-full sm:w-auto"
              >
                Make Private
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2 py-2 text-center items-center">
              <div className="w-12 h-12 rounded-full bg-control border border-border-default flex items-center justify-center mb-1 select-none text-secondary">
                <Lock size={20} />
              </div>
              <span className="text-sm font-semibold text-primary">This snippet is private</span>
              <p className="text-xs text-secondary max-w-[280px] leading-relaxed">
                To share this snippet with others, you need to make it public.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row pt-2">
              <Button
                variant="primary"
                onClick={handleToggleVisibility}
                className="w-full text-xs font-semibold py-2"
              >
                <Globe size={14} /> Make Public & Share
              </Button>
              <Button
                variant="secondary"
                onClick={onClose}
                className="w-full text-xs font-semibold py-2"
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
