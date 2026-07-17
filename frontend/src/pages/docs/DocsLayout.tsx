import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import LandingNavbar from '../../components/landing/LandingNavbar'
import Button from '../../components/ui/Button'
import DocsSidebar from './DocsSidebar'
import DocsToc from './DocsToc'
import type { DocHeadingRef } from './registry'

interface DocsLayoutProps {
  slug: string
  title: string
  headings: DocHeadingRef[]
  children: ReactNode
}

export default function DocsLayout({ slug, title, headings, children }: DocsLayoutProps) {
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    setDrawerOpen(false)
  }, [slug])

  return (
    <div className="h-full flex flex-col bg-[#0f0f0f] overflow-x-hidden">
      <LandingNavbar onGetStarted={() => navigate('/login')} />

      <div className="lg:hidden flex items-center gap-2 h-[44px] px-4 border-b border-[#2a2a2a]">
        <Button
          variant="secondary"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open docs menu"
          className="w-[30px] h-[30px] p-0 shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect y="2" width="14" height="1.5" rx="0.75" fill="currentColor" />
            <rect y="6.25" width="14" height="1.5" rx="0.75" fill="currentColor" />
            <rect y="10.5" width="14" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
        </Button>
        <span className="text-sm text-white truncate min-w-0">{title}</span>
      </div>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-[#2a2a2a] bg-[#161616] overflow-y-auto py-6 px-3">
          <DocsSidebar />
        </aside>

        <BaseDialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <BaseDialog.Portal>
            <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
            <BaseDialog.Popup className="fixed left-0 top-0 z-40 h-full lg:hidden outline-none transition-transform duration-150 data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full">
              <div className="w-60 bg-[#161616] border-r border-[#2a2a2a] overflow-y-auto py-6 px-3 h-full">
                <DocsSidebar onNavigate={() => setDrawerOpen(false)} />
              </div>
            </BaseDialog.Popup>
          </BaseDialog.Portal>
        </BaseDialog.Root>

        <div ref={scrollRef} className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-5xl gap-10 px-6 py-10">
            <article className="flex-1 min-w-0 max-w-3xl">
              {children}
            </article>
            <div className="hidden xl:block w-52 shrink-0">
              <div className="sticky top-8">
                <DocsToc headings={headings} scrollRef={scrollRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
