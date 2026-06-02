const BASE = '/api';

const getToken = () => localStorage.getItem('lv_token');

const request = async (path, options = {}) => {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/profile', { method: 'PATCH', body: JSON.stringify(body) }),

  // Dashboard
  getDashboard: () => request('/dashboard'),
  getBadges: () => request('/badges'),
  getLeaderboard: () => request('/leaderboard'),

  // Goals
  getGoals: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/goals${q ? '?' + q : ''}`);
  },
  createGoal: (body) => request('/goals', { method: 'POST', body: JSON.stringify(body) }),
  updateGoal: (id, body) => request(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: 'DELETE' }),
  toggleMilestone: (id) => request(`/milestones/${id}/toggle`, { method: 'PATCH' }),

  // Communities
  getCommunities: () => request('/communities'),
  joinCommunity: (id) => request(`/communities/${id}/join`, { method: 'POST' }),
  leaveCommunity: (id) => request(`/communities/${id}/leave`, { method: 'DELETE' }),
  getPosts: (communityId) => request(`/communities/${communityId}/posts`),
  createPost: (communityId, body) => request(`/communities/${communityId}/posts`, { method: 'POST', body: JSON.stringify(body) }),
  likePost: (postId) => request(`/posts/${postId}/like`, { method: 'POST' }),
};