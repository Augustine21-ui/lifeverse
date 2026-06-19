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
  register: (userData) => fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  }).then(handleResponse),

  login: (credentials) => fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  }).then(handleResponse),

  getMe: () => fetch(`${API_BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),

  // Dashboard
  getDashboardStats: () => fetch(`${API_BASE}/dashboard/stats`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),

  recordMood: (mood) => fetch(`${API_BASE}/mood`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify({ mood }),
  }).then(handleResponse),

  getTodayTasks: () => fetch(`${API_BASE}/tasks`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),

  // Updated completeTask to accept optional milestone data
  completeTask: (taskId, options = {}) => {
    const { source, goalId, milestoneId } = options;
    const body = source === 'milestone' ? { source, goalId, milestoneId } : {};
    return fetch(`${API_BASE}/tasks/${taskId}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(body),
    }).then(handleResponse);
  },

  completeFocusSession: (durationMinutes = 25) => fetch(`${API_BASE}/focus/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify({ durationMinutes }),
  }).then(handleResponse),

  // Goals
  getGoals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/goals?${query}` : `${API_BASE}/goals`;
    return fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(handleResponse);
  },
  createGoal: (goal) => fetch(`${API_BASE}/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify(goal),
  }).then(handleResponse),
  deleteGoal: (id) => fetch(`${API_BASE}/goals/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),
  toggleMilestone: (goalId, milestoneId) => fetch(`${API_BASE}/goals/${goalId}/milestones/${milestoneId}/toggle`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),

  // Communities
  getCommunities: () => fetch(`${API_BASE}/communities`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),

  // Badges
  getBadges: () => fetch(`${API_BASE}/badges`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),
  getMyBadges: () => fetch(`${API_BASE}/my-badges`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),

  // Leaderboard
  getLeaderboard: () => fetch(`${API_BASE}/leaderboard`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),

  // Momentum Feed
  createPost: (content, imageUrl) => fetch(`${API_BASE}/feed/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify({ content, imageUrl }),
  }).then(handleResponse),
  getFeedPosts: (limit = 20, offset = 0) => fetch(`${API_BASE}/feed/posts?limit=${limit}&offset=${offset}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  }).then(handleResponse),
  likePost: (postId) => fetch(`${API_BASE}/feed/posts/${postId}/like`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  }).then(handleResponse),
  getComments: (postId) => fetch(`${API_BASE}/feed/posts/${postId}/comments`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  }).then(handleResponse),
  addComment: (postId, content) => fetch(`${API_BASE}/feed/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify({ content }),
  }).then(handleResponse),
  deletePost: (postId) => fetch(`${API_BASE}/feed/posts/${postId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  }).then(handleResponse),

  // Challenges
  getChallenges: () => fetch(`${API_BASE}/challenges`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),
  submitChallenge: (challengeId, submission) => fetch(`${API_BASE}/challenges/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify({ challengeId, submission }),
  }).then(handleResponse),
  getMyChallenges: () => fetch(`${API_BASE}/my-challenges`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),

  // Opportunities
  getOpportunities: () => fetch(`${API_BASE}/opportunities`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),
  applyOpportunity: (opportunityId) => fetch(`${API_BASE}/opportunities/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify({ opportunityId })
  }).then(handleResponse),
  getMyApplications: () => fetch(`${API_BASE}/my-applications`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),

  getBridgeStudentProgress: () => fetch(`${API_BASE}/bridge/my-progress`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(handleResponse),
  getBridgeTeacherStudents: () => fetch(`${API_BASE}/bridge/my-students`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(handleResponse),
  getBridgeParentChild: () => fetch(`${API_BASE}/bridge/my-child`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(handleResponse),
  getBridgeStudentProgressById: (id) => fetch(`${API_BASE}/bridge/student/${id}/progress`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(handleResponse),
  getBridgeAnnouncements: () => fetch(`${API_BASE}/bridge/announcements`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(handleResponse),
  postBridgeAnnouncement: (targetRoles, title, content) => fetch(`${API_BASE}/bridge/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify({ targetRoles, title, content }),
  }).then(handleResponse),

  getResources: (subject) => fetch(`${API_BASE}/resources?subject=${encodeURIComponent(subject)}`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse),
 generateConnectionCode: () => fetch(`${API_BASE}/bridge/generate-code`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse),
linkStudent: (code) => fetch(`${API_BASE}/bridge/link-student`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  body: JSON.stringify({ code })
}).then(handleResponse),

getBridgeCode: () => fetch(`${API_BASE}/bridge/generate-code`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse),

connectBridge: (code) => fetch(`${API_BASE}/bridge/connect`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  body: JSON.stringify({ code })
}).then(handleResponse),

getBridgeStudents: () => fetch(`${API_BASE}/bridge/my-students`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse),

getBridgeChild: () => fetch(`${API_BASE}/bridge/my-child`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse),

getBridgeStudentProgress: (studentId) => fetch(`${API_BASE}/bridge/student/${studentId}/progress`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse),

getBridgeAnnouncements: () => fetch(`${API_BASE}/bridge/announcements`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse),

hasMoodToday: () => fetch(`${API_BASE}/mood/today`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(handleResponse),


  // Parent dashboard
  getParentChildren: () => fetch(`${API_BASE}/parent/children`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),
  getParentChildProgress: (childId) => fetch(`${API_BASE}/parent/child/${childId}/progress`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),

  // Teacher dashboard
  getTeacherStudents: () => fetch(`${API_BASE}/teacher/students`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),
  getTeacherStudentProgress: (studentId) => fetch(`${API_BASE}/teacher/student/${studentId}/progress`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),
  getTeacherClassSummary: () => fetch(`${API_BASE}/teacher/class-summary`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),

  getFocusRemaining: () => fetch(`${API_BASE}/focus/remaining`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse),

  getTodayChallenges: () => fetch(`${API_BASE}/today-challenges`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).then(handleResponse),

  createTask: (task) => fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify(task),
  }).then(handleResponse),

  deleteTask: (taskId) => fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  }).then(handleResponse),

  sendBridgeMessage: (toUserId, content) => fetch(`${API_BASE}/bridge/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  body: JSON.stringify({ toUserId, content }),
}).then(handleResponse),

  getBridgeMessages: (studentId) => fetch(`${API_BASE}/bridge/messages/${studentId}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  }).then(handleResponse),

  getBridgeConversations: () => fetch(`${API_BASE}/bridge/conversations`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse),

  createCommunity: (data) => fetch(`${API_BASE}/communities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: JSON.stringify(data),
  }).then(handleResponse),
  
  joinCommunity: (communityId) => fetch(`${API_BASE}/communities/${communityId}/join`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
}).then(handleResponse),

  getUserCommunities: () => fetch(`${API_BASE}/user/communities`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  }).then(handleResponse),
  joinCommunity: (communityId) => fetch(`${API_BASE}/communities/${communityId}/join`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
}).then(handleResponse),

