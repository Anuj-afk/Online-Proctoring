import React, { useState } from 'react';
import MCQQuestion from '../components/exam/MCQQuestion';
import CodingQuestion from '../components/exam/CodingQuestion';
import PassageQuestion from '../components/exam/PassageQuestion';

const CreateExamPage = () => {
  const [examTitle, setExamTitle] = useState('');
  const [questions, setQuestions] = useState([]);

  const addQuestion = (type) => {
    const newQuestion = { id: Date.now(), type };
    if (type === 'mcq') {
      newQuestion.question = '';
      newQuestion.options = ['', '', '', ''];
      newQuestion.correct = '';
    } else if (type === 'coding') {
      newQuestion.problem = '';
      newQuestion.code = '';
      newQuestion.testCases = [{ input: '', expected: '' }];
    } else if (type === 'passage') {
      newQuestion.passage = '';
      newQuestion.questions = [];
    }
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id, updatedQuestion) => {
    setQuestions(questions.map(q => q.id === id ? updatedQuestion : q));
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const saveExam = () => {
    // For now, just log the exam data
    console.log({ title: examTitle, questions });
    alert('Exam saved! Check console for data.');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6">Create Exam</h1>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Exam Title</label>
          <input
            type="text"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter exam title"
          />
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Questions</h2>
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => addQuestion('mcq')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add MCQ
            </button>
            <button
              onClick={() => addQuestion('coding')}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Add Coding Question
            </button>
            <button
              onClick={() => addQuestion('passage')}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Add Passage
            </button>
          </div>
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="border border-gray-200 p-4 rounded">
                {q.type === 'mcq' && (
                  <MCQQuestion
                    question={q}
                    onUpdate={(updated) => updateQuestion(q.id, updated)}
                    onRemove={() => removeQuestion(q.id)}
                  />
                )}
                {q.type === 'coding' && (
                  <CodingQuestion
                    question={q}
                    onUpdate={(updated) => updateQuestion(q.id, updated)}
                    onRemove={() => removeQuestion(q.id)}
                  />
                )}
                {q.type === 'passage' && (
                  <PassageQuestion
                    question={q}
                    onUpdate={(updated) => updateQuestion(q.id, updated)}
                    onRemove={() => removeQuestion(q.id)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={saveExam}
          className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
        >
          Save Exam
        </button>
      </div>
    </div>
  );
};

export default CreateExamPage;