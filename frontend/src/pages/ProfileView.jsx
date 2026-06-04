import { useState, useEffect, useMemo } from 'react'
import StatCard from '../components/StatCard'
import { useUser } from '../hooks/useUser'
import { useToast } from '../hooks/useToast'
import { useCollections } from '../hooks/useCollections'

const TABS = [
  { key: 'profile',     label: 'Profile'      },
  { key: 'security',    label: 'Security'     },
  { key: 'preferences', label: 'Preferences'  },
]

const EMPTY_FORM = { username: '', displayName: '', email: '', bio: '' }
const EMPTY_PW = { currentPassword: '', newPassword: '', confirmPassword: '' }

export default function ProfileView({ snippets = [] }) {
  const { user, loading, error, saveProfile, changePassword, deleteAccount } = useUser()
  const toast = useToast()
  const { collections } = useCollections()

  const stats = useMemo(() => [
    { value: snippets.length,                                                    label: 'Total snippets',  accentColor: '#3d77fc' },
    { value: snippets.filter(s => s.visibility === 'public').length,             label: 'Public snippets', accentColor: '#22c55e' },
    { value: collections.length,                                                  label: 'Collections',     accentColor: '#8c5af3' },
    { value: new Set(snippets.flatMap(s => s.tags || [])).size,                  label: 'Tags used',       accentColor: '#fba528' },
  ], [snippets, collections])

  const [activeTab, setActiveTab] = useState('profile')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [pwForm, setPwForm] = useState(EMPTY_PW)
  const [pwSaving, setPwSaving] = useState(false)

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

  const baseline = user
    ? { username: user.username || '', displayName: user.display_name || '', email: user.email || '', bio: user.bio || '' }
    : null

  const isDirty = baseline !== null && JSON.stringify(form) !== JSON.stringify(baseline)

  const handleChange = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleDiscard = () => {
    if (baseline) setForm(baseline)
  }

  const handleSave = async () => {
    setSaving(true)
    await saveProfile({ username: form.username, display_name: form.displayName, bio: form.bio, email: form.email })
    setSaving(false)
  }

  const handlePwChange = (field) => (e) =>
    setPwForm(prev => ({ ...prev, [field]: e.target.value }))

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }
    setPwSaving(true)
    await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
    setPwSaving(false)
    setPwForm(EMPTY_PW)
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure? This action cannot be undone.')) {
      await deleteAccount()
    }
  }

  const avatarLetter = user ? (user.display_name || user.username || '?')[0].toUpperCase() : '?'
  const pwReady = pwForm.currentPassword && pwForm.newPassword && pwForm.confirmPassword

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#0f0f0f]">
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col min-w-0 p-6 bg-[#0f0f0f]">
        <div className="alert alert-danger" role="alert">
          Failed to load profile: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[#0f0f0f]">
      <div className="flex items-end justify-between px-6 py-3 border-b border-[#2a2a2a] shrink-0">
        <span className="text-lg font-semibold text-white">Profile &amp; Settings</span>
      </div>

      <div className="flex items-end gap-8 px-6 pt-4 border-b border-[#2a2a2a] shrink-0">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="pb-0 flex flex-col items-start transition-colors duration-150 hover:text-white"
          >
            <span className={activeTab === key ? 'text-white text-sm font-medium' : 'text-[#9ba3af] text-sm font-normal'}>
              {label}
            </span>
            {activeTab === key && (
              <div className="h-[2px] bg-[#6366f1] rounded-full mt-2 w-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'profile' ? (
          <div className="flex flex-col lg:flex-row gap-8 px-6 py-6">
            <div className="flex-1 max-w-[480px] flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="relative w-[80px] h-[80px] shrink-0">
                  <div className="w-[80px] h-[80px] rounded-full bg-[#2e2457] flex items-center justify-center">
                    <span className="text-[#6366f1] text-[22px] font-bold">{avatarLetter}</span>
                  </div>
                  <button className="absolute bottom-0 right-0 w-[30px] h-[30px] rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center cursor-pointer hover:bg-[#222] transition-colors duration-150">
                    <span className="text-[#9ba3af] text-[11px]">✏</span>
                  </button>
                </div>

                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-[15px] font-medium text-white">@{user?.username}</span>
                  <span className="text-xs text-[#595e69]">{user?.email}</span>
                  <span className="inline-flex items-center gap-1 bg-[#1a381a] text-[#22c55e] text-[11px] px-2 h-[22px] rounded mt-1">
                    ● Active
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-[#9ba3af] mb-1.5 block">Username</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={handleChange('username')}
                    className="w-full bg-[#222] border border-[#2a2a2a] rounded-md text-[13px] text-white px-3 h-[38px] focus:outline-none focus:border-[#6366f1] transition-colors duration-150"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#9ba3af] mb-1.5 block">Display name</label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={handleChange('displayName')}
                    className="w-full bg-[#222] border border-[#2a2a2a] rounded-md text-[13px] text-white px-3 h-[38px] focus:outline-none focus:border-[#6366f1] transition-colors duration-150"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#9ba3af] mb-1.5 block">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    className="w-full bg-[#222] border border-[#2a2a2a] rounded-md text-[13px] text-white px-3 h-[38px] focus:outline-none focus:border-[#6366f1] transition-colors duration-150"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#9ba3af] mb-1.5 block">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={handleChange('bio')}
                    className="w-full bg-[#222] border border-[#2a2a2a] rounded-md text-[13px] text-white px-3 py-2 h-[80px] resize-none focus:outline-none focus:border-[#6366f1] transition-colors duration-150"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={isDirty && !saving ? handleSave : undefined}
                  disabled={!isDirty || saving}
                  className={`bg-[#6366f1] text-white text-[13px] font-medium px-5 h-[38px] rounded-md transition-colors duration-150 ${
                    isDirty && !saving ? 'hover:bg-indigo-500 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  onClick={handleDiscard}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#9ba3af] hover:bg-[#222] text-[13px] h-[38px] px-4 rounded-md transition-colors duration-150 cursor-pointer"
                >
                  Discard
                </button>
              </div>

              <div className="w-full bg-[#1c0d0d] border border-[#611a1a] rounded-lg px-4 py-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#ef4444] text-[14px] font-medium">⚠ Danger Zone</span>
                </div>
                <p className="text-[#595e69] text-xs mt-1">
                  Permanently delete your account and all associated data.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="bg-[#3d1414] hover:bg-[#4a1a1a] text-[#ef4444] text-[12px] font-medium px-3 h-[34px] rounded-md transition-colors duration-150 mt-3 flex items-center gap-1.5 cursor-pointer"
                >
                  🗑 Delete account
                </button>
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
              <div>
                <label className="text-xs text-[#9ba3af] mb-1.5 block">Current password</label>
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={handlePwChange('currentPassword')}
                  className="w-full bg-[#222] border border-[#2a2a2a] rounded-md text-[13px] text-white px-3 h-[38px] focus:outline-none focus:border-[#6366f1] transition-colors duration-150"
                />
              </div>

              <div>
                <label className="text-xs text-[#9ba3af] mb-1.5 block">New password</label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={handlePwChange('newPassword')}
                  className="w-full bg-[#222] border border-[#2a2a2a] rounded-md text-[13px] text-white px-3 h-[38px] focus:outline-none focus:border-[#6366f1] transition-colors duration-150"
                />
              </div>

              <div>
                <label className="text-xs text-[#9ba3af] mb-1.5 block">Confirm new password</label>
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={handlePwChange('confirmPassword')}
                  className="w-full bg-[#222] border border-[#2a2a2a] rounded-md text-[13px] text-white px-3 h-[38px] focus:outline-none focus:border-[#6366f1] transition-colors duration-150"
                />
              </div>
            </div>

            <button
              onClick={pwReady && !pwSaving ? handlePasswordChange : undefined}
              disabled={!pwReady || pwSaving}
              className={`bg-[#6366f1] text-white text-[13px] font-medium px-5 h-[38px] rounded-md transition-colors duration-150 self-start ${
                pwReady && !pwSaving ? 'hover:bg-indigo-500 cursor-pointer' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {pwSaving ? 'Updating…' : 'Update password'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-[#595e69] text-sm">
            This section is coming soon.
          </div>
        )}
      </div>
    </div>
  )
}
