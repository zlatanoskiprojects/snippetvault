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
    type ChangeEmailData,
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
    changeEmail: (data: ChangeEmailData) => Promise<boolean>
    changePassword: (data: ChangePasswordData) => Promise<void>
    setPassword: (data: SetPasswordData) => Promise<SetPasswordResult>
    deleteAccount: () => Promise<void>
}

export type SetPasswordResult = 'created' | 'reauth-required' | 'failed'

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

    const changeEmail = useCallback(async (data: ChangeEmailData) => {
        try {
            await apiChangeEmail(data)
            toast.success('A confirmation link was sent to your current email address.')
            return true
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) navigate('/login')
            else if (
                err instanceof ApiError &&
                err.status === 403 &&
                err.code === 'REAUTH_REQUIRED'
            ) {
                toast.error(err.method === 'password'
                    ? 'Enter your current password to change your email.'
                    : 'Re-authenticate with a linked provider to change your email.')
            }
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
            return 'created' as const
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) navigate('/login')
            else if (
                err instanceof ApiError &&
                err.status === 403 &&
                err.code === 'REAUTH_REQUIRED' &&
                err.method === 'oauth'
            ) {
                toast.error('Re-authenticate with a linked provider before creating a password.')
                return 'reauth-required' as const
            }
            else if (
                err instanceof ApiError &&
                err.status === 403 &&
                err.message === 'Verify your email before setting a password'
            ) toast.error(err.message)
            else if (err instanceof Error) toast.error(err.message)
            return 'failed' as const
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
