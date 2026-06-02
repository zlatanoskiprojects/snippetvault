import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllSnippets } from '../api/snippets'

export function useSnippets() {
  const [snippets, setSnippets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await getAllSnippets()
        if (!cancelled) setSnippets(data)
      } catch (err) {
        if (cancelled) return
        if (err.status === 401) {
          navigate('/login')
        } else {
          setError(err.message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [navigate])

  return { snippets, setSnippets, loading, error }
}