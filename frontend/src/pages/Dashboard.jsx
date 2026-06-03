import { useState } from 'react'
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

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const { snippets, setSnippets, loading, error } = useSnippets()
  const [selectedSnippet, setSelectedSnippet] = useState(null)
  const [editingSnippet, setEditingSnippet] = useState(null)
  const toast = useToast()

  function onSelectSnippet(snippet) {
    setSelectedSnippet(snippet)
  }

  function onCloseDetail() {
    setSelectedSnippet(null)
  }

  function onEdit(snippet) {
    setEditingSnippet(snippet)
    setView('new')
  }

  async function onDelete(id) {
    try {
      await deleteSnippet(id)
      setSnippets(prev => prev.filter(s => s.id !== id))
      if (selectedSnippet?.id === id) setSelectedSnippet(null)
      toast.success('Snippet deleted.')
    } catch (err) {
      toast.error(err.message || 'Failed to delete snippet.')
    }
  }

  function onSaved(saved) {
    setSnippets(prev => {
      const exists = prev.some(s => s.id === saved.id)
      if (exists) return prev.map(s => s.id === saved.id ? saved : s)
      return [saved, ...prev]
    })
    if (selectedSnippet?.id === saved.id) setSelectedSnippet(saved)
    setEditingSnippet(null)
    setView('list')
  }

  function onCancelForm() {
    setEditingSnippet(null)
    setView('list')
  }

  return (
    <div className="flex h-full bg-[#0f0f0f] text-white overflow-hidden">
      <div className="hidden lg:flex">
        <Sidebar
          searchQuery={searchQuery}
          onSearchChange={q => { setSearchQuery(q); if (q) setIsSearching(true) }}
          onSearchFocus={() => setIsSearching(true)}
          onSearchBlur={() => setIsSearching(false)}
          isSearchActive={isSearching}
          activeView={view}
          onViewChange={setView}
        />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-[rgba(0,0,0,0.5)]"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full z-50">
            <Sidebar
              activeView={view}
              onViewChange={v => { setView(v); setSidebarOpen(false) }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 min-w-0 overflow-hidden">
        {isSearching || searchQuery ? (
          <SearchView
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onClose={() => { setSearchQuery(''); setIsSearching(false) }}
          />
        ) : view === 'profile' ? (
          <ProfileView />
        ) : view === 'collections' ? (
          <CollectionsView />
        ) : view === 'list' ? (
          loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col min-w-0 p-6">
              <div className="alert alert-danger" role="alert">
                Failed to load snippets: {error}
              </div>
            </div>
          ) : selectedSnippet ? (
            <>
              <div className="flex-1 min-w-0 overflow-y-auto border-r border-[#2a2a2a]">
                <SnippetList
                  snippets={snippets}
                  selectedSnippetId={selectedSnippet.id}
                  onSelectSnippet={onSelectSnippet}
                />
              </div>

              <div className="hidden lg:flex w-[44%] lg:w-[520px] xl:w-[656px] shrink-0 flex-col bg-[#101010]">
                <SnippetDetailPanel
                  snippet={selectedSnippet}
                  onClose={onCloseDetail}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>

              <div className="fixed inset-0 z-40 bg-[#101010] flex flex-col lg:hidden">
                <SnippetDetailPanel
                  snippet={selectedSnippet}
                  onClose={onCloseDetail}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
              <TopBar
                snippetCount={snippets.length}
                onMenuClick={() => setSidebarOpen(true)}
                onNewSnippet={() => setView('new')}
              />
              <div className="flex-1 overflow-y-auto">
                <SnippetList
                  snippets={snippets}
                  selectedSnippetId={null}
                  onSelectSnippet={onSelectSnippet}
                />
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            <NewSnippet
              snippet={editingSnippet}
              onCancel={onCancelForm}
              onSaved={onSaved}
            />
          </div>
        )}
      </div>
    </div>
  )
}
