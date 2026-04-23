import { Link } from 'react-router-dom';

function HomeCTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-18 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-5 rounded-[2rem] border border-slate-900/10 bg-[linear-gradient(135deg,rgba(235,223,200,0.9),rgba(255,255,255,0.68))] p-8 shadow-[0_20px_44px_rgba(26,42,61,0.08)] md:flex-row md:items-center">
        <div>
          <p className="mb-4 inline-block rounded-full border border-slate-900/10 bg-[#eae0ce]/80 px-4 py-2 text-xs uppercase tracking-[0.18em] text-amber-800">
            Ready For The Next Step
          </p>
          <h2 className="max-w-3xl text-4xl leading-[0.98] tracking-[-0.05em] text-slate-900 md:text-5xl">
            Use this as the homepage foundation for your full proctoring system.
          </h2>
        </div>

        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 px-6 font-bold text-slate-900 shadow-[0_18px_36px_rgba(206,148,57,0.26)] transition hover:-translate-y-0.5"
          to="/create-exam"
        >
          Create Exam
        </Link>
      </div>
    </section>
  )
}

export default HomeCTA
