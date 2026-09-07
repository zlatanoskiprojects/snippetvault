import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sheet, SheetContent, SheetTitle } from '../../components/ui/Sheet'
import { Menu } from 'lucide-react'
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
    <div className="h-dvh flex flex-col bg-app overflow-x-hidden">
      <LandingNavbar onGetStarted={() => navigate('/login')} />

      <nav aria-label="Documentation controls" className="lg:hidden flex items-center gap-2 h-[44px] px-4 border-b border-border-default">
        <Button
          variant="secondary"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open docs menu"
          className="w-[40px] h-[40px] sm:w-[30px] sm:h-[30px] p-0 shrink-0"
        >
          <Menu size={14} />
        </Button>
        <span className="text-sm text-primary truncate min-w-0">{title}</span>
      </nav>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border-default bg-sidebar overflow-y-auto py-6 px-3">
          <DocsSidebar />
        </aside>

        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" overlayClassName="lg:hidden" className="lg:hidden">
            <SheetTitle className="sr-only">Documentation navigation</SheetTitle>
            <aside className="w-60 bg-sidebar border-r border-border-default overflow-y-auto py-6 px-3 h-full">
              <DocsSidebar onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </SheetContent>
        </Sheet>

        <main ref={scrollRef} className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-5xl gap-10 px-6 py-10">
            <article className="flex-1 min-w-0 max-w-3xl">
              {children}
            </article>
            <aside className="hidden xl:block w-52 shrink-0">
              <div className="sticky top-8">
                <DocsToc headings={headings} scrollRef={scrollRef} />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
