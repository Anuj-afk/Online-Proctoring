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

export function validateExamPayload(payload = {}) {
  const title = payload.title?.trim();
  const sections = normalizeSections(payload.sections, payload.questions);

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
    sections,
    questions: flattenQuestions(sections),
  };
}

export function serializeExam(exam) {
  const plainExam = typeof exam.toObject === 'function' ? exam.toObject() : { ...exam };
  const sections = normalizeSections(plainExam.sections, plainExam.questions);

  return {
    ...plainExam,
    sections,
    questions: flattenQuestions(sections),
  };
}
