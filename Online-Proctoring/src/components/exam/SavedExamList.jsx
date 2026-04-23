function formatDate(value) {
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function countQuestionTypes(questions) {
  return questions.reduce(
    (counts, question) => {
      counts[question.type] = (counts[question.type] || 0) + 1;
      return counts;
    },
    { mcq: 0, coding: 0, passage: 0 },
  );
}

function SavedExamList({ exams, isLoading, errorMessage, onRefresh }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Saved Exams</h2>
          <p className="text-sm text-slate-500">These are loaded directly from MongoDB.</p>
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
          const counts = countQuestionTypes(exam.questions);

          return (
            <article
              key={exam._id}
              className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{exam.title}</h3>
                  <p className="text-sm text-slate-500">
                    {exam.questions.length} questions • saved {formatDate(exam.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                    MCQ: {counts.mcq}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                    Coding: {counts.coding}
                  </span>
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">
                    Passage: {counts.passage}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {exam.questions.map((question, index) => (
                  <div
                    key={question.id ?? `${exam._id}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {question.type} question
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {question.question ||
                        question.problem ||
                        question.passage?.slice(0, 140) ||
                        'Question content saved.'}
                    </p>
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
