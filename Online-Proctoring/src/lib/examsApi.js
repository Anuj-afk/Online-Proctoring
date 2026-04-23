const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Something went wrong while contacting the server.');
  }

  return data;
}

export function fetchExams() {
  return request('/api/exams');
}

export function createExam(exam) {
  return request('/api/exams', {
    method: 'POST',
    body: JSON.stringify(exam),
  });
}
