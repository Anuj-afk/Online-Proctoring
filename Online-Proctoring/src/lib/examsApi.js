import { request } from './apiClient';

export function fetchExams() {
  return request('/api/exams');
}

export function fetchAvailableExams() {
  return request('/api/exams/available');
}

export function fetchExam(examId) {
  return request(`/api/exams/${examId}`);
}

export function submitExam(examId, submission) {
  return request(`/api/exams/${examId}/submissions`, {
    method: 'POST',
    body: JSON.stringify(submission),
  });
}

export function createExam(exam) {
  return request('/api/exams', {
    method: 'POST',
    body: JSON.stringify(exam),
  });
}

export function updateExam(examId, exam) {
  return request(`/api/exams/${examId}`, {
    method: 'PUT',
    body: JSON.stringify(exam),
  });
}

export function runCode(code, language, input = '') {
  return request('/api/code/run', {
    method: 'POST',
    body: JSON.stringify({ code, language, input }),
  });
}
