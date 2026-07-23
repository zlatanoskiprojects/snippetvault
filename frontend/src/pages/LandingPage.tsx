import LandingNavbar from '../components/landing/LandingNavbar'
import LandingHero from '../components/landing/LandingHero'
import LandingAppPreview from '../components/landing/LandingAppPreview'

interface LandingPageProps {
  onGetStarted: () => void
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col overflow-x-hidden">
      <LandingNavbar onGetStarted={onGetStarted} />
      <main className="flex-1 flex flex-col">
        <LandingHero />
        <LandingAppPreview />
      </main>
    </div>
  )
}