import DashboardSection from '../components/home/DashboardSection'
import FeatureSection from '../components/home/FeatureSection'
import HomeCTA from '../components/home/HomeCTA'
import HomeHero from '../components/home/HomeHero'
import WorkflowSection from '../components/home/WorkflowSection'

function HomePage() {
  return (
    <main id="top" className="overflow-hidden">
      <HomeHero />
      <FeatureSection />
      <DashboardSection />
      <WorkflowSection />
      <HomeCTA />
    </main>
  )
}

export default HomePage
