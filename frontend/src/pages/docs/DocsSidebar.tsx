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
          <p className="text-[9px] font-medium text-[#595e69] uppercase tracking-wider px-2 mb-1 mt-5 first:mt-0">
            {section.label}
          </p>
          {section.pages.map(page => (
            <NavLink
              key={page.slug}
              to={`/docs/${page.slug}`}
              onClick={onNavigate}
              className={({ isActive }) => cn(
                'flex items-center justify-between px-2 py-1.5 rounded-md text-[13px] transition-colors duration-150',
                isActive ? 'bg-[#6366f1] text-white' : 'text-[#9ba3af] hover:bg-white/5 hover:text-white'
              )}
            >
              <span className="truncate min-w-0">{page.title}</span>
              {page.comingSoon && (
                <Badge label="Soon" textColor="#595e69" bgColor="#222" className="shrink-0 ml-2" />
              )}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}
