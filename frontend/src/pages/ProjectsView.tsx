import { useState } from 'react'
import { Menu, Plus } from 'lucide-react'
import ProjectCard, { type ProjectWithMeta } from '../components/ProjectCard'
import Button from '../components/ui/Button'
import ProjectDialog, {
  type ProjectDialogInitialData,
  type ProjectDialogSubmitData,
} from '../components/ProjectDialog'
import type { ProjectInput } from '../api/projects'
import type { Project, Snippet } from '../api/types'

interface ProjectsViewProps {
  snippets: Snippet[]
  projects: Project[]
  loading: boolean
  error: string | null
  canCreate: boolean
  canManage: boolean
  addProject: (data: ProjectInput) => Promise<void>
  editProject: (id: number | string, data: Partial<ProjectInput>) => Promise<void>
  removeProject: (id: number | string) => Promise<void>
  onSelectProject?: (project: Project) => void
  onMenuClick?: () => void
}

export default function ProjectsView({ snippets, projects, loading, error, canCreate, canManage, addProject, editProject, removeProject, onSelectProject, onMenuClick }: ProjectsViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  const handleNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const handleEdit = (project: Project) => {
    if (!canManage) return
    setEditing(project)
    setDialogOpen(true)
  }

  const handleSubmit = (values: ProjectDialogSubmitData) => {
    if (editing) {
      editProject(editing.id, values)
    } else {
      addProject(values)
    }
  }

  const handleDelete = (id: number) => {
    if (!canManage) return
    removeProject(id)
  }

  const editingInitialData: ProjectDialogInitialData | null = editing
    ? { name: editing.name, description: editing.description }
    : null

  return (
    <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
      <header className="flex items-end justify-between px-6 py-3 border-b border-border-default shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {onMenuClick && (
            <Button
              variant="secondary"
              onClick={onMenuClick}
              aria-label="Open menu"
              className="h-10 w-10 shrink-0 p-0 sm:h-10 lg:hidden"
            >
              <Menu size={14} />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-primary leading-tight">Projects</h1>
          </div>
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" onClick={handleNew} className="px-4 text-xs shrink-0">
            <Plus size={14} /> New project
          </Button>
        )}
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted text-sm">Loading projects…</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-danger text-sm">Failed to load projects: {error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 overflow-y-auto">
          {projects.map(project => {
            const projectWithMeta: ProjectWithMeta = {
              ...project,
              snippetCount: snippets.filter(snippet => snippet.project_id === project.id).length,
              accentColor: 'var(--color-accent)',
            }
            return (
              <ProjectCard
                key={project.id}
                project={projectWithMeta}
                onEdit={canManage ? () => handleEdit(project) : undefined}
                onDelete={canManage ? () => handleDelete(project.id) : undefined}
                onSelect={() => onSelectProject?.(project)}
              />
            )
          })}
        </div>
      )}

      {(canCreate || canManage) && (
        <ProjectDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          initialData={editingInitialData}
        />
      )}
    </div>
  )
}
