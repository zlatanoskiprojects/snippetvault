import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import LandingNavbar from '../components/landing/LandingNavbar'
import LanguageBadge from '../components/LanguageBadge'
import TagPill from '../components/TagPill'
import CodeEditor from '../components/CodeEditor'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import { getSharedSnippet } from '../api/share'
import type { SharedSnippet } from '../api/types'

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function SharedSnippetView() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [snippet, setSnippet] = useState<SharedSnippet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!token) {
      setError(true)
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(false)
      try {
        const data = await getSharedSnippet(token as string)
        if (!cancelled) setSnippet(data)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="min-h-screen bg-app flex flex-col">
      <LandingNavbar showNavLinks={false} onGetStarted={() => navigate('/login')} />

      {loading && (
        <main className="flex-1 flex items-center justify-center">
          <h1 aria-label="Loading shared snippet"><Spinner /></h1>
        </main>
      )}

      {!loading && error && (
        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
          <h1 className="text-secondary text-sm max-w-sm">
            This snippet doesn't exist or is no longer public.
          </h1>
          <Button variant="primary" onClick={() => navigate('/')}>
            Back to Snippet Vault
          </Button>
        </main>
      )}

      {!loading && !error && snippet && (
        <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-primary leading-tight min-w-0 truncate">
              {snippet.title}
            </h1>
            <div className="shrink-0">
              <LanguageBadge language={snippet.language} />
            </div>
          </div>

          {snippet.description && (
            <p className="text-sm text-secondary mt-2 leading-relaxed">
              {snippet.description}
            </p>
          )}

          {snippet.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {snippet.tags.map(tag => (
                <TagPill key={tag} label={tag} />
              ))}
            </div>
          )}

          <p className="text-xs text-muted mt-4">
            Created {formatDate(snippet.created_at)}
            {snippet.updated_at !== snippet.created_at && ` · Updated ${formatDate(snippet.updated_at)}`}
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded bg-tag border border-border-default px-2.5 py-1 text-xs text-secondary">
            Shared by:
            <span className="text-primary font-medium">{snippet.owner_name}</span>
          </div>

          <div className="mt-6 min-w-0">
            <CodeEditor
              language={snippet.language}
              code={snippet.code}
              editable={false}
              label={null}
            />
          </div>
        </main>
      )}
    </div>
  )
}
