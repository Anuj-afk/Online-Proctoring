import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getExamSections, getTotalTimeLimit, summarizeQuestion } from '../lib/examSections';
import { fetchExam, submitExam } from '../lib/examsApi';
import * as faceapi from 'face-api.js';

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

function formatDate(value) {
  if (!value) {
    return 'Unknown';
  }

  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
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

async function checkCameraAndMicrophone() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera and microphone access is not supported by this browser.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  stream.getTracks().forEach((track) => track.stop());
  return true;
}

function checkConnectionQuality() {
  if (!navigator.onLine) {
    return false;
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) {
    return true;
  }

  if (typeof connection.downlink === 'number' && connection.downlink < 2) {
    return false;
  }

  if (typeof connection.effectiveType === 'string') {
    return !['slow-2g', '2g'].includes(connection.effectiveType);
  }

  return true;
}

async function requestFullScreen() {
  const element = document.documentElement;
  if (document.fullscreenElement) {
    return true;
  }

  if (element.requestFullscreen) {
    await element.requestFullscreen();
    return true;
  }

  if (element.webkitRequestFullscreen) {
    // Safari
    await element.webkitRequestFullscreen();
    return true;
  }

  if (element.msRequestFullscreen) {
    await element.msRequestFullscreen();
    return true;
  }

  throw new Error('Fullscreen is not supported by this browser.');
}

