import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import SnippetList from '../components/SnippetList'
import NewSnippet from './NewSnippet'
import SearchView from './SearchView'
import CollectionsView from './CollectionsView'
import { snippets } from '../data'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  return (
    <div className="flex h-full bg-[#0f0f0f] text-white overflow-hidden">
      {/* Static sidebar — lg+ */}
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

      {/* Mobile drawer */}
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

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {isSearching || searchQuery ? (
          <SearchView
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onClose={() => { setSearchQuery(''); setIsSearching(false) }}
          />
        ) : view === 'collections' ? (
          <CollectionsView />
        ) : view === 'list' ? (
          <>
            <TopBar
              snippetCount={snippets.length}
              onMenuClick={() => setSidebarOpen(true)}
              onNewSnippet={() => setView('new')}
            />
            <div className="flex-1 overflow-y-auto">
              <SnippetList snippets={snippets} />
            </div>
          </>
        ) : (
          <NewSnippet onCancel={() => setView('list')} />
        )}
      </div>
    </div>
  )
}