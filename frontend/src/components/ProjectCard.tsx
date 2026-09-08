import Card from './ui/Card'
import Button from './ui/Button'
import type { Project } from '../api/types'

export interface ProjectWithMeta extends Project {
  snippetCount: number
  accentColor: string
}

interface ProjectCardProps {
  project: ProjectWithMeta
  onEdit?: () => void
  onDelete?: () => void
  onSelect?: () => void
}

export default function ProjectCard({ project, onEdit, onDelete, onSelect }: ProjectCardProps) {
  const { name, description, snippetCount, accentColor } = project

  return (
    <Card
      onClick={onSelect}
      accentColor={accentColor}
      accentClassName="h-[4px]"
      className="group relative hover:border-border-hover transition-colors duration-150 cursor-pointer min-h-[138px] flex flex-col"
    >
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[15px] font-medium text-primary leading-tight truncate min-w-0">{name}</span>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              className="min-w-10 px-2 text-[11px] sm:min-w-0"
              onClick={e => { e.stopPropagation(); onEdit?.() }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="border border-danger/30 bg-danger-subtle px-2 text-[11px] text-danger hover:bg-danger hover:text-on-danger"
              onClick={e => { e.stopPropagation(); onDelete?.() }}
            >
              Delete
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted leading-relaxed line-clamp-2">{description}</p>

        <div className="mt-auto pt-1">
          <span className="text-xs text-muted">{snippetCount} snippets</span>
        </div>
      </div>
    </Card>
  )
}
