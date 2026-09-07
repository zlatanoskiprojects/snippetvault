import { useState, useEffect, useMemo, useRef, type ChangeEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, Menu, Pencil, ShieldCheck, SlidersHorizontal, Trash2, TriangleAlert, UserRound } from 'lucide-react'
import StatCard from '../components/StatCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Field from '../components/ui/Field'
import ConfirmDialog from '../components/ui/AlertDialog'
import { TabsRoot, TabsList, Tab, Panel } from '../components/ui/Tabs'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import { useUser } from '../hooks/useUser'
import { useToast } from '../hooks/useToast'
import { useCollections } from '../hooks/useCollections'
import type { Snippet } from '../api/types'
import { socialLogin } from '../api/auth'

const TABS = [
  { key: 'profile',     label: 'Profile',     icon: UserRound            },
  { key: 'security',    label: 'Security',    icon: ShieldCheck          },
  { key: 'preferences', label: 'Preferences', icon: SlidersHorizontal   },
]

interface ProfileForm {
  username: string
  displayName: string
  email: string
  bio: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const EMPTY_FORM: ProfileForm = { username: '', displayName: '', email: '', bio: '' }
const EMPTY_PW: PasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' }
const EMAIL_CHANGE_REAUTH_KEY = 'snippetvault.email-change-reauth'
const EMAIL_CHANGE_REAUTH_MAX_AGE = 10 * 60 * 1000
const PASSWORD_SETUP_REAUTH_KEY = 'snippetvault.password-setup-reauth'
const PASSWORD_SETUP_REAUTH_MAX_AGE = 10 * 60 * 1000

interface ProfileViewProps {
  snippets?: Snippet[]
  onBack?: () => void
  onMenuClick?: () => void
}

export default function ProfileView({ snippets = [], onBack, onMenuClick }: ProfileViewProps) {
  const { user, loading, error, saveProfile, changeEmail, changePassword, setPassword, deleteAccount } = useUser()
  const toast = useToast()
  const { collections } = useCollections()
  const [searchParams, setSearchParams] = useSearchParams()

  const stats = useMemo(() => [
    { value: snippets.length,                                                    label: 'Total snippets',  accentColor: 'var(--color-category-blue)' },
    { value: snippets.filter(s => s.visibility === 'public').length,             label: 'Public snippets', accentColor: 'var(--color-category-green)' },
    { value: collections.length,                                                  label: 'Collections',     accentColor: 'var(--color-category-purple)' },
    { value: new Set(snippets.flatMap(s => s.tags || [])).size,                  label: 'Tags used',       accentColor: 'var(--color-category-orange)' },
  ], [snippets, collections])

  const [activeTab, setActiveTab] = useState(
    searchParams.get('reauth') === 'password-setup' ||
      searchParams.get('setup') === 'password'
      ? 'security'
      : 'profile'
  )
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('')
  const [oauthReauthing, setOauthReauthing] = useState(false)
  const [pwForm, setPwForm] = useState<PasswordForm>(EMPTY_PW)
  const [pwSaving, setPwSaving] = useState(false)
  const [passwordReauthRequired, setPasswordReauthRequired] = useState(false)
  const [passwordOauthReauthing, setPasswordOauthReauthing] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const emailRetryStarted = useRef(false)
  const passwordRetryStarted = useRef(false)

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        displayName: user.display_name || '',
        email: user.email || '',
        bio: user.bio || '',
      })
    }
  }, [user])

  const baseline: ProfileForm | null = user
    ? { username: user.username || '', displayName: user.display_name || '', email: user.email || '', bio: user.bio || '' }
    : null

  const isDirty = baseline !== null && JSON.stringify(form) !== JSON.stringify(baseline)
  const emailChanged = baseline !== null &&
    form.email.trim().toLowerCase() !== baseline.email.toLowerCase()

  const handleChange = (field: keyof ProfileForm) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleDiscard = () => {
    if (baseline) setForm(baseline)
    setEmailCurrentPassword('')
  }

  const handleSave = async () => {
    if (!baseline) return

    const newEmail = form.email.trim().toLowerCase()
    const profileChanged =
      form.username !== baseline.username ||
      form.displayName !== baseline.displayName ||
      form.bio !== baseline.bio

    setSaving(true)
    try {
      if (profileChanged) {
        await saveProfile({ username: form.username, display_name: form.displayName, bio: form.bio })
      }
      if (emailChanged) {
        if (!user?.has_password) {
          toast.error('Re-authenticate with a linked provider to change your email.')
          return
        }
        if (!emailCurrentPassword) {
          toast.error('Enter your current password to change your email.')
          return
        }
        const requested = await changeEmail({
          newEmail,
          currentPassword: emailCurrentPassword,
        })
        if (requested) {
          setForm(current => ({ ...current, email: baseline.email }))
          setEmailCurrentPassword('')
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEmailOAuthReauth = async (provider: 'google' | 'github') => {
    if (!user || !emailChanged) return

    const newEmail = form.email.trim().toLowerCase()
    sessionStorage.setItem(EMAIL_CHANGE_REAUTH_KEY, JSON.stringify({
      userId: user.id,
      newEmail,
      createdAt: Date.now(),
    }))

    setOauthReauthing(true)
    try {
      await socialLogin(
        provider,
        `${window.location.origin}/dashboard?reauth=email-change`,
      )
    } catch (err) {
      sessionStorage.removeItem(EMAIL_CHANGE_REAUTH_KEY)
      setOauthReauthing(false)
      toast.error(err instanceof Error ? err.message : 'Re-authentication failed.')
    }
  }

  useEffect(() => {
    if (
      searchParams.get('reauth') !== 'email-change' ||
      !user ||
      emailRetryStarted.current
    ) return

    emailRetryStarted.current = true
    const clearReauthState = () => {
      sessionStorage.removeItem(EMAIL_CHANGE_REAUTH_KEY)
      const next = new URLSearchParams(searchParams)
      next.delete('reauth')
      setSearchParams(next, { replace: true })
    }

    let pending: { userId: number; newEmail: string; createdAt: number } | null = null
    try {
      const value = sessionStorage.getItem(EMAIL_CHANGE_REAUTH_KEY)
      pending = value ? JSON.parse(value) : null
    } catch {
      pending = null
    }

    const markerAge = pending && typeof pending.createdAt === 'number'
      ? Date.now() - pending.createdAt
      : Number.NaN
    if (
      !pending ||
      typeof pending.userId !== 'number' ||
      typeof pending.newEmail !== 'string' ||
      pending.userId !== user.id ||
      !Number.isFinite(markerAge) ||
      markerAge < 0 ||
      markerAge > EMAIL_CHANGE_REAUTH_MAX_AGE
    ) {
      clearReauthState()
      toast.error('OAuth re-authentication could not be matched to this account. Try again.')
      return
    }

    setSaving(true)
    void changeEmail({ newEmail: pending.newEmail })
      .then((requested) => {
        if (requested) {
          setForm(current => ({ ...current, email: user.email }))
        }
      })
      .finally(() => {
        clearReauthState()
        setSaving(false)
        setOauthReauthing(false)
      })
  }, [changeEmail, searchParams, setSearchParams, toast, user])

  useEffect(() => {
    if (
      searchParams.get('reauth') !== 'password-setup' ||
      !user ||
      passwordRetryStarted.current
    ) return

    passwordRetryStarted.current = true
    const clearReauthState = () => {
      sessionStorage.removeItem(PASSWORD_SETUP_REAUTH_KEY)
      const next = new URLSearchParams(searchParams)
      next.delete('reauth')
      setSearchParams(next, { replace: true })
    }

    let pending: { userId: number; createdAt: number } | null = null
    try {
      const value = sessionStorage.getItem(PASSWORD_SETUP_REAUTH_KEY)
      pending = value ? JSON.parse(value) : null
    } catch {
      pending = null
    }

    setActiveTab('security')
    const markerAge = pending && typeof pending.createdAt === 'number'
      ? Date.now() - pending.createdAt
      : Number.NaN
    if (
      !pending ||
      typeof pending.userId !== 'number' ||
      pending.userId !== user.id ||
      !Number.isFinite(markerAge) ||
      markerAge < 0 ||
      markerAge > PASSWORD_SETUP_REAUTH_MAX_AGE
    ) {
      clearReauthState()
      toast.error('OAuth re-authentication could not be matched to this account. Try again.')
      return
    }

    clearReauthState()
    setPasswordReauthRequired(false)
    setPasswordOauthReauthing(false)
    toast.success('Re-authentication complete. Enter your new password again.')
  }, [searchParams, setSearchParams, toast, user])

  const handlePwChange = (field: keyof PasswordForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setPwForm(prev => ({ ...prev, [field]: e.target.value }))

  const handlePasswordSubmit = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }
    if (pwForm.newPassword.trim().length < 8) {
      toast.error('New password must be at least 8 characters.')
      return
    }
    setPwSaving(true)
    try {
      if (user?.has_password) {
        await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
        setPwForm(EMPTY_PW)
      } else {
        const result = await setPassword({ newPassword: pwForm.newPassword })
        if (result === 'created') {
          setPwForm(EMPTY_PW)
          setPasswordReauthRequired(false)
          const next = new URLSearchParams(searchParams)
          next.delete('setup')
          setSearchParams(next, { replace: true })
        } else if (result === 'reauth-required') {
          setPwForm(EMPTY_PW)
          setPasswordReauthRequired(true)
        }
      }
    } finally {
      setPwSaving(false)
    }
  }

  const handlePasswordOAuthReauth = async (provider: 'google' | 'github') => {
    if (!user || user.has_password) return

    sessionStorage.setItem(PASSWORD_SETUP_REAUTH_KEY, JSON.stringify({
      userId: user.id,
      createdAt: Date.now(),
    }))
    setPwForm(EMPTY_PW)
    setPasswordOauthReauthing(true)

    try {
      await socialLogin(
        provider,
        `${window.location.origin}/dashboard?reauth=password-setup`,
      )
    } catch (err) {
      sessionStorage.removeItem(PASSWORD_SETUP_REAUTH_KEY)
      setPasswordOauthReauthing(false)
      toast.error(err instanceof Error ? err.message : 'Re-authentication failed.')
    }
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    try {
      await deleteAccount()
    } finally {
      setDeletingAccount(false)
      setDeleteConfirmOpen(false)
    }
  }

  const avatarLetter = user ? (user.display_name || user.username || '?')[0].toUpperCase() : '?'
  const pwReady = Boolean(
    (!user?.has_password || pwForm.currentPassword) &&
    pwForm.newPassword &&
    pwForm.confirmPassword
  )

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-app">
        <Spinner className="text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col min-w-0 p-6 bg-app">
        <Alert>Failed to load profile: {error}</Alert>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-app lg:m-2 lg:rounded-[14px] lg:border lg:border-border-default lg:shadow-sm lg:shadow-overlay/5">
      <header className="shrink-0 px-4 pb-4 pt-3 sm:px-6 lg:px-5 lg:pb-2">
        <div className="flex min-h-10 items-center gap-2">
          {onMenuClick && (
            <Button
              variant="secondary"
              onClick={onMenuClick}
              aria-label="Open menu"
              className="h-10 w-10 p-0 lg:hidden"
            >
              <Menu size={14} />
            </Button>
          )}
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="gap-1.5 px-2 text-[13px]">
              <ArrowLeft size={15} />
              Back to workspace
            </Button>
          )}
        </div>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-primary sm:text-2xl">Profile &amp; Settings</h1>
      </header>

      <TabsRoot
        value={activeTab}
        onValueChange={value => setActiveTab(value as string)}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 lg:px-5 lg:pt-3 xl:gap-16">
          <aside className="min-w-0 lg:sticky lg:top-0 lg:self-start">
            <div className="flex min-w-0 items-center gap-3 py-2 lg:px-2 lg:py-4">
              <div className="relative shrink-0">
                <div className="flex size-14 items-center justify-center rounded-full bg-avatar">
                  <span className="text-lg font-bold text-accent">{avatarLetter}</span>
                </div>
                <Button
                  variant="secondary"
                  aria-label="Edit profile picture"
                  className="absolute -bottom-1 -right-1 size-7 rounded-full p-0"
                >
                  <Pencil size={11} />
                </Button>
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-primary">@{user?.username}</div>
                <div className="mt-0.5 truncate text-xs text-muted">{user?.email}</div>
              </div>
            </div>

            <TabsList className="mt-3 flex items-stretch gap-1 overflow-x-auto border-0 pb-1 lg:mt-4 lg:flex-col lg:overflow-visible lg:pb-0 [&_[data-slot=tabs-indicator]]:hidden">
              {TABS.map(({ key, label, icon: Icon }) => (
                <Tab
                  key={key}
                  value={key}
                  className="h-9 shrink-0 justify-start gap-2 rounded-lg px-3 text-[13px] data-[active]:bg-surface-selected data-[active]:text-primary sm:h-9 lg:w-full"
                >
                  <Icon size={15} />
                  {label}
                </Tab>
              ))}
            </TabsList>
          </aside>

          <Panel value={activeTab} className="min-w-0">
            {activeTab === 'profile' ? (
              <div className="flex w-full max-w-4xl flex-col gap-8">
                <section>
                  <h2 className="text-lg font-semibold text-primary">Personal information</h2>
                  <p className="mt-1 text-sm text-muted">Manage your personal details and account information.</p>

                  <div className="mt-5 overflow-hidden rounded-2xl border border-border-default bg-surface">
                    <div className="divide-y divide-border-default">
                      <Field label="Username" className="gap-3 p-4 sm:grid sm:grid-cols-[minmax(8rem,1fr)_minmax(14rem,20rem)] sm:items-center">
                        <Input
                          type="text"
                          value={form.username}
                          onChange={handleChange('username')}
                          className="text-[13px]"
                        />
                      </Field>

                      <Field label="Display name" className="gap-3 p-4 sm:grid sm:grid-cols-[minmax(8rem,1fr)_minmax(14rem,20rem)] sm:items-center">
                        <Input
                          type="text"
                          value={form.displayName}
                          onChange={handleChange('displayName')}
                          className="text-[13px]"
                        />
                      </Field>

                      <Field label="Email" className="gap-3 p-4 sm:grid sm:grid-cols-[minmax(8rem,1fr)_minmax(14rem,20rem)] sm:items-center">
                        <Input
                          type="email"
                          value={form.email}
                          onChange={handleChange('email')}
                          className="text-[13px]"
                        />
                      </Field>

                      {emailChanged && user?.has_password && (
                        <Field label="Current password" className="gap-3 p-4 sm:grid sm:grid-cols-[minmax(8rem,1fr)_minmax(14rem,20rem)] sm:items-center">
                          <Input
                            type="password"
                            value={emailCurrentPassword}
                            onChange={event => setEmailCurrentPassword(event.target.value)}
                            placeholder="Required to change your email"
                            className="text-[13px]"
                          />
                        </Field>
                      )}

                      {emailChanged && !user?.has_password && (
                        <div className="p-4">
                          <div className="flex flex-col gap-2 rounded-lg border border-border-default bg-surface-muted p-3">
                            <p className="text-xs text-secondary">
                              Re-authenticate with a linked provider to continue.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {user?.oauth_providers.map(provider => (
                                <Button
                                  key={provider}
                                  variant="secondary"
                                  onClick={() => handleEmailOAuthReauth(provider)}
                                  disabled={oauthReauthing}
                                  className="px-3 text-[12px] capitalize"
                                >
                                  Continue with {provider}
                                </Button>
                              ))}
                            </div>
                            {user?.oauth_providers.length === 0 && (
                              <p className="text-xs text-danger">
                                No linked OAuth provider is available for re-authentication.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <Field label="Bio" className="gap-3 p-4 sm:grid sm:grid-cols-[minmax(8rem,1fr)_minmax(14rem,20rem)] sm:items-start sm:[&_[data-slot=field-label]]:pt-2.5">
                        <Textarea
                          value={form.bio}
                          onChange={handleChange('bio')}
                          className="h-20 text-[13px] sm:h-20"
                        />
                      </Field>
                    </div>

                    <div className="flex flex-col-reverse gap-2 border-t border-border-default bg-surface-muted px-4 py-3 sm:flex-row sm:justify-end">
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={handleDiscard}
                        className="px-4 text-[13px]"
                      >
                        Discard
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={isDirty && !saving ? handleSave : undefined}
                        disabled={!isDirty || saving}
                        className="min-w-32 text-[13px]"
                      >
                        {saving ? 'Saving…' : 'Save changes'}
                      </Button>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 text-sm font-medium text-danger">
                    <TriangleAlert size={14} />
                    <h2>Danger Zone</h2>
                  </div>
                  <p className="mt-1 text-xs text-muted">Manage permanent actions that affect your account.</p>
                  <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-danger-zone-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-primary">Delete account</div>
                      <p className="mt-1 text-xs text-muted">Permanently delete your account and all associated data.</p>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="shrink-0 bg-danger-action px-3 text-[12px] hover:bg-danger-action-hover"
                    >
                      <Trash2 size={14} /> Delete account
                    </Button>
                  </div>

                  <ConfirmDialog
                    open={deleteConfirmOpen}
                    onOpenChange={setDeleteConfirmOpen}
                    title="Delete account"
                    description="Are you sure? This action cannot be undone."
                    confirmLabel={deletingAccount ? 'Deleting…' : 'Delete account'}
                    danger
                    confirming={deletingAccount}
                    onConfirm={handleDeleteAccount}
                  />
                </section>

                <section>
                  <h2 className="text-[15px] font-medium text-primary">Your stats</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {stats.map(stat => (
                      <StatCard
                        key={stat.label}
                        value={stat.value}
                        label={stat.label}
                        accentColor={stat.accentColor}
                      />
                    ))}
                  </div>
                </section>
              </div>
            ) : activeTab === 'security' ? (
              <div className="flex w-full max-w-4xl flex-col">
                <h2 className="text-lg font-semibold text-primary">Security</h2>
                <p className="mt-1 text-sm text-muted">Manage how you sign in to your account.</p>

                <div className="mt-5 overflow-hidden rounded-2xl border border-border-default bg-surface">
                  {!user?.has_password && (
                    <p className="border-b border-border-default p-4 text-sm leading-6 text-secondary">
                      Create a password to finish setting up your account and enable email sign-in.
                    </p>
                  )}

                  {user && !user.has_password && passwordReauthRequired && (
                    <div className="border-b border-border-default p-4">
                      <div className="flex flex-col gap-2 rounded-lg border border-border-default bg-surface-muted p-3">
                        <p className="text-xs text-secondary">
                          Your session is older than five minutes. Re-authenticate with a linked provider,
                          then enter the new password again.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {user.oauth_providers.map(provider => (
                            <Button
                              key={provider}
                              variant="secondary"
                              onClick={() => handlePasswordOAuthReauth(provider)}
                              disabled={passwordOauthReauthing}
                              className="px-3 text-[12px] capitalize"
                            >
                              Continue with {provider}
                            </Button>
                          ))}
                        </div>
                        {user.oauth_providers.length === 0 && (
                          <p className="text-xs text-danger">
                            No linked OAuth provider is available for re-authentication.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-border-default">
                    {user?.has_password && (
                      <Field label="Current password" className="gap-3 p-4 sm:grid sm:grid-cols-[minmax(8rem,1fr)_minmax(14rem,20rem)] sm:items-center">
                        <Input
                          type="password"
                          value={pwForm.currentPassword}
                          onChange={handlePwChange('currentPassword')}
                          className="text-[13px]"
                        />
                      </Field>
                    )}

                    <Field label="New password" className="gap-3 p-4 sm:grid sm:grid-cols-[minmax(8rem,1fr)_minmax(14rem,20rem)] sm:items-center">
                      <Input
                        type="password"
                        value={pwForm.newPassword}
                        onChange={handlePwChange('newPassword')}
                        className="text-[13px]"
                      />
                    </Field>

                    <Field label="Confirm new password" className="gap-3 p-4 sm:grid sm:grid-cols-[minmax(8rem,1fr)_minmax(14rem,20rem)] sm:items-center">
                      <Input
                        type="password"
                        value={pwForm.confirmPassword}
                        onChange={handlePwChange('confirmPassword')}
                        className="text-[13px]"
                      />
                    </Field>
                  </div>

                  <div className="flex border-t border-border-default bg-surface-muted px-4 py-3 sm:justify-end">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={pwReady && !pwSaving ? handlePasswordSubmit : undefined}
                      disabled={!pwReady || pwSaving}
                      className="w-full text-[13px] sm:w-auto"
                    >
                      {pwSaving
                        ? user?.has_password ? 'Updating…' : 'Creating…'
                        : user?.has_password ? 'Update password' : 'Create password'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex w-full max-w-4xl flex-col">
                <h2 className="text-lg font-semibold text-primary">Preferences</h2>
                <div className="flex h-48 items-center justify-center text-sm text-muted">
                  This section is coming soon.
                </div>
              </div>
            )}
          </Panel>
        </div>
      </TabsRoot>
    </div>
  )
}
