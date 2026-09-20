import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createWorkspace, getAllWorkspaces } from '../api/workspaces'
import type { Workspace } from '../api/types'
import { ApiError } from '../api/utils'

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    getAllWorkspaces()
      .then(setWorkspaces)
      .catch(err => {
        if (err instanceof ApiError && err.status === 401) navigate('/login')
        else setError(err instanceof Error ? err.message : 'Could not load workspaces')
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const addWorkspace = useCallback(async (name: string) => {
    const created = await createWorkspace(name)
    setWorkspaces(current => [...current, created])
    return created
  }, [])

  return { workspaces, setWorkspaces, loading, error, addWorkspace }
}
