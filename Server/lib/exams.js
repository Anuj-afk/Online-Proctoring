import { serializeUser } from './auth.js';

function createSectionId(index) {
  return `section-${index + 1}`;
}

function normalizeSection(section = {}, index = 0) {
  const questions = Array.isArray(section.questions) ? section.questions : [];
  const parsedTimeLimit = Number.parseInt(section.timeLimitMinutes, 10);

  return {
    id: section.id || createSectionId(index),
    title: typeof section.title === 'string' ? section.title.trim() : '',
    timeLimitMinutes: Number.isFinite(parsedTimeLimit) ? parsedTimeLimit : 0,
    questions,
  };
}

export function normalizeSections(sections, fallbackQuestions = []) {
  if (Array.isArray(sections) && sections.length > 0) {
    return sections.map((section, index) => normalizeSection(section, index));
  }

  if (Array.isArray(fallbackQuestions) && fallbackQuestions.length > 0) {
    return [
      {
        id: createSectionId(0),
        title: 'Section 1',
        timeLimitMinutes: 30,
        questions: fallbackQuestions,
      },
    ];
  }

  return [];
}

export function flattenQuestions(sections) {
  return sections.flatMap((section) =>
    Array.isArray(section.questions) ? section.questions : [],
  );
}

function normalizeUserId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && value._id) {
    return value._id.toString();
  }

  return value.toString();
}

function normalizeAssignedUsers(assignedUsers = []) {
  if (!Array.isArray(assignedUsers)) {
    return [];
  }

  return [...new Set(assignedUsers.map(normalizeUserId).filter(Boolean))];
}

function serializePopulatedUsers(users = []) {
  if (!Array.isArray(users)) {
    return [];
  }

  return users
    .filter((user) => user && typeof user === 'object' && user.email)
    .map((user) => serializeUser(user));
}

export function validateExamPayload(payload = {}) {
  const title = payload.title?.trim();
  const sections = normalizeSections(payload.sections, payload.questions);
  const assignedUsers = normalizeAssignedUsers(payload.assignedUsers);

  if (!title) {
    const error = new Error('Exam title is required.');
    error.statusCode = 400;
    throw error;
  }

  if (sections.length === 0) {
    const error = new Error('Add at least one section before saving the exam.');
    error.statusCode = 400;
    throw error;
  }

  sections.forEach((section, index) => {
    if (!section.title) {
      const error = new Error(`Section ${index + 1} title is required.`);
      error.statusCode = 400;
      throw error;
    }

    if (!Number.isInteger(section.timeLimitMinutes) || section.timeLimitMinutes <= 0) {
      const error = new Error(`Section ${index + 1} must have a valid time limit in minutes.`);
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(section.questions) || section.questions.length === 0) {
      const error = new Error(`Section ${index + 1} must include at least one question.`);
      error.statusCode = 400;
      throw error;
    }
  });

  return {
    title,
    assignedUsers,
    sections,
    questions: flattenQuestions(sections),
  };
}

export function serializeExam(exam) {
  const plainExam = typeof exam.toObject === 'function' ? exam.toObject() : { ...exam };
  const sections = normalizeSections(plainExam.sections, plainExam.questions);
  const ownerId = normalizeUserId(plainExam.owner);
  const assignedUsers = normalizeAssignedUsers(plainExam.assignedUsers);

  return {
    ...plainExam,
    ownerId,
    owner:
      plainExam.owner && typeof plainExam.owner === 'object' && plainExam.owner.email
        ? serializeUser(plainExam.owner)
        : null,
    assignedUsers,
    assignedCandidates: serializePopulatedUsers(plainExam.assignedUsers),
    sections,
    questions: flattenQuestions(sections),
  };
}
