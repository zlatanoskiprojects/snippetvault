import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  type ProjectInput,
} from '../api/projects'
import { useToast } from './useToast'
import { ApiError } from '../api/utils'
import type { Project } from '../api/types'

export function useProjects(workspaceId: number | null) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const toast = useToast()
  const requestId = useRef(0)
  const selectedWorkspaceId = useRef(workspaceId)
  selectedWorkspaceId.current = workspaceId

  const fetchProjects = useCallback(async () => {
    const currentRequest = ++requestId.current
    if (workspaceId === null) {
      setProjects([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getAllProjects(workspaceId)
      if (currentRequest === requestId.current && selectedWorkspaceId.current === workspaceId) setProjects(data)
    } catch (err) {
      if (currentRequest !== requestId.current) return
      if (err instanceof ApiError && err.status === 401) {
        navigate('/login')
      } else if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      if (currentRequest === requestId.current && selectedWorkspaceId.current === workspaceId) setLoading(false)
    }
  }, [navigate, workspaceId])

  useEffect(() => {
    setProjects([])
    async function load() {
      await fetchProjects()
    }
    load()
  }, [fetchProjects])

  const addProject = useCallback(async (data: ProjectInput) => {
    if (workspaceId === null) return
    try {
      await createProject(workspaceId, data)
      if (selectedWorkspaceId.current !== workspaceId) return
      await fetchProjects()
      toast.success('Project created.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/login')
    }
  }, [fetchProjects, navigate, toast, workspaceId])

  const editProject = useCallback(async (id: number | string, data: Partial<ProjectInput>) => {
    if (workspaceId === null) return
    try {
      await updateProject(id, data)
      if (selectedWorkspaceId.current !== workspaceId) return
      await fetchProjects()
      toast.success('Project updated.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/login')
    }
  }, [fetchProjects, navigate, toast, workspaceId])

  const removeProject = useCallback(async (id: number | string) => {
    if (workspaceId === null) return
    try {
      await deleteProject(id)
      if (selectedWorkspaceId.current !== workspaceId) return
      await fetchProjects()
      toast.success('Project deleted.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/login')
    }
  }, [fetchProjects, navigate, toast, workspaceId])

  return {
    projects,
    loading,
    error,
    addProject,
    editProject,
    removeProject,
  }
}
