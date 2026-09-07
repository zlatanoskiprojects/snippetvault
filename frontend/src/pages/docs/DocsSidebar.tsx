import { NavLink } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import { cn } from '../../lib/utils'
import { DOCS_SECTIONS } from './registry'

interface DocsSidebarProps {
  onNavigate?: () => void
}

export default function DocsSidebar({ onNavigate }: DocsSidebarProps) {
  return (
    <nav aria-label="Documentation">
      {DOCS_SECTIONS.map(section => (
        <div key={section.label}>
          <p className="text-[9px] font-medium text-muted uppercase tracking-wider px-2 mb-1 mt-5 first:mt-0">
            {section.label}
          </p>
          {section.pages.map(page => (
            <NavLink
              key={page.slug}
              to={`/docs/${page.slug}`}
              onClick={onNavigate}
              className={({ isActive }) => cn(
                'flex h-10 w-full items-center justify-between rounded-lg px-2 text-[13px] leading-none transition-colors duration-150 lg:h-8',
                isActive ? 'bg-accent text-on-accent' : 'text-secondary hover:bg-interactive-overlay/5 hover:text-primary'
              )}
            >
              <span className="truncate min-w-0">{page.title}</span>
              {page.comingSoon && (
                <Badge label="Soon" textColor="var(--color-muted)" bgColor="var(--color-control)" className="shrink-0 ml-2" />
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}
