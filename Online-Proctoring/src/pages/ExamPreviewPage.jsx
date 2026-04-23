import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getExamSections, getTotalTimeLimit, summarizeQuestion } from '../lib/examSections';
import { fetchExam } from '../lib/examsApi';

function getQuestionStatus(question, answerState) {
  if (question.type === 'passage') {
    return question.questions?.some((subQuestion) => answerState?.[`${question.id}:${subQuestion.id}`])
      ? 'attempted'
      : 'unanswered';
  }

  if (question.type === 'coding') {
    if (!answerState) {
      return 'unanswered';
    }

    return answerState.code?.trim() && answerState.code !== (question.code || '')
      ? 'attempted'
      : 'unanswered';
  }

  return answerState ? 'attempted' : 'unanswered';
}

function countAttemptedQuestions(questions, answers) {
  return questions.reduce((total, question) => {
    const status = getQuestionStatus(question, answers[question.id]);
    return status === 'attempted' ? total + 1 : total;
  }, 0);
}

function formatQuestionLabel(index) {
  return `Q${index + 1}`;
}

function buildCodingRunOutput(question, answer) {
  const testCases = Array.isArray(question.testCases) ? question.testCases : [];

  if (!answer?.code?.trim()) {
    return 'No code to run.\nAdd code in the editor to simulate execution.';
  }

  const lines = [
    'Running against sample test cases...',
    '',
    `Language: JavaScript`,
    `Characters in editor: ${answer.code.length}`,
    '',
  ];

  testCases.forEach((testCase, index) => {
    lines.push(`Case ${index + 1}`);
    lines.push(`Input: ${testCase.input || '(empty)'}`);
    lines.push(`Expected: ${testCase.expected || '(not provided)'}`);
    lines.push('Result: Preview mode does not execute code, but the runner layout is wired.');
    lines.push('');
  });

  lines.push('Execution finished.');

  return lines.join('\n');
}

