import { request } from './apiClient';

export function fetchAssignableUsers() {
  return request('/api/users');
}
