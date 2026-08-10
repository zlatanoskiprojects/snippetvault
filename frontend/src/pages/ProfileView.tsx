import { useState, useEffect, useMemo, type ChangeEvent } from 'react'
import { ArrowLeft, Menu, Pencil, Trash2, TriangleAlert } from 'lucide-react'
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

const TABS = [
  { key: 'profile',     label: 'Profile'      },
  { key: 'security',    label: 'Security'     },
  { key: 'preferences', label: 'Preferences'  },
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

interface ProfileViewProps {
  snippets?: Snippet[]
  onBack?: () => void
  onMenuClick?: () => void
}

export default function ProfileView({ snippets = [], onBack, onMenuClick }: ProfileViewProps) {
  const { user, loading, error, saveProfile, changeEmail, changePassword, setPassword, deleteAccount } = useUser()
  const toast = useToast()
  const { collections } = useCollections()

  const stats = useMemo(() => [
    { value: snippets.length,                                                    label: 'Total snippets',  accentColor: '#3d77fc' },
    { value: snippets.filter(s => s.visibility === 'public').length,             label: 'Public snippets', accentColor: '#22c55e' },
    { value: collections.length,                                                  label: 'Collections',     accentColor: '#8c5af3' },
    { value: new Set(snippets.flatMap(s => s.tags || [])).size,                  label: 'Tags used',       accentColor: '#fba528' },
  ], [snippets, collections])

  const [activeTab, setActiveTab] = useState('profile')
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [pwForm, setPwForm] = useState<PasswordForm>(EMPTY_PW)
  const [pwSaving, setPwSaving] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

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

  const handleChange = (field: keyof ProfileForm) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleDiscard = () => {
    if (baseline) setForm(baseline)
  }

  const handleSave = async () => {
    if (!baseline) return

    const newEmail = form.email.trim().toLowerCase()
    const emailChanged = newEmail !== baseline.email.toLowerCase()
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
        const requested = await changeEmail(newEmail)
        if (requested) {
          setForm(current => ({ ...current, email: baseline.email }))
        }
      }
    } finally {
      setSaving(false)
    }
  }

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
        const created = await setPassword({ newPassword: pwForm.newPassword })
        if (created) setPwForm(EMPTY_PW)
      }
    } finally {
      setPwSaving(false)
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
      <div className="flex flex-1 items-center justify-center bg-[#0f0f0f]">
        <Spinner className="text-white" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col min-w-0 p-6 bg-[#0f0f0f]">
        <Alert>Failed to load profile: {error}</Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[#0f0f0f]">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#2a2a2a] shrink-0">
        {onMenuClick && (
          <Button
            variant="secondary"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="lg:hidden w-[40px] h-[40px] p-0"
          >
            <Menu size={14} />
          </Button>
        )}
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="w-[40px] h-[40px] sm:w-[28px] sm:h-[28px] p-0"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </Button>
        )}
        <span className="text-lg font-semibold text-white">Profile &amp; Settings</span>
      </div>

      <TabsRoot
        value={activeTab}
        onValueChange={value => setActiveTab(value as string)}
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="px-6 pt-4 shrink-0">
          {TABS.map(({ key, label }) => (
            <Tab key={key} value={key}>
              {label}
            </Tab>
          ))}
        </TabsList>

        <Panel value={activeTab} className="flex-1 overflow-y-auto">
        {activeTab === 'profile' ? (
          <div className="flex flex-col lg:flex-row gap-8 px-6 py-6">
            <div className="flex-1 max-w-[480px] flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="relative w-[80px] h-[80px] shrink-0">
                  <div className="w-[80px] h-[80px] rounded-full bg-[#2e2457] flex items-center justify-center">
                    <span className="text-[#6366f1] text-[22px] font-bold">{avatarLetter}</span>
                  </div>
                  <Button
                    variant="secondary"
                    className="absolute bottom-0 right-0 w-[40px] h-[40px] sm:w-[30px] sm:h-[30px] p-0 rounded-full"
                  >
                    <Pencil size={12} />
                  </Button>
                </div>

                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-[15px] font-medium text-white">@{user?.username}</span>
                  <span className="text-xs text-[#595e69]">{user?.email}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Field label="Username">
                  <Input
                    type="text"
                    value={form.username}
                    onChange={handleChange('username')}
                    className="text-[13px]"
                  />
                </Field>

                <Field label="Display name">
                  <Input
                    type="text"
                    value={form.displayName}
                    onChange={handleChange('displayName')}
                    className="text-[13px]"
                  />
                </Field>

                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    className="text-[13px]"
                  />
                </Field>

                <Field label="Bio">
                  <Textarea
                    value={form.bio}
                    onChange={handleChange('bio')}
                    className="text-[13px] h-[80px]"
                  />
                </Field>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={isDirty && !saving ? handleSave : undefined}
                  disabled={!isDirty || saving}
                  className="h-[38px] px-5 text-[13px]"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDiscard}
                  className="h-[38px] px-4 text-[13px]"
                >
                  Discard
                </Button>
              </div>

              <div className="w-full bg-[#1c0d0d] border border-[#611a1a] rounded-lg px-4 py-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[#ef4444] text-[14px] font-medium">
                    <TriangleAlert size={14} /> Danger Zone
                  </span>
                </div>
                <p className="text-[#595e69] text-xs mt-1">
                  Permanently delete your account and all associated data.
                </p>
                <Button
                  variant="danger"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="bg-[#3d1414] hover:bg-[#4a1a1a] text-[12px] h-[34px] px-3 mt-3"
                >
                  <Trash2 size={14} /> Delete account
                </Button>

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
              </div>
            </div>

            <div className="w-full lg:w-[420px] xl:w-[500px] shrink-0 flex flex-col gap-4">
              <div className="text-[15px] font-medium text-white mb-2">Your stats</div>
              <div className="grid grid-cols-2 gap-3">
                {stats.map(stat => (
                  <StatCard
                    key={stat.label}
                    value={stat.value}
                    label={stat.label}
                    accentColor={stat.accentColor}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'security' ? (
          <div className="flex flex-col gap-6 px-6 py-6 max-w-[480px]">
            <div className="flex flex-col gap-4">
              {!user?.has_password && (
                <p className="text-sm text-[#9ba3af] leading-6">
                  Add a password so you can sign in with your email as well as your linked provider.
                </p>
              )}

              {user?.has_password && (
                <Field label="Current password">
                  <Input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={handlePwChange('currentPassword')}
                    className="text-[13px]"
                  />
                </Field>
              )}

              <Field label="New password">
                <Input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={handlePwChange('newPassword')}
                  className="text-[13px]"
                />
              </Field>

              <Field label="Confirm new password">
                <Input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={handlePwChange('confirmPassword')}
                  className="text-[13px]"
                />
              </Field>
            </div>

            <Button
              variant="primary"
              onClick={pwReady && !pwSaving ? handlePasswordSubmit : undefined}
              disabled={!pwReady || pwSaving}
              className="h-[38px] px-5 text-[13px] self-start"
            >
              {pwSaving
                ? user?.has_password ? 'Updating…' : 'Creating…'
                : user?.has_password ? 'Update password' : 'Create password'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-[#595e69] text-sm">
            This section is coming soon.
          </div>
        )}
        </Panel>
      </TabsRoot>
    </div>
  )
}
