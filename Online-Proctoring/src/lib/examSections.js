function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export const CODING_LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
];

export const DEFAULT_CODING_LANGUAGE = CODING_LANGUAGE_OPTIONS[0].value;

function getAllCodingLanguages() {
  return CODING_LANGUAGE_OPTIONS.map((option) => option.value);
}

function normalizeCodingLanguages(supportedLanguages) {
  const allowedLanguages = new Set(getAllCodingLanguages());
  const normalizedLanguages = (Array.isArray(supportedLanguages) ? supportedLanguages : [])
    .map((language) => (typeof language === 'string' ? language.toLowerCase() : ''))
    .filter((language) => allowedLanguages.has(language));

  return normalizedLanguages.length > 0
    ? [...new Set(normalizedLanguages)]
    : getAllCodingLanguages();
}

export function getCodingLanguageLabel(language) {
  return CODING_LANGUAGE_OPTIONS.find((option) => option.value === language)?.label || language;
}

export function normalizeCodingQuestion(question = {}) {
  const supportedLanguages = normalizeCodingLanguages(question.supportedLanguages);
  const starterCodeSource =
    question.starterCodeByLanguage && typeof question.starterCodeByLanguage === 'object'
      ? question.starterCodeByLanguage
      : {};
  const legacyJavaScriptStarterCode = typeof question.code === 'string' ? question.code : '';

  const starterCodeByLanguage = supportedLanguages.reduce((accumulator, language) => {
    const starterCode = starterCodeSource[language];

    accumulator[language] =
      typeof starterCode === 'string'
        ? starterCode
        : language === 'javascript'
          ? legacyJavaScriptStarterCode
          : '';

    return accumulator;
  }, {});

  const testCases =
    Array.isArray(question.testCases) && question.testCases.length > 0
      ? question.testCases.map((testCase) => ({
          input: typeof testCase?.input === 'string' ? testCase.input : '',
          expected: typeof testCase?.expected === 'string' ? testCase.expected : '',
        }))
      : [{ input: '', expected: '' }];

  return {
    ...question,
    type: 'coding',
    problem: typeof question.problem === 'string' ? question.problem : '',
    supportedLanguages,
    starterCodeByLanguage,
    code: starterCodeByLanguage.javascript ?? legacyJavaScriptStarterCode,
    testCases,
  };
}

export function getCodingStarterCode(question, language = DEFAULT_CODING_LANGUAGE) {
  return normalizeCodingQuestion(question).starterCodeByLanguage[language] ?? '';
}

export function normalizeQuestion(question = {}) {
  if (question.type === 'coding') {
    return normalizeCodingQuestion(question);
  }

  return question;
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
    return normalizeCodingQuestion({
      ...baseQuestion,
      problem: '',
      code: '',
      supportedLanguages: getAllCodingLanguages(),
      starterCodeByLanguage: {},
      testCases: [{ input: '', expected: '' }],
    });
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
    questionType: '',
    questions: [],
  };
}

function normalizeSection(section = {}, index = 0) {
  const questions = Array.isArray(section.questions) ? section.questions : [];
  const questionType = section.questionType
    || (questions.length > 0 && typeof questions[0].type === 'string' ? questions[0].type : '');

  return {
    id: section.id || createId('section'),
    title: section.title || `Section ${index + 1}`,
    timeLimitMinutes: Number.parseInt(section.timeLimitMinutes, 10) || 30,
    questionType,
    questions: questions.map(normalizeQuestion),
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
        questions: exam.questions.map(normalizeQuestion),
      },
    ];
  }

  return [buildSection(1)];
}

export function normalizeExamForEditor(exam) {
  return {
    _id: exam._id,
    title: exam.title || '',
    assignedUsers: Array.isArray(exam.assignedUsers)
      ? exam.assignedUsers.map((user) => (typeof user === 'string' ? user : user?._id)).filter(Boolean)
      : [],
    allowedFaults: Number.isInteger(Number.parseInt(exam.allowedFaults, 10))
      ? Number.parseInt(exam.allowedFaults, 10)
      : 3,
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
