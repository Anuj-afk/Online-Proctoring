import React from 'react';

const CodingQuestion = ({ question, onUpdate, onRemove }) => {
  const handleChange = (field, value) => {
    onUpdate({ ...question, [field]: value });
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...question.testCases];
    newTestCases[index][field] = value;
    onUpdate({ ...question, testCases: newTestCases });
  };

  const addTestCase = () => {
    onUpdate({ ...question, testCases: [...question.testCases, { input: '', expected: '' }] });
  };

  const removeTestCase = (index) => {
    const newTestCases = question.testCases.filter((_, i) => i !== index);
    onUpdate({ ...question, testCases: newTestCases });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Coding Question</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Problem Statement</label>
        <textarea
          value={question.problem}
          onChange={(e) => handleChange('problem', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          rows="4"
          placeholder="Describe the coding problem"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Initial Code</label>
        <textarea
          value={question.code}
          onChange={(e) => handleChange('code', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded font-mono"
          rows="10"
          placeholder="Provide initial code or leave blank"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Test Cases</label>
        {question.testCases.map((testCase, index) => (
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
          onClick={addTestCase}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Test Case
        </button>
      </div>
      <button
        onClick={onRemove}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Remove Question
      </button>
    </div>
  );
};

export default CodingQuestion;