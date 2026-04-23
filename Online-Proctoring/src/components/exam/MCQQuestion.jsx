import React from 'react';

const MCQQuestion = ({ question, onUpdate, onRemove }) => {
  const handleChange = (field, value) => {
    onUpdate({ ...question, [field]: value });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...question.options];
    newOptions[index] = value;
    onUpdate({ ...question, options: newOptions });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Multiple Choice Question</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Question</label>
        <textarea
          value={question.question}
          onChange={(e) => handleChange('question', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          rows="3"
          placeholder="Enter the question"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Options</label>
        {question.options.map((option, index) => (
          <input
            key={index}
            type="text"
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            className="w-full p-2 mb-2 border border-gray-300 rounded"
            placeholder={`Option ${index + 1}`}
          />
        ))}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Correct Answer</label>
        <select
          value={question.correct}
          onChange={(e) => handleChange('correct', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">Select correct option</option>
          {question.options.map((option, index) => (
            <option key={index} value={option}>{option || `Option ${index + 1}`}</option>
          ))}
        </select>
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

export default MCQQuestion;