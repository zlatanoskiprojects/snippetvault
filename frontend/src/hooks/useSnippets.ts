import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllSnippets } from '../api/snippets'
import { ApiError } from '../api/utils'
import type { Snippet } from '../api/types'

export interface UseSnippetsResult {
  snippets: Snippet[]
  setSnippets: Dispatch<SetStateAction<Snippet[]>>
  loading: boolean
  error: string | null
}

export function useSnippets(workspaceId: number | null): UseSnippetsResult {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let current = true

    async function load() {
      if (workspaceId === null) {
        setSnippets([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      setSnippets([])
      try {
        const data = await getAllSnippets(workspaceId)
        if (current) setSnippets(data)
      } catch (err) {
        if (!current) return
        if (err instanceof ApiError && err.status === 401) {
          navigate('/login')
        } else if (err instanceof Error) {
          setError(err.message)
        }
      } finally {
        if (current) setLoading(false)
      }
    }

    load()
    return () => { current = false }
  }, [navigate, workspaceId])

  return { snippets, setSnippets, loading, error }
}
