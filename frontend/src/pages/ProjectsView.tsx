import { useState } from 'react'
import { Menu, Plus } from 'lucide-react'
import ProjectCard, { type ProjectWithMeta } from '../components/ProjectCard'
import Button from '../components/ui/Button'
import ProjectDialog, {
  type ProjectDialogInitialData,
  type ProjectDialogSubmitData,
} from '../components/ProjectDialog'
import { useProjects } from '../hooks/useProjects'
import type { Project } from '../api/types'

interface ProjectsViewProps {
  onSelectProject?: (project: Project) => void
  onMenuClick?: () => void
}

export default function ProjectsView({ onSelectProject, onMenuClick }: ProjectsViewProps) {
  const { projects, loading, error, addProject, editProject, removeProject } = useProjects()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  const handleNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const handleEdit = (project: Project) => {
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
            <p className="text-xs text-muted mt-0.5">{projects.length} projects</p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={handleNew} className="px-4 text-xs shrink-0">
          <Plus size={14} /> New project
        </Button>
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
              snippetCount: 0,
              accentColor: 'var(--color-accent)',
            }
            return (
              <ProjectCard
                key={project.id}
                project={projectWithMeta}
                onEdit={() => handleEdit(project)}
                onDelete={() => handleDelete(project.id)}
                onSelect={() => onSelectProject?.(project)}
              />
            )
          })}
        </div>
      )}

      <ProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingInitialData}
      />
    </div>
  )
}
