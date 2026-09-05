import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import SnippetList from '../components/SnippetList'
import NewSnippet from './NewSnippet'
import SearchView from './SearchView'
import CollectionsView from './CollectionsView'
import SnippetDetailPanel from './SnippetDetailPanel'
import ProfileView from './ProfileView'
import { useSnippets } from '../hooks/useSnippets'
import { deleteSnippet } from '../api/snippets'
import { useToast } from '../hooks/useToast'
import { UserProvider } from '../contexts/UserContext'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import type { Snippet } from '../api/types'
import type { Collection } from '../api/types'

type View = 'list' | 'new' | 'search' | 'collections' | 'profile'

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<View>(
    searchParams.get('reauth') === 'email-change' ||
      searchParams.get('reauth') === 'password-setup' ||
      searchParams.get('setup') === 'password'
      ? 'profile'
      : 'list'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const { snippets, setSnippets, loading, error } = useSnippets()
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    if (searchParams.get('emailChange') !== 'old-confirmed') return

    toast.success('Current email confirmed. Check your new email for the verification link.')
    const next = new URLSearchParams(searchParams)
    next.delete('emailChange')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, toast])

  function onSelectSnippet(snippet: Snippet) {
    setSelectedSnippet(prev => prev?.id === snippet.id ? null : snippet)
  }

  function onCloseDetail() {
    setSelectedSnippet(null)
  }

  function onEdit(snippet: Snippet) {
    setEditingSnippet(snippet)
    setView('new')
  }

  async function onDelete(id: number) {
    try {
      await deleteSnippet(id)
      setSnippets(prev => prev.filter(s => s.id !== id))
      if (selectedSnippet?.id === id) setSelectedSnippet(null)
      toast.success('Snippet deleted.')
    } catch {
      return
    }
  }

  function onSaved(saved: Snippet) {
    setSnippets(prev => {
      const exists = prev.some(s => s.id === saved.id)
      if (exists) return prev.map(s => s.id === saved.id ? saved : s)
      return [saved, ...prev]
    })
    if (selectedSnippet?.id === saved.id) setSelectedSnippet(saved)
    setEditingSnippet(null)
    setView('list')
  }

  function onRestore(updated: Snippet) {
    setSnippets(prev => prev.map(s => s.id === updated.id ? updated : s))
    setSelectedSnippet(updated)
    toast.success('Version restored.')
  }

  function onUpdateSnippet(updated: Snippet) {
    setSnippets(prev => prev.map(s => s.id === updated.id ? updated : s))
    setSelectedSnippet(updated)
  }

  function onCancelForm() {
    setEditingSnippet(null)
    setView('list')
  }

  function handleSelectCollection(collection: Collection) {
    setActiveCollection(collection)
    setActiveTag(null)
    setSelectedSnippet(null)
    setView('list')
  }

  function exitSearch() {
    setSearchQuery('')
    setIsSearching(false)
  }

  function handleViewChange(v: string) {
    exitSearch()
    if (v !== 'list') {
      setActiveTag(null)
      setActiveCollection(null)
    }
    setView(v as View)
  }

  function handleClearCollection() {
    setActiveCollection(null)
    setSelectedSnippet(null)
  }

  function handleSelectTag(tag: string) {
    exitSearch()
    setActiveTag(tag)
    setActiveCollection(null)
    setSelectedSnippet(null)
    setView('list')
  }

  function handleClearTag() {
    setActiveTag(null)
    setSelectedSnippet(null)
  }

  return (
    <UserProvider>
    <div className="flex h-dvh bg-app text-primary overflow-hidden">
      <div className="hidden lg:flex">
        <Sidebar
          snippets={snippets}
          searchQuery={searchQuery}
          onSearchChange={q => { setSearchQuery(q); if (q) setIsSearching(true) }}
          onSearchFocus={() => setIsSearching(true)}
          onSearchBlur={() => setIsSearching(false)}
          isSearchActive={isSearching}
          activeView={view}
          onViewChange={handleViewChange}
          activeTag={activeTag}
          onTagChange={handleSelectTag}
        />
      </div>

      <BaseDialog.Root open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <BaseDialog.Portal>
          <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-overlay/50 lg:hidden transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
          <BaseDialog.Popup className="fixed left-0 top-0 z-40 h-full lg:hidden outline-none transition-transform duration-150 data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full">
            <Sidebar
              snippets={snippets}
              activeView={view}
              onViewChange={v => { handleViewChange(v); setSidebarOpen(false) }}
              activeTag={activeTag}
              onTagChange={tag => { handleSelectTag(tag); setSidebarOpen(false) }}
            />
          </BaseDialog.Popup>
        </BaseDialog.Portal>
      </BaseDialog.Root>

      <div className="flex flex-1 min-w-0 overflow-hidden">
        {isSearching || searchQuery ? (
          <SearchView
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onClose={() => { setSearchQuery(''); setIsSearching(false) }}
            onSelectSnippet={(snippet: Snippet) => { setSearchQuery(''); setIsSearching(false); onSelectSnippet(snippet) }}
          />
        ) : view === 'profile' ? (
          <ProfileView snippets={snippets} onBack={() => handleViewChange('list')} onMenuClick={() => setSidebarOpen(true)} />
        ) : view === 'collections' ? (
          <CollectionsView onSelectCollection={handleSelectCollection} onMenuClick={() => setSidebarOpen(true)} />
        ) : view === 'list' ? (() => {
          const displayedSnippets = snippets
            .filter(s => !activeCollection || s.collection_id === activeCollection.id)
            .filter(s => !activeTag || (s.tags || []).includes(activeTag))
          return loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner className="text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col min-w-0 p-6">
              <Alert>Failed to load snippets: {error}</Alert>
            </div>
          ) : selectedSnippet ? (
            <>
              <div className="flex-1 min-w-0 overflow-y-auto border-r border-border-default">
                <SnippetList
                  snippets={displayedSnippets}
                  selectedSnippetId={selectedSnippet.id}
                  onSelectSnippet={onSelectSnippet}
                />
              </div>

              <div className="hidden lg:flex w-[44%] lg:w-[520px] xl:w-[656px] shrink-0 flex-col bg-panel">
                <SnippetDetailPanel
                  key={selectedSnippet.id}
                  snippet={selectedSnippet}
                  onClose={onCloseDetail}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  onUpdate={onUpdateSnippet}
                />
              </div>

              <div className="fixed inset-0 z-40 bg-panel flex flex-col lg:hidden">
                <SnippetDetailPanel
                  key={selectedSnippet.id}
                  snippet={selectedSnippet}
                  onClose={onCloseDetail}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  onUpdate={onUpdateSnippet}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
              <TopBar
                snippetCount={displayedSnippets.length}
                title={activeCollection ? activeCollection.name : activeTag ? `#${activeTag}` : 'All snippets'}
                onBack={activeCollection ? handleClearCollection : activeTag ? handleClearTag : undefined}
                onMenuClick={() => setSidebarOpen(true)}
                onSearch={() => setIsSearching(true)}
                onNewSnippet={() => setView('new')}
              />
              <div className="flex-1 overflow-y-auto">
                <SnippetList
                  snippets={displayedSnippets}
                  selectedSnippetId={null}
                  onSelectSnippet={onSelectSnippet}
                />
              </div>
            </div>
          )
        })() : (
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            <NewSnippet
              snippet={editingSnippet}
              onCancel={onCancelForm}
              onSaved={onSaved}
              onMenuClick={() => setSidebarOpen(true)}
            />
          </div>
        )}
      </div>
    </div>
    </UserProvider>
  )
}
