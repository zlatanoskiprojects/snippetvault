import { Link, useNavigate } from 'react-router-dom'
import LandingNavbar from '../components/landing/LandingNavbar'
import { buttonVariants } from '../components/ui/Button'
import { usePageMeta } from '../hooks/usePageMeta'
import { cn } from '../lib/utils'

export default function NotFound() {
  const navigate = useNavigate()
  usePageMeta({ title: 'Page not found', noindex: true })

  return (
    <div className="min-h-screen bg-app flex flex-col">
      <LandingNavbar showNavLinks={false} onGetStarted={() => navigate('/login')} />
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl sm:text-2xl font-semibold text-primary">Page not found</h1>
        <p className="text-secondary text-sm max-w-sm">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className={cn(buttonVariants({ variant: 'primary' }))}>
          Back to Snippet Vault
        </Link>
      </main>
    </div>
  )
}
