import { useState, useEffect, useCallback } from 'react'
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

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const toast = useToast()

  const fetchProjects = useCallback(async () => {
    try {
      const data = await getAllProjects()
      setProjects(data)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/login')
      } else if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    async function load() {
      await fetchProjects()
    }
    load()
  }, [fetchProjects])

  const addProject = useCallback(async (data: ProjectInput) => {
    try {
      await createProject(data)
      await fetchProjects()
      toast.success('Project created.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/login')
    }
  }, [fetchProjects, navigate, toast])

  const editProject = useCallback(async (id: number | string, data: Partial<ProjectInput>) => {
    try {
      await updateProject(id, data)
      await fetchProjects()
      toast.success('Project updated.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/login')
    }
  }, [fetchProjects, navigate, toast])

  const removeProject = useCallback(async (id: number | string) => {
    try {
      await deleteProject(id)
      await fetchProjects()
      toast.success('Project deleted.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/login')
    }
  }, [fetchProjects, navigate, toast])

  return {
    projects,
    loading,
    error,
    addProject,
    editProject,
    removeProject,
  }
}