leaveCommunity: (communityId) => fetch(`${API_BASE}/communities/${communityId}/leave`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
}).then(handleResponse),

getMyCommunities: () => fetch(`${API_BASE}/my-communities`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
}).then(handleResponse),

getBridgePeerContacts: () => fetch(`${API_BASE}/bridge/peer-contacts`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse),

getOrCreatePeerConversation: (userId) => fetch(`${API_BASE}/bridge/conversation/with/${userId}`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse),

getCommunityById: (id) => fetch(`${API_BASE}/communities/${id}`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse),
getCommunityMembers: (id) => fetch(`${API_BASE}/communities/${id}/members`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse),
joinCommunityChat: (id) => fetch(`${API_BASE}/communities/${id}/join-chat`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse),
leaveCommunityChat: (id) => fetch(`${API_BASE}/communities/${id}/leave-chat`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(handleResponse),
getCommunityMessages: (id, before) => {
  const url = before ? `${API_BASE}/communities/${id}/messages?before=${before}` : `${API_BASE}/communities/${id}/messages`;
  return fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(handleResponse);
},
sendCommunityMessage: (id, content) => fetch(`${API_BASE}/communities/${id}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
  body: JSON.stringify({ content })
}).then(handleResponse),
forgotPassword: (email) => fetch(`${API_BASE}/auth/forgot-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
}).then(handleResponse),

resetPassword: (token, newPassword) => fetch(`${API_BASE}/auth/reset-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token, newPassword }),
}).then(handleResponse),

generateTaskQuiz(taskId, topic) {
  return this.post('/tasks/quiz/generate', { taskId, topic });
},
submitTaskQuiz(quizId, answers, userId) {
  return this.post('/tasks/quiz/submit', { quizId, answers, userId });
},
};


