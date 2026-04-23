import { examFlow } from '../../data/homePageData'
import SectionHeading from './SectionHeading'

function WorkflowSection() {
  return (
    <section id="workflow" className="mx-auto max-w-7xl px-5 pb-18 pt-7 text-slate-900 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Workflow"
        title="From exam setup to final audit, the process stays structured."
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-4">
        {examFlow.map((item) => (
          <article
            key={item.step}
            className="min-h-[230px] rounded-[1.75rem] border border-slate-900/10 bg-white/70 p-7 shadow-[0_18px_40px_rgba(28,44,67,0.08)] backdrop-blur"
          >
            <span className="mb-4 inline-flex text-sm font-bold tracking-[0.14em] text-amber-700">
              {item.step}
            </span>
            <h3 className="mb-3 text-2xl text-slate-900">{item.title}</h3>
            <p className="text-slate-700/85">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default WorkflowSection
