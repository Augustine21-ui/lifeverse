// frontend/src/services/api.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handleResponse = async (res) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
};



export const api = {
  // Auth
  register: (userData) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    }).then(handleResponse),

  login: (credentials) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }).then(handleResponse),

  getMe: () =>
    fetch(`${API_BASE}/auth/me`).then(handleResponse),

  // Dashboard
  getDashboard: () =>
    fetch(`${API_BASE}/dashboard`).then(handleResponse),

  // Goals

  // Badges

  getBadges: () => fetch(`${API_BASE}/badges`).then(handleResponse),

  getGoals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/goals?${query}` : `${API_BASE}/goals`;
    return fetch(url).then(handleResponse);
  },

  createGoal: (goal) =>
    fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    }).then(handleResponse),

  updateGoal: (id, updates) =>
    fetch(`${API_BASE}/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then(handleResponse),

  deleteGoal: (id) =>
    fetch(`${API_BASE}/goals/${id}`, { method: 'DELETE' }).then(handleResponse),

  toggleMilestone: (milestoneId) =>
    fetch(`${API_BASE}/milestones/${milestoneId}/toggle`, {
      method: 'PATCH',
    }).then(handleResponse),

    getMyStudyGroups: () => fetch(`${API_BASE}/study-groups/my`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse).catch(() => []), // fallback

recordMood: (mood) => fetch(`${API_BASE}/mood`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  body: JSON.stringify({ mood }),
}).then(handleResponse),

 getMastery: () => fetch(`${API_BASE}/skills/mastery`, {
  headers: authHeaders()
}).then(handleResponse),
};