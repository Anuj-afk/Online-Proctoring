function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function buildQuestion(type) {
  const baseQuestion = { id: createId('question'), type };

  if (type === 'mcq') {
    return {
      ...baseQuestion,
      question: '',
      options: ['', '', '', ''],
      correct: '',
    };
  }

  if (type === 'coding') {
    return {
      ...baseQuestion,
      problem: '',
      code: '',
      testCases: [{ input: '', expected: '' }],
    };
  }

  return {
    ...baseQuestion,
    passage: '',
    questions: [],
  };
}

export function buildSection(sectionNumber = 1) {
  return {
    id: createId('section'),
    title: `Section ${sectionNumber}`,
    timeLimitMinutes: 30,
    questions: [],
  };
}

function normalizeSection(section = {}, index = 0) {
  return {
    id: section.id || createId('section'),
    title: section.title || `Section ${index + 1}`,
    timeLimitMinutes: Number.parseInt(section.timeLimitMinutes, 10) || 30,
    questions: Array.isArray(section.questions) ? section.questions : [],
  };
}

export function getExamSections(exam = {}) {
  if (Array.isArray(exam.sections) && exam.sections.length > 0) {
    return exam.sections.map(normalizeSection);
  }

  if (Array.isArray(exam.questions) && exam.questions.length > 0) {
    return [
      {
        id: createId('section'),
        title: 'Section 1',
        timeLimitMinutes: 30,
        questions: exam.questions,
      },
    ];
  }

  return [buildSection(1)];
}

export function normalizeExamForEditor(exam) {
  return {
    _id: exam._id,
    title: exam.title || '',
    sections: getExamSections(exam).map((section, index) => normalizeSection(section, index)),
  };
}

export function flattenQuestionsFromSections(sections) {
  return sections.flatMap((section) => section.questions || []);
}

export function countQuestionTypes(questions) {
  return questions.reduce(
    (counts, question) => {
      counts[question.type] = (counts[question.type] || 0) + 1;
      return counts;
    },
    { mcq: 0, coding: 0, passage: 0 },
  );
}

export function summarizeQuestion(question) {
  return (
    question.question ||
    question.problem ||
    question.passage?.slice(0, 140) ||
    'Question content saved.'
  );
}

export function getTotalTimeLimit(sections) {
  return sections.reduce(
    (totalMinutes, section) => totalMinutes + (Number.parseInt(section.timeLimitMinutes, 10) || 0),
    0,
  );
}
