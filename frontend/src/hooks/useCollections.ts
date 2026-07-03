import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAllCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  type CollectionInput,
} from '../api/collections'
import { useToast } from './useToast'
import { ApiError } from '../api/utils'
import type { Collection } from '../api/types'

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const toast = useToast()

  const fetchCollections = useCallback(async () => {
    try {
      const data = await getAllCollections()
      setCollections(data)
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
      await fetchCollections()
    }
    load()
  }, [fetchCollections])

  const addCollection = useCallback(async (data: CollectionInput) => {
    try {
      await createCollection(data)
      await fetchCollections()
      toast.success('Collection created.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/login')
      else if (err instanceof Error) toast.error(err.message)
    }
  }, [fetchCollections, navigate, toast])

  const editCollection = useCallback(async (id: number | string, data: Partial<CollectionInput>) => {
    try {
      await updateCollection(id, data)
      await fetchCollections()
      toast.success('Collection updated.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/login')
      else if (err instanceof Error) toast.error(err.message)
    }
  }, [fetchCollections, navigate, toast])

  const removeCollection = useCallback(async (id: number | string) => {
    try {
      await deleteCollection(id)
      await fetchCollections()
      toast.success('Collection deleted.')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/login')
      else if (err instanceof Error) toast.error(err.message)
    }
  }, [fetchCollections, navigate, toast])

  return {
    collections,
    loading,
    error,
    addCollection,
    editCollection,
    removeCollection,
  }
}