function SectionTabs({ sections, activeSectionIndex, onChangeSection, answers }) {
  return (
    <div className="rounded-[2rem] border border-slate-800/40 bg-[linear-gradient(135deg,#0e1828,#16253c)] p-4 shadow-[0_30px_70px_rgba(6,10,18,0.24)]">
      <div className="flex flex-wrap gap-3">
        {sections.map((section, index) => {
          const attempted = countAttemptedQuestions(section.questions, answers);
          const isActive = index === activeSectionIndex;

          return (
            <button
              key={section.id ?? index}
              type="button"
              onClick={() => onChangeSection(index)}
              className={`min-w-[220px] flex-1 rounded-[1.5rem] border px-4 py-4 text-left transition ${
                isActive
                  ? 'border-amber-300/70 bg-[linear-gradient(135deg,rgba(243,199,108,0.18),rgba(255,255,255,0.1))] text-white'
                  : 'border-white/10 bg-white/6 text-white/78 hover:bg-white/9'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">
                Section {index + 1}
              </p>
              <h2 className="mt-2 text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm text-white/65">
                {section.timeLimitMinutes} minutes
              </p>
              <p className="mt-1 text-sm text-white/65">
                {attempted}/{section.questions.length} attempted
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExamHeader({ examTitle, activeSection, sectionIndex, totalSections, answers }) {
  const attempted = countAttemptedQuestions(activeSection.questions, answers);

  return (
    <header className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Candidate Workspace
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">{examTitle}</h1>
          <p className="mt-3 text-slate-600">
            Section {sectionIndex + 1} of {totalSections}: {activeSection.title}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Section Time
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {activeSection.timeLimitMinutes}m
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Questions
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {activeSection.questions.length}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Attempted
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{attempted}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function MCQLayout({
  question,
  questions,
  activeQuestionIndex,
  answers,
  onSelectOption,
  onJumpToQuestion,
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_320px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Multiple Choice
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {question.question || 'Untitled MCQ'}
            </h2>
          </div>
          <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            {formatQuestionLabel(activeQuestionIndex)}
          </span>
        </div>

        <div className="mt-8 grid gap-4">
          {question.options?.map((option, optionIndex) => {
            const isSelected = answers[question.id] === option;

            return (
              <button
                key={`${question.id}-option-${optionIndex}`}
                type="button"
                onClick={() => onSelectOption(option)}
                className={`rounded-[1.5rem] border px-5 py-5 text-left transition ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-[0_18px_36px_rgba(59,130,246,0.12)]'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'
                    }`}
                  >
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span className="pt-1 text-base text-slate-800">{option || `Option ${optionIndex + 1}`}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] xl:sticky xl:top-6 xl:self-start">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Question Navigator
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Jump to any question</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {questions.map((navigatorQuestion, index) => {
            const isCurrent = index === activeQuestionIndex;
            const status = getQuestionStatus(navigatorQuestion, answers[navigatorQuestion.id]);

            return (
              <button
                key={navigatorQuestion.id ?? index}
                type="button"
                onClick={() => onJumpToQuestion(index)}
                className={`rounded-[1.25rem] border px-3 py-4 text-left transition ${
                  isCurrent
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : status === 'attempted'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
                  {formatQuestionLabel(index)}
                </p>
                <p className="mt-2 text-sm font-medium">
                  {isCurrent ? 'Current' : status === 'attempted' ? 'Attempted' : 'Pending'}
                </p>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function PassageLayout({
  question,
  answers,
  activeSubQuestionIndex,
  setActiveSubQuestionIndex,
  isSidebarOpen,
  setIsSidebarOpen,
  onSelectPassageOption,
}) {
  const subQuestions = Array.isArray(question.questions) ? question.questions : [];
  const activeSubQuestion = subQuestions[activeSubQuestionIndex] || subQuestions[0];
  const answerKey = activeSubQuestion ? `${question.id}:${activeSubQuestion.id}` : null;
  const selectedAnswer = answerKey ? answers[answerKey] : '';

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <button
        type="button"
        onClick={() => setIsSidebarOpen((current) => !current)}
        onMouseEnter={() => setIsSidebarOpen(true)}
        className="absolute left-4 top-4 z-20 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg"
      >
        Passage
      </button>

      <div className="grid min-h-[680px] lg:grid-cols-[320px_1fr]">
        <aside
          onMouseLeave={() => setIsSidebarOpen(false)}
          className={`border-r border-slate-200 bg-[linear-gradient(180deg,#0f172a,#132238)] px-5 pb-5 pt-18 text-[#fff8ea] transition-all duration-300 ${
            isSidebarOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none -translate-x-full opacity-0 lg:pointer-events-auto lg:translate-x-0 lg:opacity-100'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200/75">
            Reading Passage
          </p>
          <div className="mt-4 max-h-[540px] overflow-y-auto pr-2 text-sm leading-7 text-white/82">
            {question.passage || 'No passage text provided for this question.'}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col p-6 pt-18 lg:pt-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Passage Question
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {activeSubQuestion?.question || 'Choose a sub-question to answer'}
            </h2>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {subQuestions.map((subQuestion, index) => {
              const subAnswer = answers[`${question.id}:${subQuestion.id}`];
              const isCurrent = index === activeSubQuestionIndex;

              return (
                <button
                  key={subQuestion.id ?? index}
                  type="button"
                  onClick={() => setActiveSubQuestionIndex(index)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isCurrent
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : subAnswer
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {formatQuestionLabel(index)} {subAnswer ? 'Answered' : 'Open'}
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid flex-1 gap-4 content-start">
            {activeSubQuestion?.options?.map((option, optionIndex) => {
              const isSelected = selectedAnswer === option;

              return (
                <button
                  key={`${activeSubQuestion.id}-${optionIndex}`}
                  type="button"
                  onClick={() => onSelectPassageOption(activeSubQuestion.id, option)}
                  className={`rounded-[1.5rem] border px-5 py-5 text-left transition ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50 shadow-[0_18px_36px_rgba(245,158,11,0.12)]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                        isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className="pt-1 text-base text-slate-800">{option || `Option ${optionIndex + 1}`}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function CodingLayout({ question, answer, onChangeCode, onRunCode }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Coding Prompt
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {summarizeQuestion(question)}
          </h2>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {question.problem || 'No coding prompt provided.'}
          </div>
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Test Cases
              </p>
              <p className="mt-1 text-sm text-slate-600">Sample inputs and expected outputs</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {question.testCases?.length || 0} cases
            </span>
          </div>

          <div className="grid gap-3 p-5">
            {question.testCases?.map((testCase, index) => (
              <div key={`${question.id}-case-${index}`} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Case {index + 1}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Input
                </p>
                <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950 px-4 py-3 text-sm text-sky-100">
                  {testCase.input || '(empty)'}
                </pre>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Expected
                </p>
                <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950 px-4 py-3 text-sm text-emerald-100">
                  {testCase.expected || '(not provided)'}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[#0b1220] text-slate-100 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <div className="flex items-center justify-between border-b border-white/8 bg-[#0f1728] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-100">
              editor.js
            </span>
            <span className="text-sm text-slate-400">LeetCode-style preview workspace</span>
          </div>
          <button
            type="button"
            onClick={onRunCode}
            className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Run Code
          </button>
        </div>

        <div className="grid min-h-[720px] grid-rows-[1fr_220px]">
          <textarea
            value={answer?.code ?? question.code ?? ''}
            onChange={(event) => onChangeCode(event.target.value)}
            className="min-h-[460px] w-full resize-none bg-[#0b1220] px-5 py-5 font-mono text-sm leading-7 text-slate-100 outline-none"
            spellCheck={false}
          />

          <div className="border-t border-white/8 bg-[#050914] px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Terminal Output
              </p>
              <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-slate-300">
                preview
              </span>
            </div>
            <pre className="h-[150px] overflow-auto rounded-[1.25rem] bg-black/35 px-4 py-4 font-mono text-sm leading-6 text-emerald-200">
              {answer?.output || 'Run the code to populate terminal output.'}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}

function BottomNav({ canGoPrevious, canGoNext, onPrevious, onNext }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
      <button
        type="button"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

function ExamPreviewPage() {
  const { examId } = useParams();
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [activePassageSubQuestionIndex, setActivePassageSubQuestionIndex] = useState(0);
  const [isPassageSidebarOpen, setIsPassageSidebarOpen] = useState(false);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setErrorMessage('');

    fetchExam(examId)
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setExam(data);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error.message);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [examId]);

  const sections = useMemo(() => (exam ? getExamSections(exam) : []), [exam]);
  const totalTimeLimit = useMemo(() => getTotalTimeLimit(sections), [sections]);
  const activeSection = sections[activeSectionIndex];
  const activeQuestion = activeSection?.questions?.[activeQuestionIndex];
  const isCreator = exam?.ownerId === user?._id;

  useEffect(() => {
    if (!activeSection) {
      return;
    }

    if (activeQuestionIndex >= activeSection.questions.length) {
      setActiveQuestionIndex(0);
    }

    setActivePassageSubQuestionIndex(0);
    setIsPassageSidebarOpen(false);
  }, [activeSection, activeQuestionIndex]);

  const changeSection = (nextSectionIndex) => {
    setActiveSectionIndex(nextSectionIndex);
    setActiveQuestionIndex(0);
    setActivePassageSubQuestionIndex(0);
  };

  const changeQuestion = (nextQuestionIndex) => {
    setActiveQuestionIndex(nextQuestionIndex);
    setActivePassageSubQuestionIndex(0);
  };

  const handleSelectMcqOption = (option) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [activeQuestion.id]: option,
    }));
  };

  const handleSelectPassageOption = (subQuestionId, option) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [activeQuestion.id]: {
        ...currentAnswers[activeQuestion.id],
        [`${activeQuestion.id}:${subQuestionId}`]: option,
      },
      [`${activeQuestion.id}:${subQuestionId}`]: option,
    }));
  };

  const handleCodingChange = (code) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [activeQuestion.id]: {
        ...currentAnswers[activeQuestion.id],
        code,
        output: currentAnswers[activeQuestion.id]?.output || '',
      },
    }));
  };

  const handleRunCode = () => {
    setAnswers((currentAnswers) => {
      const currentAnswer = currentAnswers[activeQuestion.id] || {
        code: activeQuestion.code || '',
        output: '',
      };

      return {
        ...currentAnswers,
        [activeQuestion.id]: {
          ...currentAnswer,
          output: buildCodingRunOutput(activeQuestion, currentAnswer),
        },
      };
    });
  };

  const canGoPrevious = activeQuestionIndex > 0;
  const canGoNext = activeSection ? activeQuestionIndex < activeSection.questions.length - 1 : false;

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center text-slate-600">
        Loading exam preview...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-[2rem] border border-red-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-600">
            Unable To Load Exam
          </p>
          <p className="mt-3 text-lg text-slate-700">{errorMessage}</p>
          <Link
            to="/create-exam"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white"
          >
            Back to Exam Builder
          </Link>
        </div>
      </div>
    );
  }

  if (!exam || !activeSection || !activeQuestion) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-lg text-slate-700">This exam does not have any previewable questions yet.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Exam Taker UI Preview
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {sections.length} sections • {totalTimeLimit} minutes total
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/available-exams"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Available Exams
            </Link>
            {isCreator ? (
              <Link
                to="/create-exam"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Back to Builder
              </Link>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <SectionTabs
            sections={sections}
            activeSectionIndex={activeSectionIndex}
            onChangeSection={changeSection}
            answers={answers}
          />

          <ExamHeader
            examTitle={exam.title}
            activeSection={activeSection}
            sectionIndex={activeSectionIndex}
            totalSections={sections.length}
            answers={answers}
          />

          {activeQuestion.type === 'mcq' ? (
            <MCQLayout
              question={activeQuestion}
              questions={activeSection.questions}
              activeQuestionIndex={activeQuestionIndex}
              answers={answers}
              onSelectOption={handleSelectMcqOption}
              onJumpToQuestion={changeQuestion}
            />
          ) : null}

          {activeQuestion.type === 'passage' ? (
            <PassageLayout
              question={activeQuestion}
              answers={answers}
              activeSubQuestionIndex={activePassageSubQuestionIndex}
              setActiveSubQuestionIndex={setActivePassageSubQuestionIndex}
              isSidebarOpen={isPassageSidebarOpen}
              setIsSidebarOpen={setIsPassageSidebarOpen}
              onSelectPassageOption={handleSelectPassageOption}
            />
          ) : null}

          {activeQuestion.type === 'coding' ? (
            <CodingLayout
              question={activeQuestion}
              answer={answers[activeQuestion.id]}
              onChangeCode={handleCodingChange}
              onRunCode={handleRunCode}
            />
          ) : null}

          <BottomNav
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onPrevious={() => changeQuestion(activeQuestionIndex - 1)}
            onNext={() => changeQuestion(activeQuestionIndex + 1)}
          />
        </div>
      </div>
    </main>
  );
}

export default ExamPreviewPage;
