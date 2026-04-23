import React, { useCallback, useEffect, useState } from 'react';
import CodingQuestion from '../components/exam/CodingQuestion';
import MCQQuestion from '../components/exam/MCQQuestion';
import PassageQuestion from '../components/exam/PassageQuestion';
import SavedExamList from '../components/exam/SavedExamList';
import { createExam, fetchExams } from '../lib/examsApi';

function buildQuestion(type) {
  const newQuestion = { id: Date.now() + Math.random(), type };

  if (type === 'mcq') {
    return {
      ...newQuestion,
      question: '',
      options: ['', '', '', ''],
      correct: '',
    };
  }

  if (type === 'coding') {
    return {
      ...newQuestion,
      problem: '',
      code: '',
      testCases: [{ input: '', expected: '' }],
    };
  }

  return {
    ...newQuestion,
    passage: '',
    questions: [],
  };
}

const CreateExamPage = () => {
  const [examTitle, setExamTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [savedExams, setSavedExams] = useState([]);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savedExamsError, setSavedExamsError] = useState('');

  const loadExams = useCallback(async () => {
    setIsLoadingExams(true);
    setSavedExamsError('');

    try {
      const exams = await fetchExams();
      setSavedExams(exams);
    } catch (error) {
      setSavedExamsError(error.message);
    } finally {
      setIsLoadingExams(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const addQuestion = (type) => {
    setQuestions((currentQuestions) => [...currentQuestions, buildQuestion(type)]);
  };

  const updateQuestion = (id, updatedQuestion) => {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question) => (question.id === id ? updatedQuestion : question)),
    );
  };

  const removeQuestion = (id) => {
    setQuestions((currentQuestions) => currentQuestions.filter((question) => question.id !== id));
  };

  const saveExamHandler = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!examTitle.trim()) {
      setErrorMessage('Please enter an exam title.');
      return;
    }

    if (questions.length === 0) {
      setErrorMessage('Add at least one question before saving the exam.');
      return;
    }

    setIsSaving(true);

    try {
      await createExam({
        title: examTitle.trim(),
        questions,
      });

      setSuccessMessage('Exam saved successfully.');
      setExamTitle('');
      setQuestions([]);
      await loadExams();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Exam Builder
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
            Create and store exams
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Save exams to MongoDB from the form below, then review every saved exam in the panel
            on the right.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">Exam Title</label>
              <input
                type="text"
                value={examTitle}
                onChange={(event) => setExamTitle(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                placeholder="Enter exam title"
              />
            </div>

            <div className="mb-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Add Questions</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => addQuestion('mcq')}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  Add MCQ
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('coding')}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  Add Coding Question
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('passage')}
                  className="rounded-full bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
                >
                  Add Passage
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="rounded-3xl border border-slate-200 p-5">
                  {question.type === 'mcq' ? (
                    <MCQQuestion
                      question={question}
                      onUpdate={(updatedQuestion) => updateQuestion(question.id, updatedQuestion)}
                      onRemove={() => removeQuestion(question.id)}
                    />
                  ) : null}

                  {question.type === 'coding' ? (
                    <CodingQuestion
                      question={question}
                      onUpdate={(updatedQuestion) => updateQuestion(question.id, updatedQuestion)}
                      onRemove={() => removeQuestion(question.id)}
                    />
                  ) : null}

                  {question.type === 'passage' ? (
                    <PassageQuestion
                      question={question}
                      onUpdate={(updatedQuestion) => updateQuestion(question.id, updatedQuestion)}
                      onRemove={() => removeQuestion(question.id)}
                    />
                  ) : null}
                </div>
              ))}

              {questions.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No questions added yet.
                </div>
              ) : null}
            </div>

            {errorMessage ? (
              <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </p>
            ) : null}

            <button
              type="button"
              onClick={saveExamHandler}
              disabled={isSaving}
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-slate-900 px-6 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save Exam'}
            </button>
          </section>

          <SavedExamList
            exams={savedExams}
            isLoading={isLoadingExams}
            errorMessage={savedExamsError}
            onRefresh={loadExams}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateExamPage;
