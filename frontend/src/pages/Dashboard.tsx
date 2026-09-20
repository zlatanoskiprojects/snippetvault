import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '../components/ui/Sheet'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import SnippetList from '../components/SnippetList'
import NewSnippet from './NewSnippet'
import SearchView from './SearchView'
import ProjectsView from './ProjectsView'
import MembersView from './MembersView'
import SnippetDetailPanel from './SnippetDetailPanel'
import ProfileView from './ProfileView'
import { useSnippets } from '../hooks/useSnippets'
import { useProjects } from '../hooks/useProjects'
import { useWorkspaces } from '../hooks/useWorkspaces'
import { deleteSnippet } from '../api/snippets'
import { useToast } from '../hooks/useToast'
import { UserProvider } from '../contexts/UserContext'
import Spinner from '../components/ui/Spinner'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import type { Snippet } from '../api/types'
import type { Project } from '../api/types'

type View = 'list' | 'new' | 'search' | 'projects' | 'members' | 'profile'

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null)
  const [view, setView] = useState<View>(
    searchParams.get('reauth') === 'email-change' ||
      searchParams.get('reauth') === 'password-setup' ||
      searchParams.get('setup') === 'password'
      ? 'profile'
      : 'list'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const { workspaces, loading: workspacesLoading, error: workspacesError, addWorkspace } = useWorkspaces()
  const { snippets, setSnippets, loading, error } = useSnippets(selectedWorkspaceId)
  const projectsState = useProjects(selectedWorkspaceId)
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const toast = useToast()
  const selectedWorkspace = workspaces.find(workspace => workspace.id === selectedWorkspaceId) ?? null
  const canMutateSnippets = selectedWorkspace?.role === 'owner' || selectedWorkspace?.role === 'editor'

  useEffect(() => {
    if (workspaces.length === 0) return
    setSelectedWorkspaceId(current => workspaces.some(workspace => workspace.id === current) ? current : workspaces[0].id)
  }, [workspaces])

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
    if (!canMutateSnippets) return
    setEditingSnippet(snippet)
    setView('new')
  }

  async function onDelete(id: number) {
    if (!canMutateSnippets) return
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
    if (saved.workspace_id !== selectedWorkspaceId) return
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
    if (updated.workspace_id !== selectedWorkspaceId) return
    setSnippets(prev => prev.map(s => s.id === updated.id ? updated : s))
    setSelectedSnippet(updated)
    toast.success('Version restored.')
  }

  function onUpdateSnippet(updated: Snippet) {
    if (updated.workspace_id !== selectedWorkspaceId) return
    setSnippets(prev => prev.map(s => s.id === updated.id ? updated : s))
    setSelectedSnippet(updated)
  }

  function onCancelForm() {
    setEditingSnippet(null)
    setView('list')
  }

  function handleSelectProject(project: Project) {
    setActiveProject(project)
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
      setActiveProject(null)
    }
    setView(v as View)
  }

  function handleClearProject() {
    setActiveProject(null)
    setSelectedSnippet(null)
  }

  function handleSelectTag(tag: string) {
    exitSearch()
    setActiveTag(tag)
    setActiveProject(null)
    setSelectedSnippet(null)
    setView('list')
  }

  function handleClearTag() {
    setActiveTag(null)
    setSelectedSnippet(null)
  }

  function handleSelectWorkspace(workspaceId: number) {
    if (workspaceId === selectedWorkspaceId) return
    setSelectedWorkspaceId(workspaceId)
    setSelectedSnippet(null)
    setEditingSnippet(null)
    setActiveProject(null)
    setActiveTag(null)
    setSearchQuery('')
    setIsSearching(false)
    setView('list')
  }

  async function handleAddWorkspace(name: string) {
    const created = await addWorkspace(name)
    handleSelectWorkspace(created.id)
  }

  return (
    <UserProvider>
    <div className="flex h-dvh bg-app text-primary overflow-hidden">
      <div className="hidden lg:flex">
        <Sidebar
          workspaces={workspaces}
          selectedWorkspaceId={selectedWorkspaceId}
          onSelectWorkspace={handleSelectWorkspace}
          onAddWorkspace={handleAddWorkspace}
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

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" overlayClassName="lg:hidden" className="lg:hidden">
          <SheetTitle className="sr-only">Snippet navigation</SheetTitle>
          <Sidebar
            workspaces={workspaces}
            selectedWorkspaceId={selectedWorkspaceId}
            onSelectWorkspace={workspaceId => { handleSelectWorkspace(workspaceId); setSidebarOpen(false) }}
            onAddWorkspace={async name => { await handleAddWorkspace(name); setSidebarOpen(false) }}
            snippets={snippets}
            activeView={view}
            onViewChange={v => { handleViewChange(v); setSidebarOpen(false) }}
            activeTag={activeTag}
            onTagChange={tag => { handleSelectTag(tag); setSidebarOpen(false) }}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 min-w-0 overflow-hidden">
        {workspacesLoading ? (
          <div className="flex flex-1 items-center justify-center"><Spinner className="text-primary" /></div>
        ) : workspacesError ? (
          <div className="flex flex-1 flex-col min-w-0 p-6"><Alert>Failed to load workspaces: {workspacesError}</Alert></div>
        ) : selectedWorkspaceId === null && workspaces.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
            <h1 className="text-lg font-semibold text-primary">Create your first workspace</h1>
            <p className="max-w-sm text-sm text-secondary">Use the workspace menu to create a place for your snippets.</p>
            <Button variant="secondary" onClick={() => setSidebarOpen(true)} className="mt-2 lg:hidden">
              <Menu size={14} /> Open workspace menu
            </Button>
          </div>
        ) : selectedWorkspaceId === null ? (
          <div className="flex flex-1 items-center justify-center"><Spinner className="text-primary" /></div>
        ) : isSearching || searchQuery ? (
          <SearchView
            snippets={snippets}
            loading={loading}
            error={error}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onClose={() => { setSearchQuery(''); setIsSearching(false) }}
            onSelectSnippet={(snippet: Snippet) => { setSearchQuery(''); setIsSearching(false); onSelectSnippet(snippet) }}
          />
        ) : view === 'profile' ? (
          <ProfileView snippets={snippets} projects={projectsState.projects} onBack={() => handleViewChange('list')} onMenuClick={() => setSidebarOpen(true)} />
        ) : view === 'projects' ? (
          <ProjectsView
            snippets={snippets}
            projects={projectsState.projects}
            loading={projectsState.loading}
            error={projectsState.error}
            canCreate={canMutateSnippets}
            canManage={selectedWorkspace?.role === 'owner'}
            addProject={projectsState.addProject}
            editProject={projectsState.editProject}
            removeProject={projectsState.removeProject}
            onSelectProject={handleSelectProject}
            onMenuClick={() => setSidebarOpen(true)}
          />
        ) : view === 'members' ? (
          <MembersView workspaceId={selectedWorkspaceId} canManage={selectedWorkspace?.role === 'owner'} onMenuClick={() => setSidebarOpen(true)} />
        ) : view === 'list' ? (() => {
          const displayedSnippets = snippets
            .filter(s => !activeProject || s.project_id === activeProject.id)
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
                  canMutate={canMutateSnippets}
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
                  canMutate={canMutateSnippets}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
              <TopBar
                title={activeProject ? activeProject.name : activeTag ? `#${activeTag}` : 'All snippets'}
                onBack={activeProject ? handleClearProject : activeTag ? handleClearTag : undefined}
                onMenuClick={() => setSidebarOpen(true)}
                onSearch={() => setIsSearching(true)}
                onNewSnippet={canMutateSnippets ? () => setView('new') : undefined}
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
              workspaceId={selectedWorkspaceId}
              projects={projectsState.projects}
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
