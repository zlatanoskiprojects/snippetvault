import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAllCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../api/collections'
import { useToast } from './useToast'

export function useCollections() {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()

  const fetchCollections = useCallback(async () => {
    try {
      const data = await getAllCollections()
      setCollections(data)
    } catch (err) {
      if (err.status === 401) {
        navigate('/login')
      } else {
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

  const addCollection = useCallback(async (data) => {
    try {
      await createCollection(data)
      await fetchCollections()
      toast.success('Collection created.')
    } catch (err) {
      if (err.status === 401) navigate('/login')
      else toast.error(err.message)
    }
  }, [fetchCollections, navigate, toast])

  const editCollection = useCallback(async (id, data) => {
    try {
      await updateCollection(id, data)
      await fetchCollections()
      toast.success('Collection updated.')
    } catch (err) {
      if (err.status === 401) navigate('/login')
      else toast.error(err.message)
    }
  }, [fetchCollections, navigate, toast])

  const removeCollection = useCallback(async (id) => {
    try {
      await deleteCollection(id)
      await fetchCollections()
      toast.success('Collection deleted.')
    } catch (err) {
      if (err.status === 401) navigate('/login')
      else toast.error(err.message)
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