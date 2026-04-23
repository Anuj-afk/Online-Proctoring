import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getExamSections, getTotalTimeLimit } from '../lib/examSections';
import { fetchAvailableExams } from '../lib/examsApi';

function formatDate(value) {
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function AvailableExamsPage() {
  const { logout, user } = useAuth();
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadAvailableExams = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const availableExams = await fetchAvailableExams();
      setExams(availableExams);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailableExams();
  }, [loadAvailableExams]);

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Candidate Dashboard
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {user?.name} ({user?.email})
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Home
            </Link>
            <Link
              to="/create-exam"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              My Created Exams
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Available Exams
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
            Exams assigned to you
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            This dashboard only shows exams where a creator explicitly selected your account as an
            allowed candidate.
          </p>
        </div>

        {isLoading ? <p className="text-sm text-slate-500">Loading available exams...</p> : null}

        {!isLoading && errorMessage ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {!isLoading && !errorMessage && exams.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">
            No exams are available for your account yet.
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          {exams.map((exam) => {
            const sections = getExamSections(exam);
            const totalTimeLimit = getTotalTimeLimit(sections);

            return (
              <article
                key={exam._id}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Assigned Exam
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                      {exam.title}
                    </h2>
                    <p className="mt-3 text-sm text-slate-600">
                      Created by {exam.owner?.name || 'Exam creator'} • updated{' '}
                      {formatDate(exam.updatedAt || exam.createdAt)}
                    </p>
                  </div>

                  <Link
                    to={`/exam/${exam._id}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Open Exam
                  </Link>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Sections
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{sections.length}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Total Time
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{totalTimeLimit}m</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Questions
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {sections.reduce((total, section) => total + section.questions.length, 0)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {sections.map((section, index) => (
                    <div
                      key={section.id ?? `${exam._id}-section-${index}`}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Section {index + 1}
                          </p>
                          <h3 className="mt-1 font-semibold text-slate-900">{section.title}</h3>
                        </div>
                        <p className="text-sm text-slate-500">
                          {section.timeLimitMinutes} min • {section.questions.length} questions
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default AvailableExamsPage;
