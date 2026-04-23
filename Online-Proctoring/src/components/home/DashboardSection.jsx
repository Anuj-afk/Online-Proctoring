import { controlPanels } from '../../data/homePageData'
import SectionHeading from './SectionHeading'

function DashboardSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-18 sm:px-6 lg:px-8">
      <div className="grid gap-7 rounded-[2rem] border border-slate-900/10 bg-[linear-gradient(135deg,rgba(17,29,47,0.96),rgba(30,46,69,0.9))] p-8 shadow-[0_24px_50px_rgba(19,32,49,0.16)] lg:grid-cols-[1fr_0.9fr]">
        <div>
          <SectionHeading
            eyebrow="Admin Control Room"
            title="Give exam teams one place to observe, respond, and document."
            invert
          />
          <p className="mt-5 max-w-2xl text-white/78">
            The homepage highlights the product story: automated monitoring on one side,
            actionable review tools on the other.
          </p>
        </div>

        <div className="grid gap-4">
          {controlPanels.map((panel) => (
            <div
              key={panel}
              className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-[#fff8ea]"
            >
              <span className="h-3 w-3 rounded-full bg-gradient-to-b from-amber-300 to-amber-600 shadow-[0_0_0_6px_rgba(240,199,107,0.12)]" />
              <p>{panel}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default DashboardSection
