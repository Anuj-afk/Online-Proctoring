import React from 'react';
import {
  CODING_LANGUAGE_OPTIONS,
  getCodingLanguageLabel,
  normalizeCodingQuestion,
} from '../../lib/examSections';

const CodingQuestion = ({ question, onUpdate, onRemove }) => {
  const normalizedQuestion = normalizeCodingQuestion(question);

  const handleChange = (field, value) => {
    onUpdate({ ...normalizedQuestion, [field]: value });
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...normalizedQuestion.testCases];
    newTestCases[index][field] = value;
    onUpdate({ ...normalizedQuestion, testCases: newTestCases });
  };

  const addTestCase = () => {
    onUpdate({
      ...normalizedQuestion,
      testCases: [...normalizedQuestion.testCases, { input: '', expected: '' }],
    });
  };

  const removeTestCase = (index) => {
    const newTestCases = normalizedQuestion.testCases.filter((_, i) => i !== index);
    onUpdate({ ...normalizedQuestion, testCases: newTestCases });
  };

  const toggleLanguage = (language) => {
    const isSelected = normalizedQuestion.supportedLanguages.includes(language);

    if (isSelected && normalizedQuestion.supportedLanguages.length === 1) {
      return;
    }

    const selectedLanguages = isSelected
      ? normalizedQuestion.supportedLanguages.filter((value) => value !== language)
      : [...normalizedQuestion.supportedLanguages, language];

    const orderedLanguages = CODING_LANGUAGE_OPTIONS
      .map((option) => option.value)
      .filter((value) => selectedLanguages.includes(value));

    onUpdate(
      normalizeCodingQuestion({
        ...normalizedQuestion,
        supportedLanguages: orderedLanguages,
      }),
    );
  };

  const handleStarterCodeChange = (language, value) => {
    onUpdate(
      normalizeCodingQuestion({
        ...normalizedQuestion,
        starterCodeByLanguage: {
          ...normalizedQuestion.starterCodeByLanguage,
          [language]: value,
        },
      }),
    );
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Coding Question</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Problem Statement</label>
        <textarea
          value={normalizedQuestion.problem}
          onChange={(e) => handleChange('problem', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          rows="4"
          placeholder="Describe the coding problem"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Supported Languages</label>
        <div className="flex flex-wrap gap-3">
          {CODING_LANGUAGE_OPTIONS.map((languageOption) => {
            const isSelected = normalizedQuestion.supportedLanguages.includes(languageOption.value);

            return (
              <label
                key={languageOption.value}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
                  isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleLanguage(languageOption.value)}
                />
                {languageOption.label}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Candidates can switch only between the languages enabled here.
        </p>
      </div>
      <div className="mb-4 space-y-4">
        <label className="block text-sm font-medium mb-1">Starter Code</label>
        {normalizedQuestion.supportedLanguages.map((language) => (
          <div key={language}>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              {getCodingLanguageLabel(language)}
            </label>
            <textarea
              value={normalizedQuestion.starterCodeByLanguage[language] ?? ''}
              onChange={(e) => handleStarterCodeChange(language, e.target.value)}
              className="w-full rounded border border-gray-300 p-2 font-mono"
              rows="10"
              placeholder={`Provide starter code for ${getCodingLanguageLabel(language)}`}
            />
          </div>
        ))}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Test Cases</label>
        {normalizedQuestion.testCases.map((testCase, index) => (
          <div key={index} className="mb-2 p-2 border border-gray-200 rounded">
            <div className="flex space-x-2">
              <input
                type="text"
                value={testCase.input}
                onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded"
                placeholder="Input"
              />
              <input
                type="text"
                value={testCase.expected}
                onChange={(e) => handleTestCaseChange(index, 'expected', e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded"
                placeholder="Expected Output"
              />
              <button
                onClick={() => removeTestCase(index)}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addTestCase}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Test Case
        </button>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Remove Question
      </button>
    </div>
  );
};

export default CodingQuestion;
