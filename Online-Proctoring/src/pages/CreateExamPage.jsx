import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CodingQuestion from '../components/exam/CodingQuestion';
import MCQQuestion from '../components/exam/MCQQuestion';
import PassageQuestion from '../components/exam/PassageQuestion';
import SavedExamList from '../components/exam/SavedExamList';
import { useAuth } from '../context/AuthContext';
import { buildQuestion, buildSection, normalizeExamForEditor } from '../lib/examSections';
import { createExam, fetchExams, updateExam } from '../lib/examsApi';
import { fetchAssignableUsers } from '../lib/usersApi';

const CreateExamPage = () => {
  const { logout, user } = useAuth();
  const [examTitle, setExamTitle] = useState('');
  const [assignedUserIds, setAssignedUserIds] = useState([]);
  const [allowedFaults, setAllowedFaults] = useState(3);
  const [sections, setSections] = useState(() => [buildSection(1)]);
  const [editingExamId, setEditingExamId] = useState(null);
  const [savedExams, setSavedExams] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [savedExamsError, setSavedExamsError] = useState('');
  const [usersError, setUsersError] = useState('');

  const resetBuilder = useCallback(() => {
    setExamTitle('');
    setAssignedUserIds([]);
    setAllowedFaults(3);
    setSections([buildSection(1)]);
    setEditingExamId(null);
    setErrorMessage('');
    setSuccessMessage('');
  }, []);

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

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setUsersError('');

    try {
      const users = await fetchAssignableUsers();
      setAvailableUsers(users);
    } catch (error) {
      setUsersError(error.message);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
    loadUsers();
  }, [loadExams, loadUsers]);

  const addSection = () => {
    setSections((currentSections) => [...currentSections, buildSection(currentSections.length + 1)]);
  };

  const updateSection = (sectionId, updates) => {
    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section,
      ),
    );
  };

  const removeSection = (sectionId) => {
    setSections((currentSections) => {
      if (currentSections.length === 1) {
        return [buildSection(1)];
      }

      return currentSections.filter((section) => section.id !== sectionId);
    });
  };

  const addQuestion = (sectionId, type) => {
    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? { ...section, questions: [...section.questions, buildQuestion(type)] }
          : section,
      ),
    );
  };

  const updateQuestion = (sectionId, questionId, updatedQuestion) => {
    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.map((question) =>
                question.id === questionId ? updatedQuestion : question,
              ),
            }
          : section,
      ),
    );
  };

  const removeQuestion = (sectionId, questionId) => {
    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.filter((question) => question.id !== questionId),
            }
          : section,
      ),
    );
  };

  const toggleAssignedUser = (userId) => {
    setAssignedUserIds((currentIds) =>
      currentIds.includes(userId)
        ? currentIds.filter((currentId) => currentId !== userId)
        : [...currentIds, userId],
    );
  };

  const editExamHandler = (exam) => {
    const normalizedExam = normalizeExamForEditor(exam);
    setEditingExamId(normalizedExam._id);
    setExamTitle(normalizedExam.title);
    setAssignedUserIds(normalizedExam.assignedUsers || []);
    setAllowedFaults(Number.isInteger(normalizedExam.allowedFaults) ? normalizedExam.allowedFaults : 3);
    setSections(normalizedExam.sections);
    setErrorMessage('');
    setSuccessMessage(`Editing "${normalizedExam.title}".`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateExam = () => {
    if (!Number.isInteger(Number.parseInt(allowedFaults, 10)) || Number.parseInt(allowedFaults, 10) < 0) {
      return 'Allowed faults must be a non-negative integer.';
    }

    if (!examTitle.trim()) {
      return 'Please enter an exam title.';
    }

    if (sections.length === 0) {
      return 'Add at least one section before saving the exam.';
    }

    for (const [index, section] of sections.entries()) {
      if (!section.title.trim()) {
        return `Enter a title for section ${index + 1}.`;
      }

      const timeLimitMinutes = Number.parseInt(section.timeLimitMinutes, 10);

      if (!Number.isInteger(timeLimitMinutes) || timeLimitMinutes <= 0) {
        return `Enter a valid time limit for section ${index + 1}.`;
      }

      if (!Array.isArray(section.questions) || section.questions.length === 0) {
        return `Add at least one question to section ${index + 1}.`;
      }
    }

    return '';
  };

  const saveExamHandler = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const validationMessage = validateExam();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSaving(true);

    const payload = {
      title: examTitle.trim(),
      assignedUsers: assignedUserIds,
      allowedFaults: Number.isInteger(Number.parseInt(allowedFaults, 10))
        ? Number.parseInt(allowedFaults, 10)
        : 3,
      sections,
    };

    try {
      const savedExam = editingExamId
        ? await updateExam(editingExamId, payload)
        : await createExam(payload);

      const normalizedExam = normalizeExamForEditor(savedExam);

      setEditingExamId(normalizedExam._id);
      setExamTitle(normalizedExam.title);
      setAssignedUserIds(normalizedExam.assignedUsers || []);
      setAllowedFaults(normalizedExam.allowedFaults);
      setSections(normalizedExam.sections);
      setSuccessMessage(editingExamId ? 'Exam updated successfully.' : 'Exam saved successfully.');
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
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Creator Workspace
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {user?.name} ({user?.email})
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/available-exams"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Candidate Dashboard
            </Link>
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Home
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
            Exam Builder
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
            {editingExamId ? 'Edit your exam' : 'Create and assign exams'}
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Build section-based exams, choose exactly which users can take them, and reopen saved
            exams for editing whenever needed.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium text-slate-700">Exam Title</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(event) => setExamTitle(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                  placeholder="Enter exam title"
                />
              </div>

              <div className="w-full max-w-[240px]">
                <label className="mb-2 block text-sm font-medium text-slate-700">Allowed Faults</label>
                <input
                  type="number"
                  min="0"
                  value={allowedFaults}
                  onChange={(event) => setAllowedFaults(Number(event.target.value))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                  placeholder="3"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Auto-submit after this many faults.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={addSection}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Add Section
                </button>
                <button
                  type="button"
                  onClick={resetBuilder}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white"
                >
                  {editingExamId ? 'Create New Exam' : 'Reset Builder'}
                </button>
              </div>
            </div>

            <div className="mb-6 rounded-[2rem] border border-slate-200 bg-slate-50/80 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Allowed Candidates
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Select which users can see this exam in their dashboard.
                  </p>
                </div>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  {assignedUserIds.length} selected
                </span>
              </div>

              {isLoadingUsers ? <p className="text-sm text-slate-500">Loading users...</p> : null}

              {!isLoadingUsers && usersError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {usersError}
                </p>
              ) : null}

              {!isLoadingUsers && !usersError && availableUsers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
                  No other registered users are available yet.
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                {availableUsers.map((candidate) => {
                  const isSelected = assignedUserIds.includes(candidate._id);

                  return (
                    <label
                      key={candidate._id}
                      className={`flex cursor-pointer items-start gap-4 rounded-[1.5rem] border px-4 py-4 transition ${
                        isSelected
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAssignedUser(candidate._id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{candidate.name}</p>
                        <p className="text-sm text-slate-500">{candidate.email}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              {sections.map((section, sectionIndex) => (
                <section
                  key={section.id}
                  className="rounded-[2rem] border border-slate-200 bg-slate-50/70 p-5"
                >
                  <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="grid flex-1 gap-4 md:grid-cols-[1fr_220px]">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Section Title
                        </span>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(event) =>
                            updateSection(section.id, { title: event.target.value })
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                          placeholder={`Section ${sectionIndex + 1}`}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Time Limit (minutes)
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={section.timeLimitMinutes}
                          onChange={(event) =>
                            updateSection(section.id, { timeLimitMinutes: event.target.value })
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-500"
                          placeholder="30"
                        />
                      </label>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Section {sectionIndex + 1}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {section.questions.length} questions
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        disabled={sections.length === 1}
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-red-200 px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove Section
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => addQuestion(section.id, 'mcq')}
                      className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      Add MCQ
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion(section.id, 'coding')}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                    >
                      Add Coding Question
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion(section.id, 'passage')}
                      className="rounded-full bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
                    >
                      Add Passage
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    {section.questions.map((question) => (
                      <div
                        key={question.id}
                        className="rounded-3xl border border-slate-200 bg-white p-5"
                      >
                        {question.type === 'mcq' ? (
                          <MCQQuestion
                            question={question}
                            onUpdate={(updatedQuestion) =>
                              updateQuestion(section.id, question.id, updatedQuestion)
                            }
                            onRemove={() => removeQuestion(section.id, question.id)}
                          />
                        ) : null}

                        {question.type === 'coding' ? (
                          <CodingQuestion
                            question={question}
                            onUpdate={(updatedQuestion) =>
                              updateQuestion(section.id, question.id, updatedQuestion)
                            }
                            onRemove={() => removeQuestion(section.id, question.id)}
                          />
                        ) : null}

                        {question.type === 'passage' ? (
                          <PassageQuestion
                            question={question}
                            onUpdate={(updatedQuestion) =>
                              updateQuestion(section.id, question.id, updatedQuestion)
                            }
                            onRemove={() => removeQuestion(section.id, question.id)}
                          />
                        ) : null}
                      </div>
                    ))}

                    {section.questions.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                        No questions in this section yet.
                      </div>
                    ) : null}
                  </div>
                </section>
              ))}
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
              {isSaving
                ? editingExamId
                  ? 'Updating...'
                  : 'Saving...'
                : editingExamId
                  ? 'Update Exam'
                  : 'Save Exam'}
            </button>
          </section>

          <SavedExamList
            exams={savedExams}
            isLoading={isLoadingExams}
            errorMessage={savedExamsError}
            onEdit={editExamHandler}
            onRefresh={loadExams}
            activeExamId={editingExamId}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateExamPage;
