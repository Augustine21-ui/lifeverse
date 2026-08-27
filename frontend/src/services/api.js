// frontend/src/services/api.js
// ✅ Updated - Added generic get/post/put/patch/delete methods
// Original methods remain untouched




const API_BASE = 'https://lifeverse-1.onrender.com/api';
console.log('🔌 API_BASE:', API_BASE);

const handleResponse = async (res) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    if (res.status === 403 && error.error?.toLowerCase().includes('subscription')) {
      if (!window.location.pathname.includes('/subscription-required')) {
        window.location.href = '/subscription-required';
      }
    }
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const api = {
  // =============================================
  //          🔧 GENERIC API METHODS
  //          (Added for Orbit and other services)
  // =============================================

  /**
   * Generic GET request
   * Usage: await api.get('/orbit/progress')
   */
  get: (url) => {
    return fetch(`${API_BASE}${url}`, {
      method: 'GET',
      headers: authHeaders(),
    }).then(handleResponse);
  },

  /**
   * Generic POST request
   * Usage: await api.post('/orbit/session/start', { subject, topic })
   */
  post: (url, data) => {
    return fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse);
  },

  /**
   * Generic PUT request
   * Usage: await api.put('/orbit/session/end', { sessionId })
   */
  put: (url, data) => {
    return fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse);
  },

  /**
   * Generic PATCH request
   * Usage: await api.patch('/orbit/session/123', { status: 'completed' })
   */
  patch: (url, data) => {
    return fetch(`${API_BASE}${url}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse);
  },

  /**
   * Generic DELETE request
   * Usage: await api.delete('/orbit/session/123')
   */
  delete: (url) => {
    return fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(handleResponse);
  },

  // =============================================
  //          ORIGINAL METHODS (UNTOUCHED)
  // =============================================

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
    headers: authHeaders()
  }).then(handleResponse),

  // Dashboard
  getDashboardStats: () => fetch(`${API_BASE}/dashboard/stats`, {
    headers: authHeaders()
  }).then(handleResponse),

  recordMood: (mood) => fetch(`${API_BASE}/mood`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ mood }),
  }).then(handleResponse),

  getTodayTasks: () => fetch(`${API_BASE}/tasks`, {
    headers: authHeaders()
  }).then(handleResponse),

  completeTask: (taskId, options = {}) => {
    const { source, goalId, milestoneId } = options;
    const body = source === 'milestone' ? { source, goalId, milestoneId } : {};
    return fetch(`${API_BASE}/tasks/${taskId}/complete`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse);
  },

  completeFocusSession: (durationMinutes = 25) => fetch(`${API_BASE}/focus/session`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ durationMinutes }),
  }).then(handleResponse),

  // Goals
  getGoals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/goals?${query}` : `${API_BASE}/goals`;
    return fetch(url, { headers: authHeaders() }).then(handleResponse);
  },
  createGoal: (goal) => fetch(`${API_BASE}/goals`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(goal),
  }).then(handleResponse),
  deleteGoal: (id) => fetch(`${API_BASE}/goals/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  }).then(handleResponse),
  toggleMilestone: (goalId, milestoneId) => fetch(`${API_BASE}/goals/${goalId}/milestones/${milestoneId}/toggle`, {
    method: 'PATCH',
    headers: authHeaders()
  }).then(handleResponse),

  // Communities
  getCommunities: () => fetch(`${API_BASE}/communities`, {
    headers: authHeaders()
  }).then(handleResponse),

  // Badges
  getBadges: () => fetch(`${API_BASE}/badges`, {
    headers: authHeaders()
  }).then(handleResponse),
  getMyBadges: () => fetch(`${API_BASE}/my-badges`, {
    headers: authHeaders()
  }).then(handleResponse),

  // Leaderboard
  getLeaderboard: (type = 'xp', limit = 50) => {
    const url = `${API_BASE}/leaderboard?type=${type}&limit=${limit}`;
    return fetch(url, {
      headers: authHeaders()
    }).then(handleResponse);
  },

  // Momentum Feed
  createPost: (content, imageUrl) => fetch(`${API_BASE}/feed/posts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content, imageUrl }),
  }).then(handleResponse),
  getFeedPosts: (limit = 20, offset = 0) => fetch(`${API_BASE}/feed/posts?limit=${limit}&offset=${offset}`, {
    headers: authHeaders(),
  }).then(handleResponse),
  likePost: (postId) => fetch(`${API_BASE}/feed/posts/${postId}/like`, {
    method: 'POST',
    headers: authHeaders(),
  }).then(handleResponse),
  getComments: (postId) => fetch(`${API_BASE}/feed/posts/${postId}/comments`, {
    headers: authHeaders(),
  }).then(handleResponse),
  addComment: (postId, content) => fetch(`${API_BASE}/feed/posts/${postId}/comments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  }).then(handleResponse),
  deletePost: (postId) => fetch(`${API_BASE}/feed/posts/${postId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse),

  // Challenges
  getChallenges: () => fetch(`${API_BASE}/challenges`, {
    headers: authHeaders()
  }).then(handleResponse),
  submitChallenge: (challengeId, submission) => fetch(`${API_BASE}/challenges/submit`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ challengeId, submission }),
  }).then(handleResponse),
  getMyChallenges: () => fetch(`${API_BASE}/my-challenges`, {
    headers: authHeaders()
  }).then(handleResponse),

  // Opportunities
  getOpportunities: () => fetch(`${API_BASE}/opportunities`, {
    headers: authHeaders()
  }).then(handleResponse),
  applyOpportunity: (opportunityId) => fetch(`${API_BASE}/opportunities/apply`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ opportunityId })
  }).then(handleResponse),
  getMyApplications: () => fetch(`${API_BASE}/my-applications`, {
    headers: authHeaders()
  }).then(handleResponse),

  // Bridge
  getBridgeStudentProgress: () => fetch(`${API_BASE}/bridge/my-progress`, { headers: authHeaders() }).then(handleResponse),
  getBridgeTeacherStudents: () => fetch(`${API_BASE}/bridge/my-students`, { headers: authHeaders() }).then(handleResponse),
  getBridgeParentChild: () => fetch(`${API_BASE}/bridge/my-child`, { headers: authHeaders() }).then(handleResponse),
  getBridgeStudentProgressById: (id) => fetch(`${API_BASE}/bridge/student/${id}/progress`, { headers: authHeaders() }).then(handleResponse),
  getBridgeAnnouncements: () => fetch(`${API_BASE}/bridge/announcements`, { headers: authHeaders() }).then(handleResponse),
  postBridgeAnnouncement: (targetRoles, title, content) => fetch(`${API_BASE}/bridge/announcements`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ targetRoles, title, content }),
  }).then(handleResponse),

  getResources: (subject) => fetch(`${API_BASE}/resources?subject=${encodeURIComponent(subject)}`, {
    headers: authHeaders()
  }).then(handleResponse),
  generateConnectionCode: () => fetch(`${API_BASE}/bridge/generate-code`, {
    headers: authHeaders()
  }).then(handleResponse),
  linkStudent: (code) => fetch(`${API_BASE}/bridge/link-student`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ code })
  }).then(handleResponse),
  getBridgeCode: () => fetch(`${API_BASE}/bridge/generate-code`, {
    headers: authHeaders()
  }).then(handleResponse),
  connectBridge: (code) => fetch(`${API_BASE}/bridge/connect`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ code })
  }).then(handleResponse),
  getBridgeStudents: () => fetch(`${API_BASE}/bridge/my-students`, {
    headers: authHeaders()
  }).then(handleResponse),
  getBridgeChild: () => fetch(`${API_BASE}/bridge/my-child`, {
    headers: authHeaders()
  }).then(handleResponse),
  getBridgeStudentProgress: (studentId) => fetch(`${API_BASE}/bridge/student/${studentId}/progress`, {
    headers: authHeaders()
  }).then(handleResponse),
  hasMoodToday: () => fetch(`${API_BASE}/mood/today`, { headers: authHeaders() }).then(handleResponse),

  // Parent dashboard
  getParentChildren: () => fetch(`${API_BASE}/parent/children`, {
    headers: authHeaders()
  }).then(handleResponse),
  getParentChildProgress: () => fetch(`${API_BASE}/bridge/parent-child-progress`, {
    headers: authHeaders()
  }).then(handleResponse),

  // Teacher dashboard
  getTeacherStudents: () => fetch(`${API_BASE}/teacher/students`, {
    headers: authHeaders()
  }).then(handleResponse),
  getTeacherStudentProgress: (studentId) => fetch(`${API_BASE}/teacher/student/${studentId}/progress`, {
    headers: authHeaders()
  }).then(handleResponse),
  getTeacherClassSummary: () => fetch(`${API_BASE}/teacher/class-summary`, {
    headers: authHeaders()
  }).then(handleResponse),

  getFocusRemaining: () => fetch(`${API_BASE}/focus/remaining`, {
    headers: authHeaders()
  }).then(handleResponse),

  getTodayChallenges: () => fetch(`${API_BASE}/today-challenges`, {
    headers: authHeaders()
  }).then(handleResponse),

  createTask: (task) => fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(task),
  }).then(handleResponse),

  deleteTask: (taskId) => fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse),

  sendBridgeMessage: (toUserId, content) => fetch(`${API_BASE}/bridge/messages`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ toUserId, content }),
  }).then(handleResponse),

  getBridgeMessages: (studentId) => fetch(`${API_BASE}/bridge/messages/${studentId}`, {
    headers: authHeaders(),
  }).then(handleResponse),

  getBridgeConversations: () => fetch(`${API_BASE}/bridge/conversations`, {
    headers: authHeaders()
  }).then(handleResponse),

  createCommunity: (data) => fetch(`${API_BASE}/communities`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),
  
  joinCommunity: (communityId) => fetch(`${API_BASE}/communities/${communityId}/join`, {
    method: 'POST',
    headers: authHeaders(),
  }).then(handleResponse),

  getUserCommunities: () => fetch(`${API_BASE}/user/communities`, {
    headers: authHeaders(),
  }).then(handleResponse),

  leaveCommunity: (communityId) => fetch(`${API_BASE}/communities/${communityId}/leave`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse),

  getMyCommunities: () => fetch(`${API_BASE}/my-communities`, {
    headers: authHeaders(),
  }).then(handleResponse),

  getBridgePeerContacts: () => fetch(`${API_BASE}/bridge/peer-contacts`, {
    headers: authHeaders()
  }).then(handleResponse),

  getOrCreatePeerConversation: (userId) => fetch(`${API_BASE}/bridge/conversation/with/${userId}`, {
    headers: authHeaders()
  }).then(handleResponse),

  getCommunityById: (id) => fetch(`${API_BASE}/communities/${id}`, {
    headers: authHeaders()
  }).then(handleResponse),
  getCommunityMembers: (id) => fetch(`${API_BASE}/communities/${id}/members`, {
    headers: authHeaders()
  }).then(handleResponse),
  joinCommunityChat: (id) => fetch(`${API_BASE}/communities/${id}/join-chat`, {
    method: 'POST',
    headers: authHeaders()
  }).then(handleResponse),
  leaveCommunityChat: (id) => fetch(`${API_BASE}/communities/${id}/leave-chat`, {
    method: 'DELETE',
    headers: authHeaders()
  }).then(handleResponse),
  getCommunityMessages: (id, before) => {
    const url = before ? `${API_BASE}/communities/${id}/messages?before=${before}` : `${API_BASE}/communities/${id}/messages`;
    return fetch(url, { headers: authHeaders() }).then(handleResponse);
  },
  sendCommunityMessage: (id, content) => fetch(`${API_BASE}/communities/${id}/messages`, {
    method: 'POST',
    headers: authHeaders(),
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

  generateTaskQuiz: (taskId, topic) => fetch(`${API_BASE}/tasks/quiz/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ taskId, topic })
  }).then(handleResponse),

  submitTaskQuiz: (quizId, answers, userId) => fetch(`${API_BASE}/tasks/quiz/submit`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ quizId, answers, userId })
  }).then(handleResponse),

  // ===== PERSONALIZATION =====
  getRecommendations: () => fetch(`${API_BASE}/personalize/recommendations`, {
    headers: authHeaders()
  }).then(handleResponse),

  generatePersonalization: () => fetch(`${API_BASE}/personalize/generate`, {
    method: 'POST',
    headers: authHeaders()
  }).then(handleResponse),

  actOnRecommendation: (id) => fetch(`${API_BASE}/personalize/recommendations/${id}/act`, {
    method: 'PUT',
    headers: authHeaders()
  }).then(handleResponse),

  // ===== ADMIN =====
  adminGetStats: () => fetch(`${API_BASE}/admin/stats`, {
    headers: authHeaders()
  }).then(handleResponse),

  adminGetPerformance: () => fetch(`${API_BASE}/admin/performance`, {
    headers: authHeaders()
  }).then(handleResponse),

  adminGetUsers: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/admin/users?${query}`, {
      headers: authHeaders()
    }).then(handleResponse);
  },

  adminUpdateUser: (id, data) => fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  adminDeleteUser: (id) => fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  }).then(handleResponse),

  adminGetSubscriptions: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/admin/subscriptions?${query}`, {
      headers: authHeaders()
    }).then(handleResponse);
  },

  adminUpdateSubscription: (id, data) => fetch(`${API_BASE}/admin/subscriptions/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  adminCreateSubscription: (data) => fetch(`${API_BASE}/admin/subscriptions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  adminGetAnnouncements: () => fetch(`${API_BASE}/admin/announcements`, {
    headers: authHeaders()
  }).then(handleResponse),

  adminCreateAnnouncement: (data) => fetch(`${API_BASE}/admin/announcements`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  sendEncouragement: (studentId, content) => fetch(`${API_BASE}/bridge/encouragement`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ studentId, content }),
  }).then(handleResponse),

  getNotifications: () => fetch(`${API_BASE}/bridge/notifications`, {
    headers: authHeaders()
  }).then(handleResponse),

  markNotificationRead: (id) => fetch(`${API_BASE}/bridge/notifications/${id}/read`, {
    method: 'PUT',
    headers: authHeaders()
  }).then(handleResponse),

  getMyStudyGroups: () => fetch(`${API_BASE}/study-groups/my`, {
    headers: authHeaders()
  }).then(handleResponse),

  // =============================================
  //          🚀 ORBIT API ENDPOINTS
  // =============================================

  /**
   * Start a new Orbit session.
   * @param {Object} data - { subject, topic, mixup }
   */
  startOrbitSession: (data) => fetch(`${API_BASE}/orbit/session/start`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  /**
   * Generate activities for a specific mode.
   * @param {Object} data - { subject, topic, grade, types }
   */
  generateOrbitActivities: (data) => fetch(`${API_BASE}/orbit/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  /**
   * Submit an answer for an activity.
   * @param {Object} data - { sessionId, activityId, answer, time }
   */
  submitOrbitFeedback: (data) => fetch(`${API_BASE}/orbit/feedback`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  /**
   * End an Orbit session.
   * @param {Object} data - { sessionId, score, completed }
   */
  endOrbitSession: (data) => fetch(`${API_BASE}/orbit/session/end`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  /**
   * Get user's weak areas.
   */
  getOrbitWeaknesses: () => fetch(`${API_BASE}/orbit/weaknesses`, {
    headers: authHeaders()
  }).then(handleResponse),

  // Study context
  getCurrentStudy: () => fetch(`${API_BASE}/study/current`, {
    headers: authHeaders()
  }).then(handleResponse),

  updateCurrentStudy: (data) => fetch(`${API_BASE}/study/current`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  // For subjects (mock or replace with real endpoint)
  getSubjects: () => Promise.resolve([
    { id: 1, name: 'Biology' },
    { id: 2, name: 'Mathematics' },
    { id: 3, name: 'Physics' },
    { id: 4, name: 'Chemistry' },
  ]),

  getMastery: () => fetch(`${API_BASE}/skills/mastery`, {
    headers: authHeaders()
  }).then(handleResponse),

  updateTask: (taskId, data) => fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  // Academic Hub APIs
  getCountries: () => fetch(`${API_BASE}/academic/countries`, {
    headers: authHeaders()
  }).then(handleResponse),

  getInstitutions: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/academic/institutions?${query}`, {
      headers: authHeaders()
    }).then(handleResponse);
  },

  getCurricula: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/academic/curricula?${query}`, {
      headers: authHeaders()
    }).then(handleResponse);
  },

  saveAcademicInfo: (data) => fetch(`${API_BASE}/academic/academic-info`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  getAcademicInfo: () => fetch(`${API_BASE}/academic/academic-info`, {
    headers: authHeaders()
  }).then(handleResponse),

  getSubjects: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/academic/subjects?${query}`, {
      headers: authHeaders()
    }).then(handleResponse);
  },

  getTopics: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/academic/topics?${query}`, {
      headers: authHeaders()
    }).then(handleResponse);
  },

  uploadMaterial: (data) => fetch(`${API_BASE}/academic/materials`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  getMaterials: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/academic/materials?${query}`, {
      headers: authHeaders()
    }).then(handleResponse);
  },

  getAssignments: () => fetch(`${API_BASE}/academic/assignments`, {
    headers: authHeaders()
  }).then(handleResponse),

  getTimetable: () => fetch(`${API_BASE}/academic/timetable`, {
    headers: authHeaders()
  }).then(handleResponse),

  // Settings
  getSettings: () => fetch(`${API_BASE}/settings`, {
    headers: authHeaders()
  }).then(handleResponse),

  updateSettings: (data) => fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  // Subscription
  getSubscriptionPlans: () => fetch(`${API_BASE}/subscription/plans`, {
    headers: authHeaders()
  }).then(handleResponse),

  createCheckoutSession: (data) => fetch(`${API_BASE}/subscription/create-checkout`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  getMySubscription: () => fetch(`${API_BASE}/subscription/my-subscription`, {
    headers: authHeaders()
  }).then(handleResponse),

  startFreeTrial: (data) => fetch(`${API_BASE}/subscription/start-trial`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  getTrialStatus: () => fetch(`${API_BASE}/subscription/trial-status`, {
    headers: authHeaders()
  }).then(handleResponse),

  getSubscriptionStatus: () => fetch(`${API_BASE}/subscription/status`, {
    headers: authHeaders()
  }).then(handleResponse),

  // Momentum APIs
  getCommunities: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/momentum/communities?${query}`, {
      headers: authHeaders()
    }).then(handleResponse);
  },
  getCommunity: (id) => fetch(`${API_BASE}/momentum/communities/${id}`, {
    headers: authHeaders()
  }).then(handleResponse),
  createCommunity: (data) => fetch(`${API_BASE}/momentum/communities`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),
  joinCommunity: (id) => fetch(`${API_BASE}/momentum/communities/${id}/join`, {
    method: 'POST',
    headers: authHeaders()
  }).then(handleResponse),
  getCommunityPosts: (id, params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/momentum/communities/${id}/posts?${query}`, {
      headers: authHeaders()
    }).then(handleResponse);
  },
  createPost: (data) => fetch(`${API_BASE}/momentum/posts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),
  toggleLike: (postId) => fetch(`${API_BASE}/momentum/posts/${postId}/like`, {
    method: 'POST',
    headers: authHeaders()
  }).then(handleResponse),
  getComments: (postId) => fetch(`${API_BASE}/momentum/posts/${postId}/comments`, {
    headers: authHeaders()
  }).then(handleResponse),
  addComment: (postId, content) => fetch(`${API_BASE}/momentum/posts/${postId}/comments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  }).then(handleResponse),
  getCommunityEvents: (id) => fetch(`${API_BASE}/momentum/communities/${id}/events`, {
    headers: authHeaders()
  }).then(handleResponse),
  rsvpEvent: (eventId, status) => fetch(`${API_BASE}/momentum/events/${eventId}/rsvp`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  }).then(handleResponse),

  // Institution endpoints
getInstitutionDashboard: () => api.get('/institution/dashboard'),
updateStudentGroup: (data) => api.put('/institution/students/group', data),

// Groups
getGroups: () => api.get('/institution/groups'),
createGroup: (data) => api.post('/institution/groups', data),
updateGroup: (id, data) => api.put(`/institution/groups/${id}`, data),
deleteGroup: (id) => api.delete(`/institution/groups/${id}`),

// Timetable
getTimetableByGroup: (groupId) => api.get(`/institution/timetable/group/${groupId}`),
uploadTimetableCSV: (formData) => api.post('/institution/timetable/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
}),

// Resources
createResource: (data) => api.post('/institution/resources', data),
getResources: (targetType, targetId) => api.get(`/institution/resources/${targetType}/${targetId}`),

// Announcements
createAnnouncement: (data) => api.post('/institution/announcements', data),
getAnnouncements: () => api.get('/institution/announcements'),

// Teacher assignments
assignTeacher: (data) => api.post('/institution/assign', data),
removeTeacherAssignment: (teacherId, groupId) => api.delete(`/institution/assign/${teacherId}/${groupId}`),

// StudySphere
getStudentStudySphere: () => api.get('/institution/studysphere'),
getHierarchy: () => api.get('/institution/hierarchy'),
getStudentSubjects: () => api.get('/institution/student-subjects'),

// Goals
getGoals: () => api.get('/goals'),
createGoal: (data) => api.post('/goals', data),
updateGoal: (id, data) => api.put(`/goals/${id}`, data),
deleteGoal: (id) => api.delete(`/goals/${id}`),

// Skills
getSkills: () => api.get('/skills'),
getUserSkills: () => api.get('/user-skills'),
updateUserSkill: (data) => api.put('/user-skills', data),
getSkillsSummary: () => api.get('/skills-summary'),

getUserBadges: () => api.get('/my-badges'),
getBadges: () => api.get('/badges'),
};