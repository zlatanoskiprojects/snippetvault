import { useEffect, useRef, useState, type RefObject } from 'react'
import { cn } from '../../lib/utils'
import type { DocHeadingRef } from './registry'

interface DocsTocProps {
  headings: DocHeadingRef[]
  scrollRef: RefObject<HTMLDivElement | null>
}

export default function DocsToc({ headings, scrollRef }: DocsTocProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const visible = useRef<Set<string>>(new Set())

  useEffect(() => {
    visible.current = new Set()
    setActiveId(null)
    if (!headings.length || !scrollRef.current) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) visible.current.add(entry.target.id)
          else visible.current.delete(entry.target.id)
        })
        setActiveId(headings.find(heading => visible.current.has(heading.id))?.id ?? null)
      },
      { root: scrollRef.current, rootMargin: '0px 0px -70% 0px' }
    )

    headings.forEach(heading => {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings, scrollRef])

  if (!headings.length) return null

  function handleClick(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    window.history.pushState(null, '', `#${id}`)
  }

  return (
    <nav aria-label="On this page">
      <p className="text-[9px] font-medium text-[#595e69] uppercase tracking-wider mb-2">On this page</p>
      <div className="flex flex-col border-l border-[#2a2a2a]">
        {headings.map(heading => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            onClick={e => { e.preventDefault(); handleClick(heading.id) }}
            className={cn(
              'block -ml-px border-l pl-3 py-1 text-[13px] transition-colors duration-150',
              activeId === heading.id ? 'text-[#6366f1] border-[#6366f1]' : 'text-[#595e69] hover:text-[#9ba3af] border-transparent'
            )}
          >
            {heading.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
