import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { platformStats, timelineEvents } from '../../data/homePageData'

function HomeHero() {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <section className="mx-auto max-w-7xl px-5 pb-18 pt-6 sm:px-6 lg:px-8">
      <div className="relative">
        <div className="pointer-events-none absolute -left-16 top-16 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-8 top-24 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl" />

        <header className="mb-14 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-13 w-13 place-items-center rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 to-amber-300/20 text-sm font-bold tracking-[0.18em] text-[#fff8ea]">
              OP
            </span>
            <div>
              <p className="text-base font-bold text-[#fff8ea]">Online Proctoring</p>
              <p className="text-sm text-white/65">Secure remote exams for modern institutions</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <nav className="flex flex-wrap gap-6 text-sm text-white/80" aria-label="Primary">
              <a className="transition hover:text-white" href="#features">
                Features
              </a>
              <a className="transition hover:text-white" href="#workflow">
                Workflow
              </a>
              <a className="transition hover:text-white" href="#dashboard">
                Dashboard
              </a>
            </nav>

            {isAuthenticated ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-white/70">{user?.name}</span>
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 px-5 font-bold text-slate-900 transition hover:-translate-y-0.5"
                  to="/create-exam"
                >
                  My Exams
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 font-semibold text-[#fff8ea] transition hover:-translate-y-0.5"
                  to="/available-exams"
                >
                  Available Exams
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 font-semibold text-[#fff8ea] transition hover:-translate-y-0.5"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 font-semibold text-[#fff8ea] transition hover:-translate-y-0.5"
                  to="/auth"
                >
                  Login
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 px-5 font-bold text-slate-900 transition hover:-translate-y-0.5"
                  to="/auth"
                  state={{ mode: 'signup' }}
                >
                  Signup
                </Link>
              </div>
            )}
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="pt-4">
            <p className="mb-4 inline-block rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-amber-200">
              Online Exam Proctoring System
            </p>

            <h1 className="max-w-[11ch] text-6xl leading-[0.95] tracking-[-0.06em] text-[#fff8ea] sm:text-7xl lg:text-[7rem]">
              Build exam sessions that feel
              <span className="block font-display text-amber-300 italic font-normal">
                trustworthy at scale.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-white/80">
              Launch a homepage for your proctoring platform with live monitoring, candidate
              verification, automated incident detection, and a clear review workflow for exam
              admins. Account-based exam storage and user assignment are now built in, so creators
              control who can take each test and candidates get a separate exam dashboard.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 px-6 font-bold text-slate-900 shadow-[0_18px_36px_rgba(206,148,57,0.26)] transition hover:-translate-y-0.5"
                href="#dashboard"
              >
                Launch Demo
              </a>
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 font-bold text-[#fff8ea] transition hover:-translate-y-0.5"
                href="#features"
              >
                Explore Modules
              </a>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {platformStats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-[1.75rem] border border-slate-900/10 bg-white/6 p-6 backdrop-blur"
                >
                  <strong className="mb-2 block text-2xl text-[#fff8ea]">{stat.value}</strong>
                  <span className="text-white/70">{stat.label}</span>
                </article>
              ))}
            </div>
          </div>

          <aside
            id="dashboard"
            className="grid gap-4 rounded-[2.1rem] border border-white/10 bg-gradient-to-b from-white/8 to-white/3 p-5 shadow-[0_22px_48px_rgba(7,12,24,0.28)] backdrop-blur"
          >
            <div className="grid gap-4 rounded-[1.75rem] border border-slate-900/10 bg-[rgba(10,20,34,0.44)] p-6">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/60">
                  Active Exam Room
                </p>
                <h2 className="text-2xl text-[#fff8ea]">Data Structures Midterm</h2>
              </div>
              <span className="w-fit rounded-full bg-emerald-300/12 px-3 py-2 text-sm font-bold text-emerald-300">
                Proctoring Live
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-[1.75rem] border border-slate-900/10 bg-[rgba(10,20,34,0.44)] p-6">
                <p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/60">
                  Candidate Status
                </p>
                <strong className="block text-2xl text-[#fff8ea]">186 Verified</strong>
                <span className="text-white/70">12 awaiting room scan</span>
              </article>

              <article className="rounded-[1.75rem] border border-slate-900/10 bg-[rgba(10,20,34,0.44)] p-6">
                <p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/60">
                  Risk Alerts
                </p>
                <strong className="block text-2xl text-[#fff8ea]">08 incidents</strong>
                <span className="text-white/70">3 high priority for review</span>
              </article>
            </div>

            <article className="grid gap-4 rounded-[1.75rem] border border-slate-900/10 bg-[rgba(10,20,34,0.44)] p-6">
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">
                Monitoring Timeline
              </p>
              {timelineEvents.map((event, index) => (
                <div
                  key={event.time}
                  className={`grid grid-cols-[auto_1fr] gap-4 ${
                    index === 0 ? 'pt-1' : 'border-t border-white/8 pt-4'
                  }`}
                >
                  <span className="font-bold text-amber-300">{event.time}</span>
                  <p className="text-white/78">{event.description}</p>
                </div>
              ))}
            </article>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default HomeHero
