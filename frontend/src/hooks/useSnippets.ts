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

export function useSnippets(): UseSnippetsResult {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllSnippets()
        setSnippets(data)
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate('/login')
        } else if (err instanceof Error) {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [navigate])

  return { snippets, setSnippets, loading, error }
}