function SectionTabs({ sections, activeSectionIndex, onChangeSection, answers }) {
  return (
    <div className="rounded-[2rem] border border-slate-800/40 bg-[linear-gradient(135deg,#0e1828,#16253c)] p-4 shadow-[0_30px_70px_rgba(6,10,18,0.24)]">
      <div className="flex flex-wrap gap-3">
        {sections.map((section, index) => {
          const attempted = countAttemptedQuestions(section.questions, answers);
          const isActive = index === activeSectionIndex;
          const sectionType = section.questionType ? section.questionType.toUpperCase() : 'MIXED';

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
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">
                  Section {index + 1}
                </p>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-white/80">
                  {sectionType}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold">{section.title}</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/65">
                <span>{section.timeLimitMinutes} min</span>
                <span>{attempted}/{section.questions.length} attempted</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExamHeader({ examTitle, activeSection, sectionIndex, totalSections, answers, faultsRemaining }) {
  const attempted = countAttemptedQuestions(activeSection.questions, answers);
  const sectionType = activeSection.questionType ? activeSection.questionType.toUpperCase() : 'MIXED';

  return (
    <header className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Candidate Workspace
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">{examTitle}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span>Section {sectionIndex + 1} of {totalSections}</span>
            <span className="hidden sm:inline">•</span>
            <span>{activeSection.title}</span>
            <span className="hidden sm:inline">•</span>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
              {sectionType}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
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
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
              Faults remaining
            </p>
            <p className="mt-2 text-2xl font-semibold text-rose-900">{faultsRemaining}</p>
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
  isSubmitted,
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
                onClick={() => !isSubmitted && onSelectOption(option)}
                disabled={isSubmitted}
                className={`rounded-[1.5rem] border px-5 py-5 text-left transition ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-[0_18px_36px_rgba(59,130,246,0.12)]'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                } ${isSubmitted ? 'cursor-not-allowed opacity-70' : ''}`}
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
  isSubmitted,
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
                  onClick={() => !isSubmitted && onSelectPassageOption(activeSubQuestion.id, option)}
                  disabled={isSubmitted}
                  className={`rounded-[1.5rem] border px-5 py-5 text-left transition ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50 shadow-[0_18px_36px_rgba(245,158,11,0.12)]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  } ${isSubmitted ? 'cursor-not-allowed opacity-70' : ''}`}
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

function CodingLayout({ question, answer, onChangeCode, onRunCode, isSubmitted }) {
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
            disabled={isSubmitted}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-slate-950 transition ${
              isSubmitted ? 'bg-slate-400 cursor-not-allowed opacity-70' : 'bg-emerald-400 hover:bg-emerald-300'
            }`}
          >
            Run Code
          </button>
        </div>

        <div className="grid min-h-[720px] grid-rows-[1fr_220px]">
          <textarea
            value={answer?.code ?? question.code ?? ''}
            onChange={(event) => !isSubmitted && onChangeCode(event.target.value)}
            readOnly={isSubmitted}
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

function BottomNav({ canGoPrevious, canGoNext, onPrevious, onNext, onSubmit, submitLabel, submitDisabled, isSubmitting }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-center gap-3">
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

      {onSubmit ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting…' : submitLabel}
        </button>
      ) : null}
    </div>
  );
}

function ExamPage() {
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
  const [isPreflightComplete, setIsPreflightComplete] = useState(false);
  const [preflightError, setPreflightError] = useState('');
  const [isRunningPreflight, setIsRunningPreflight] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [faceDetectionStatus, setFaceDetectionStatus] = useState('waiting for preflight');
  const [faceDetectionError, setFaceDetectionError] = useState('');
  const [voiceDetectionStatus, setVoiceDetectionStatus] = useState('waiting for preflight');
  const [faceDetectionCount, setFaceDetectionCount] = useState(0);
  const [faultCount, setFaultCount] = useState(0);
  const faceDetectionCleanup = useRef(null);
  const voiceDetectionCleanup = useRef(null);
  const [preflightReport, setPreflightReport] = useState({
    camera: false,
    microphone: false,
    connection: false,
    fullscreen: Boolean(document.fullscreenElement),
  });
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    if (exam?.mySubmission) {
      setHasSubmitted(true);
      setSubmissionMessage('This exam has already been submitted.');
    }
  }, [exam]);

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
  const faultThreshold = exam?.allowedFaults ?? 3;
  const faultsRemaining = Math.max(0, faultThreshold - faultCount);
  const autoSubmitRef = useRef(false);

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
  const isLastQuestion = activeSection
    ? activeQuestionIndex === activeSection.questions.length - 1
    : false;

  useEffect(() => {
    const onFullscreenChange = () => {
      const fullscreenState = Boolean(document.fullscreenElement);
      setIsFullscreen(fullscreenState);
      setPreflightReport((currentReport) => ({
        ...currentReport,
        fullscreen: fullscreenState,
      }));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  async function runPreflightChecks() {
    setIsRunningPreflight(true);
    setPreflightError('');

    try {
      const connectionOk = checkConnectionQuality();
      setPreflightReport((currentReport) => ({
        ...currentReport,
        connection: connectionOk,
      }));

      if (!connectionOk) {
        throw new Error(
          'Stable network connection was not detected. Please connect to a stronger network and try again.'
        );
      }

      await checkCameraAndMicrophone();
      setPreflightReport((currentReport) => ({
        ...currentReport,
        camera: true,
        microphone: true,
      }));

      await requestFullScreen();
      setIsFullscreen(Boolean(document.fullscreenElement));
      setPreflightReport((currentReport) => ({
        ...currentReport,
        fullscreen: true,
      }));
      setIsPreflightComplete(true);
    } catch (error) {
      setPreflightError(error?.message || 'Preflight checks failed. Please retry with the requested permissions.');
    } finally {
      setIsRunningPreflight(false);
    }
  }

  async function startFaceDetection() {
    try {
      console.log('Starting face detection');
      setFaceDetectionError('');
      setFaceDetectionStatus('loading models');
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      if (!faceapi.nets.tinyFaceDetector.isLoaded) {
        throw new Error('Tiny face detector model did not load');
      }

      const video = document.createElement('video');
      video.style.display = 'none';
      document.body.appendChild(video);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await video.play();

      setFaceDetectionStatus('active');
      setFaceDetectionCount(0);

      const interval = setInterval(async () => {
        if (video.readyState >= 2) {
          const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
          console.log('Face detection run, faces:', detections.length);
          setFaceDetectionCount(detections.length);
          if (detections.length === 0) {
            setFaceDetectionStatus('no face detected');
            setFaultCount((count) => count + 1);
            console.log('Fault detected: No face detected');
          } else if (detections.length > 1) {
            setFaceDetectionStatus('multiple faces detected');
            setFaultCount((count) => count + 1);
            console.log('Fault detected: Multiple faces detected');
          } else {
            setFaceDetectionStatus('face detected');
          }
        } else {
          console.log('Face detection waiting for video readyState:', video.readyState);
        }
      }, 2000); // Check every 2 seconds

      const cleanup = () => {
        clearInterval(interval);
        stream.getTracks().forEach((track) => track.stop());
        if (document.body.contains(video)) {
          document.body.removeChild(video);
        }
        setFaceDetectionStatus('inactive');
      };

      faceDetectionCleanup.current = cleanup;
      return cleanup;
    } catch (error) {
      console.error('Face detection failed:', error);
      setFaceDetectionStatus('failed');
      setFaceDetectionError(error?.message || 'Unknown face detection error');
    }
  }

  async function startVoiceDetection() {
    try {
      console.log('Starting voice detection');
      setVoiceDetectionStatus('starting');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyser.fftSize = 512;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let running = true;
      const checkVoice = () => {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i += 1) {
          const normalized = (dataArray[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / bufferLength);
        if (rms > 0.05) {
          setVoiceDetectionStatus('voice detected');
          setFaultCount((count) => count + 1);
          console.log('Fault detected: Voice detected', { rms });
        } else {
          setVoiceDetectionStatus('silent');
        }
        if (running) {
          requestAnimationFrame(checkVoice);
        }
      };

      setVoiceDetectionStatus('active');
      checkVoice();

      const cleanup = () => {
        running = false;
        stream.getTracks().forEach((track) => track.stop());
        audioContext.close();
        setVoiceDetectionStatus('inactive');
      };

      voiceDetectionCleanup.current = cleanup;
      return cleanup;
    } catch (error) {
      console.error('Voice detection failed:', error);
      setVoiceDetectionStatus('failed');
    }
  }

  const handleSubmitExam = useCallback(async (autoSubmitted = false) => {
    setSubmissionError('');
    setSubmissionMessage('');
    setIsSubmitting(true);

    try {
      await submitExam(examId, {
        answers,
        submittedAt: new Date().toISOString(),
        faultsTriggered: faultCount,
        autoSubmitted,
      });

      setHasSubmitted(true);
      setSubmissionMessage(
        autoSubmitted
          ? 'Your exam was automatically submitted after a security fault threshold was exceeded.'
          : 'Your exam has been submitted successfully.',
      );
    } catch (error) {
      setSubmissionError(error.message || 'Unable to submit the exam. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [examId, answers, faultCount]);

  useEffect(() => {
    const startDetection = async () => {
      if (faceDetectionCleanup.current) {
        faceDetectionCleanup.current();
        faceDetectionCleanup.current = null;
      }
      if (voiceDetectionCleanup.current) {
        voiceDetectionCleanup.current();
        voiceDetectionCleanup.current = null;
      }

      setFaultCount(0);

      if (isPreflightComplete && !hasSubmitted && !isCreator) {
        await startFaceDetection();
        await startVoiceDetection();
      } else {
        setFaceDetectionStatus(isPreflightComplete ? 'inactive' : 'waiting for preflight');
        setVoiceDetectionStatus(isPreflightComplete ? 'inactive' : 'waiting for preflight');
      }
    };

    startDetection();

    return () => {
      if (faceDetectionCleanup.current) {
        faceDetectionCleanup.current();
      }
      if (voiceDetectionCleanup.current) {
        voiceDetectionCleanup.current();
      }
    };
  }, [isPreflightComplete, hasSubmitted, isCreator]);

  useEffect(() => {
    if (
      !isCreator &&
      isPreflightComplete &&
      !hasSubmitted &&
      !autoSubmitRef.current &&
      faultThreshold >= 0 &&
      faultCount >= faultThreshold
    ) {
      autoSubmitRef.current = true;
      setSubmissionMessage('Security threshold exceeded. Submitting exam automatically.');
      handleSubmitExam(true);
    }
  }, [faultCount, faultThreshold, hasSubmitted, isCreator, isPreflightComplete, handleSubmitExam]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center text-slate-600">
        Loading exam...
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
          <p className="text-lg text-slate-700">This exam does not have any questions configured yet.</p>
        </div>
      </div>
    );
  }

  if (!isCreator && !isPreflightComplete) {
    return (
      <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Pre-Exam Security Check
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
              Verify your exam environment before starting
            </h1>
            <p className="mt-3 text-slate-600">
              To protect exam integrity, camera and microphone access, a stable connection, and full-screen mode are required before the exam begins.
            </p>

            <div className="mt-8 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Camera access', passed: preflightReport.camera },
                  { label: 'Microphone access', passed: preflightReport.microphone },
                  { label: 'Stable network', passed: preflightReport.connection },
                  { label: 'Full-screen mode', passed: preflightReport.fullscreen },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-3xl border p-5 transition ${
                      item.passed
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.18em]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {item.passed ? 'Ready' : 'Pending'}
                    </p>
                  </div>
                ))}
              </div>

              {preflightError ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {preflightError}
                </div>
              ) : null}

              <button
                type="button"
                onClick={runPreflightChecks}
                disabled={isRunningPreflight}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRunningPreflight ? 'Checking environment…' : 'Run preflight checks and start exam'}
              </button>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">How this works</p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Camera and microphone permission is requested by your browser.</li>
                  <li>Network quality is verified before the exam starts.</li>
                  <li>Full-screen mode is required so switching away from the exam is monitored.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Exam Session
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {sections.length} sections • {totalTimeLimit} minutes total
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
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
          {isCreator ? (
            <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Candidate Submissions
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Submission history</h2>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {exam.submissions?.length || 0} submitted
                </span>
              </div>

              {exam.submissions?.length ? (
                <div className="space-y-3">
                  {exam.submissions.map((submission, index) => (
                    <div
                      key={`${submission.candidate?.email || index}-${submission.submittedAt}`}
                      className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {submission.candidate?.name || 'Unknown candidate'}
                          </p>
                          <p className="text-sm text-slate-500">{submission.candidate?.email || ''}</p>
                        </div>
                        <p className="text-sm text-slate-500">{formatDate(submission.submittedAt)}</p>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Attempted</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {countAttemptedQuestions(sections.flatMap((section) => section.questions), submission.answers)} questions
                          </p>
                        </div>
                        <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Faults triggered</p>
                          <p className="mt-1 font-semibold text-slate-900">{submission.faultsTriggered ?? 0}</p>
                        </div>
                        <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Submission type</p>
                          <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${submission.autoSubmitted ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {submission.autoSubmitted ? 'Auto submit' : 'Manual'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-6 text-sm text-slate-600">
                  No submissions have been received yet.
                </div>
              )}
            </section>
          ) : null}

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
            faultsRemaining={faultsRemaining}
          />

          {activeQuestion.type === 'mcq' ? (
            <MCQLayout
              question={activeQuestion}
              questions={activeSection.questions}
              activeQuestionIndex={activeQuestionIndex}
              answers={answers}
              onSelectOption={handleSelectMcqOption}
              onJumpToQuestion={changeQuestion}
              isSubmitted={hasSubmitted}
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
              isSubmitted={hasSubmitted}
            />
          ) : null}

          {!isCreator ? (
            <div className="mb-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700 shadow-sm">
              <p className="font-semibold uppercase tracking-[0.16em] text-slate-500">
                Exam guidance
              </p>
              <p className="mt-2 text-base text-slate-900">
                Keep your face visible and the environment quiet. Your exam will auto-submit once the allowed fault threshold is reached.
              </p>
            </div>
          ) : null}

          {!isCreator ? (
            <div className="fixed bottom-4 right-4 z-40 w-80 rounded-[1.5rem] border border-slate-200 bg-white/95 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-lg">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Proctoring Debug
                </p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-600">
                  Live
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Face Detection</p>
                  <p className="mt-2 font-semibold text-slate-900">{faceDetectionStatus}</p>
                  <p className="mt-1 text-xs text-slate-500">Faces detected: {faceDetectionCount}</p>
                  {faceDetectionError ? (
                    <p className="mt-2 text-xs text-red-600">Error: {faceDetectionError}</p>
                  ) : null}
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Voice Detection</p>
                  <p className="mt-2 font-semibold text-slate-900">{voiceDetectionStatus}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Fault Threshold</p>
                  <p className="mt-2 font-semibold text-slate-900">{faultCount}/{faultThreshold}</p>
                  <p className="mt-1 text-xs text-slate-500">Faults trigger automatic submission.</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Exam State</p>
                  <p className="mt-2 font-semibold text-slate-900">{hasSubmitted ? 'Submitted' : 'In progress'}</p>
                </div>
              </div>
            </div>
          ) : null}

          {activeQuestion.type === 'coding' ? (
            <CodingLayout
              question={activeQuestion}
              answer={answers[activeQuestion.id]}
              onChangeCode={handleCodingChange}
              onRunCode={handleRunCode}
              isSubmitted={hasSubmitted}
            />
          ) : null}

          {submissionMessage ? (
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
              {submissionMessage}
            </div>
          ) : null}
          {submissionError ? (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {submissionError}
            </div>
          ) : null}

          <BottomNav
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onPrevious={() => changeQuestion(activeQuestionIndex - 1)}
            onNext={() => changeQuestion(activeQuestionIndex + 1)}
            onSubmit={!isCreator ? handleSubmitExam : undefined}
            submitLabel={hasSubmitted ? 'Submitted' : 'Submit Exam'}
            submitDisabled={isSubmitting || hasSubmitted}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </main>
  );
}

export default ExamPage;
