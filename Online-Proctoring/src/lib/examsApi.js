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

export function updateExam(examId, exam) {
  return request(`/api/exams/${examId}`, {
    method: 'PUT',
    body: JSON.stringify(exam),
  });
}
