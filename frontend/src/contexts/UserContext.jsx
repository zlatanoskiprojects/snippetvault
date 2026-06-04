import { createContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    getProfile,
    updateProfile,
    changePassword as apiChangePassword,
    deleteAccount as apiDeleteAccount,
} from '../api/profile'
import { logout as apiLogout } from '../api/auth'
import { useToast } from '../hooks/useToast'

export const UserContext = createContext(null)

export function UserProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate()
    const toast = useToast()

    const fetchUser = useCallback(async () => {
        try {
            const data = await getProfile()
            setUser(data.user)
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
        fetchUser()
    }, [fetchUser])

    const saveProfile = useCallback(async (data) => {
        try {
            const result = await updateProfile(data)
            setUser(result.user)
            toast.success('Profile updated.')
        } catch (err) {
            if (err.status === 401) navigate('/login')
            else toast.error(err.message)
        }
    }, [navigate, toast])

    const changePassword = useCallback(async (data) => {
        try {
            await apiChangePassword(data)
            await apiLogout()
            navigate('/login')
        } catch (err) {
            if (err.status === 401) navigate('/login')
            else toast.error(err.message)
        }
    }, [navigate, toast])

    const deleteAccount = useCallback(async () => {
        try {
            await apiDeleteAccount()
            navigate('/login')
        } catch (err) {
            if (err.status === 401) navigate('/login')
            else toast.error(err.message)
        }
    }, [navigate, toast])

    return (
        <UserContext.Provider value={{ user, loading, error, saveProfile, changePassword, deleteAccount }}>
            {children}
        </UserContext.Provider>
    )
}
