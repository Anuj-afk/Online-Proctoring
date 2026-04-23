import { request } from './apiClient';

export function fetchExams() {
  return request('/api/exams');
}

export function createExam(exam) {
  return request('/api/exams', {
    method: 'POST',
    body: JSON.stringify(exam),
  });
}
