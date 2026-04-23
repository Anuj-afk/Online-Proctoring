import { request } from './apiClient';

export function signupUser(payload) {
  return request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchCurrentUser(token) {
  return request('/api/auth/me', { token });
}
