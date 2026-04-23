import React, { useState } from 'react';

const PassageQuestion = ({ question, onUpdate, onRemove }) => {
  const [newMCQ, setNewMCQ] = useState({ question: '', options: ['', '', '', ''], correct: '' });

  const handleChange = (field, value) => {
    onUpdate({ ...question, [field]: value });
  };

  const addMCQ = () => {
    const updatedQuestions = [...question.questions, { ...newMCQ, id: Date.now() }];
    onUpdate({ ...question, questions: updatedQuestions });
    setNewMCQ({ question: '', options: ['', '', '', ''], correct: '' });
  };

  const updateMCQ = (id, updatedMCQ) => {
    const updatedQuestions = question.questions.map(q => q.id === id ? updatedMCQ : q);
    onUpdate({ ...question, questions: updatedQuestions });
  };

  const removeMCQ = (id) => {
    const updatedQuestions = question.questions.filter(q => q.id !== id);
    onUpdate({ ...question, questions: updatedQuestions });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Passage with Questions</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Passage Text</label>
        <textarea
          value={question.passage}
          onChange={(e) => handleChange('passage', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          rows="6"
          placeholder="Enter the passage text"
        />
      </div>
      <div className="mb-4">
        <h4 className="text-md font-semibold mb-2">Related MCQs</h4>
        {question.questions.map((mcq) => (
          <div key={mcq.id} className="mb-4 p-4 border border-gray-200 rounded">
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Question</label>
              <textarea
                value={mcq.question}
                onChange={(e) => updateMCQ(mcq.id, { ...mcq, question: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                rows="2"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Options</label>
              {mcq.options.map((option, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...mcq.options];
                    newOptions[idx] = e.target.value;
                    updateMCQ(mcq.id, { ...mcq, options: newOptions });
                  }}
                  className="w-full p-2 mb-1 border border-gray-300 rounded"
                  placeholder={`Option ${idx + 1}`}
                />
              ))}
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Correct Answer</label>
              <select
                value={mcq.correct}
                onChange={(e) => updateMCQ(mcq.id, { ...mcq, correct: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Select correct option</option>
                {mcq.options.map((option, idx) => (
                  <option key={idx} value={option}>{option || `Option ${idx + 1}`}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => removeMCQ(mcq.id)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Remove MCQ
            </button>
          </div>
        ))}
        <div className="p-4 border border-gray-200 rounded">
          <h5 className="text-sm font-semibold mb-2">Add New MCQ</h5>
          <div className="mb-2">
            <textarea
              value={newMCQ.question}
              onChange={(e) => setNewMCQ({ ...newMCQ, question: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded"
              rows="2"
              placeholder="Question"
            />
          </div>
          <div className="mb-2">
            {newMCQ.options.map((option, idx) => (
              <input
                key={idx}
                type="text"
                value={option}
                onChange={(e) => {
                  const newOptions = [...newMCQ.options];
                  newOptions[idx] = e.target.value;
                  setNewMCQ({ ...newMCQ, options: newOptions });
                }}
                className="w-full p-2 mb-1 border border-gray-300 rounded"
                placeholder={`Option ${idx + 1}`}
              />
            ))}
          </div>
          <div className="mb-2">
            <select
              value={newMCQ.correct}
              onChange={(e) => setNewMCQ({ ...newMCQ, correct: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Select correct option</option>
              {newMCQ.options.map((option, idx) => (
                <option key={idx} value={option}>{option || `Option ${idx + 1}`}</option>
              ))}
            </select>
          </div>
          <button
            onClick={addMCQ}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add MCQ
          </button>
        </div>
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

export default PassageQuestion;