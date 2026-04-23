import { Link } from 'react-router-dom';
import {
  countQuestionTypes,
  flattenQuestionsFromSections,
  getExamSections,
  getTotalTimeLimit,
  summarizeQuestion,
} from '../../lib/examSections';

function formatDate(value) {
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function SavedExamList({ exams, isLoading, errorMessage, onRefresh, onEdit, activeExamId }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Saved Exams</h2>
          <p className="text-sm text-slate-500">
            Open an existing exam to edit its sections, time limits, and questions.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {isLoading ? <p className="text-sm text-slate-500">Loading saved exams...</p> : null}

      {!isLoading && errorMessage ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {!isLoading && !errorMessage && exams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          No exams saved yet.
        </div>
      ) : null}

      <div className="space-y-4">
        {exams.map((exam) => {
          const sections = getExamSections(exam);
          const questions = flattenQuestionsFromSections(sections);
          const counts = countQuestionTypes(questions);
          const totalTimeLimit = getTotalTimeLimit(sections);
          const isActive = activeExamId === exam._id;

          return (
            <article
              key={exam._id}
              className={`rounded-3xl border p-5 transition ${
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white shadow-[0_20px_40px_rgba(15,23,42,0.18)]'
                  : 'border-slate-200 bg-slate-50/80'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className={`text-lg font-semibold ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {exam.title}
                  </h3>
                  <p className={`text-sm ${isActive ? 'text-white/70' : 'text-slate-500'}`}>
                    {sections.length} sections • {questions.length} questions • {totalTimeLimit}{' '}
                    minutes • saved {formatDate(exam.updatedAt || exam.createdAt)}
                  </p>
                  <p className={`mt-1 text-sm ${isActive ? 'text-white/65' : 'text-slate-500'}`}>
                    {exam.assignedCandidates?.length || exam.assignedUsers?.length || 0} assigned users
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isActive ? 'bg-white/10 text-white' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    MCQ: {counts.mcq}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isActive ? 'bg-white/10 text-white' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    Coding: {counts.coding}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isActive ? 'bg-white/10 text-white' : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    Passage: {counts.passage}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEdit(exam)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-white text-slate-900 hover:bg-white/90'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isActive ? 'Editing' : 'Edit'}
                  </button>
                  <Link
                    to={`/exam-preview/${exam._id}`}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'border border-white/20 bg-white/10 text-white hover:bg-white/15'
                        : 'border border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                    }`}
                  >
                    Preview UI
                  </Link>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {sections.map((section, sectionIndex) => (
                  <div
                    key={section.id ?? `${exam._id}-section-${sectionIndex}`}
                    className={`rounded-2xl border px-4 py-4 ${
                      isActive ? 'border-white/10 bg-white/6' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p
                          className={`text-xs font-semibold uppercase tracking-[0.14em] ${
                            isActive ? 'text-white/55' : 'text-slate-400'
                          }`}
                        >
                          Section {sectionIndex + 1}
                        </p>
                        <h4 className={`mt-1 font-semibold ${isActive ? 'text-white' : 'text-slate-900'}`}>
                          {section.title}
                        </h4>
                      </div>
                      <p className={`text-sm ${isActive ? 'text-white/75' : 'text-slate-500'}`}>
                        {section.timeLimitMinutes} min • {section.questions.length} questions
                      </p>
                    </div>

                    <div className="mt-3 space-y-2">
                      {section.questions.map((question, questionIndex) => (
                        <div
                          key={question.id ?? `${section.id}-${questionIndex}`}
                          className={`rounded-2xl border px-4 py-3 ${
                            isActive ? 'border-white/10 bg-slate-950/20' : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <p
                            className={`text-xs font-semibold uppercase tracking-[0.12em] ${
                              isActive ? 'text-white/50' : 'text-slate-400'
                            }`}
                          >
                            {question.type} question
                          </p>
                          <p className={`mt-1 text-sm ${isActive ? 'text-white/82' : 'text-slate-700'}`}>
                            {summarizeQuestion(question)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default SavedExamList;
