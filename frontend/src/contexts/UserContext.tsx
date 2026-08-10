import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    getProfile,
    updateProfile,
    changeEmail as apiChangeEmail,
    changePassword as apiChangePassword,
    setPassword as apiSetPassword,
    deleteAccount as apiDeleteAccount,
    type UpdateProfileData,
    type ChangePasswordData,
    type SetPasswordData,
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
    changeEmail: (newEmail: string) => Promise<boolean>
    changePassword: (data: ChangePasswordData) => Promise<void>
    setPassword: (data: SetPasswordData) => Promise<boolean>
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

    const changeEmail = useCallback(async (newEmail: string) => {
        try {
            await apiChangeEmail(newEmail)
            toast.success("If this email is available, a verification link will arrive shortly. If it doesn't, the address may already belong to another account.")
            return true
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) navigate('/login')
            else if (err instanceof Error) toast.error(err.message)
            return false
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

    const setPassword = useCallback(async (data: SetPasswordData) => {
        try {
            await apiSetPassword(data)
            setUser(current => current ? { ...current, has_password: true } : current)
            toast.success('Password created. You can now sign in with email and password.')
            return true
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) navigate('/login')
            else if (err instanceof Error) toast.error(err.message)
            return false
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
        <UserContext.Provider value={{ user, loading, error, saveProfile, changeEmail, changePassword, setPassword, deleteAccount }}>
            {children}
        </UserContext.Provider>
    )
}
