import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    getProfile,
    updateProfile,
    changePassword as apiChangePassword,
    deleteAccount as apiDeleteAccount,
    type UpdateProfileData,
    type ChangePasswordData,
} from '../api/profile'
import { logout as apiLogout } from '../api/auth'
import { useToast } from '../hooks/useToast'
import { ApiError } from '../api/utils'
import type { User } from '../api/types'

export interface UserContextValue {
    user: User | null
    loading: boolean
    error: string | null
    saveProfile: (data: UpdateProfileData) => Promise<void>
    changePassword: (data: ChangePasswordData) => Promise<void>
    deleteAccount: () => Promise<void>
}

export const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()
    const toast = useToast()

    const fetchUser = useCallback(async () => {
        try {
            const data = await getProfile()
            setUser(data.user)
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
        fetchUser()
    }, [fetchUser])

    const saveProfile = useCallback(async (data: UpdateProfileData) => {
        try {
            const result = await updateProfile(data)
            setUser(result.user)
            toast.success('Profile updated.')
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) navigate('/login')
            else if (err instanceof Error) toast.error(err.message)
        }
    }, [navigate, toast])

    const changePassword = useCallback(async (data: ChangePasswordData) => {
        try {
            await apiChangePassword(data)
            await apiLogout()
            navigate('/login')
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) navigate('/login')
            else if (err instanceof Error) toast.error(err.message)
        }
    }, [navigate, toast])

    const deleteAccount = useCallback(async () => {
        try {
            await apiDeleteAccount()
            navigate('/login')
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) navigate('/login')
            else if (err instanceof Error) toast.error(err.message)
        }
    }, [navigate, toast])

    return (
        <UserContext.Provider value={{ user, loading, error, saveProfile, changePassword, deleteAccount }}>
            {children}
        </UserContext.Provider>
    )
}
