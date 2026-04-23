import { monitoringSignals } from '../../data/homePageData'
import SectionHeading from './SectionHeading'

function FeatureSection() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-5 pb-18 pt-7 text-slate-900 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Core Modules"
        title="Everything needed to run protected remote exams."
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {monitoringSignals.map((signal) => (
          <article
            key={signal.title}
            className="rounded-[1.75rem] border border-slate-900/10 bg-white/70 p-7 shadow-[0_18px_40px_rgba(28,44,67,0.08)] backdrop-blur"
          >
            <div className="mb-6 h-1.5 w-14 rounded-full bg-gradient-to-r from-amber-600 to-sky-800" />
            <h3 className="mb-3 text-2xl text-slate-900">{signal.title}</h3>
            <p className="text-slate-700/85">{signal.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default FeatureSection
