// frontend/src/services/api.js
// ✅ Day 1 fix: 401 auto-logout handler
// ✅ Cleaned: removed duplicate method definitions (kept the correct ones)

const API_BASE = 'https://lifeverse-1.onrender.com/api';
console.log('🔌 API_BASE:', API_BASE);

const handleResponse = async (res) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));

    // ─── 401 Unauthorized → auto logout ────────────────────
    if (res.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        console.warn('🔒 Session expired — redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const redirect = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?expired=1&redirect=${redirect}`;
      }
      throw new Error('Session expired. Please log in again.');
    }

    // ─── 403 Subscription → subscription-required ──────────
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
  // =============================================
  get: (url) => {
    return fetch(`${API_BASE}${url}`, {
      method: 'GET',
      headers: authHeaders(),
    }).then(handleResponse);
  },

  post: (url, data) => {
    return fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse);
  },

  put: (url, data) => {
    return fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse);
  },

  patch: (url, data) => {
    return fetch(`${API_BASE}${url}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse);
  },

  delete: (url) => {
    return fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(handleResponse);
  },

  // =============================================
  //          AUTH
  // =============================================
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

  verifyEmail: (email, code) => fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  }).then(handleResponse),

  resendVerification: (email) => fetch(`${API_BASE}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then(handleResponse),

  // =============================================
  //          DASHBOARD & TASKS
  // =============================================
  getDashboardStats: () => fetch(`${API_BASE}/dashboard/stats`, {
    headers: authHeaders()
  }).then(handleResponse),

  recordMood: (mood) => fetch(`${API_BASE}/mood`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ mood }),
  }).then(handleResponse),

  hasMoodToday: () => fetch(`${API_BASE}/mood/today`, {
    headers: authHeaders()
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

  createTask: (task) => fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(task),
  }).then(handleResponse),

  updateTask: (taskId, data) => fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  deleteTask: (taskId) => fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse),

  completeFocusSession: (durationMinutes = 25) => fetch(`${API_BASE}/focus/session`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ durationMinutes }),
  }).then(handleResponse),

  getFocusRemaining: () => fetch(`${API_BASE}/focus/remaining`, {
    headers: authHeaders()
  }).then(handleResponse),

  getTodayChallenges: () => fetch(`${API_BASE}/today-challenges`, {
    headers: authHeaders()
  }).then(handleResponse),

  // =============================================
  //          GOALS
  // =============================================
  getGoals: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/goals?${query}` : `${API_BASE}/goals`;
    return fetch(url, { headers: authHeaders() }).then(handleResponse);
  },

  createGoal: (data) => fetch(`${API_BASE}/goals`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  updateGoal: (id, data) => fetch(`${API_BASE}/goals/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  deleteGoal: (id) => fetch(`${API_BASE}/goals/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  }).then(handleResponse),

  toggleMilestone: (goalId, milestoneId) => fetch(`${API_BASE}/goals/${goalId}/milestones/${milestoneId}/toggle`, {
    method: 'PATCH',
    headers: authHeaders()
  }).then(handleResponse),

  completeGoal: (goalId) => fetch(`${API_BASE}/goals/${goalId}/complete`, {
    method: 'POST',
    headers: authHeaders(),
  }).then(handleResponse),

  // =============================================
  //          SKILLS
  // =============================================
  getSkills: () => fetch(`${API_BASE}/skills`, {
    headers: authHeaders()
  }).then(handleResponse),

  getUserSkills: () => fetch(`${API_BASE}/user-skills`, {
    headers: authHeaders()
  }).then(handleResponse),

  updateUserSkill: (data) => fetch(`${API_BASE}/user-skills`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  getSkillsSummary: () => fetch(`${API_BASE}/skills-summary`, {
    headers: authHeaders()
  }).then(handleResponse),

  createSkill: (data) => fetch(`${API_BASE}/skills/create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  getMastery: () => fetch(`${API_BASE}/skills/mastery`, {
    headers: authHeaders()
  }).then(handleResponse),

  // ─── Skill Growth ───
  getSkillProgress: (skillId) => fetch(`${API_BASE}/skills/${skillId}/progress`, {
    headers: authHeaders()
  }).then(handleResponse),

  getProjects: (skillId) => fetch(`${API_BASE}/skills/${skillId}/projects`, {
    headers: authHeaders()
  }).then(handleResponse),

  assignProject: (projectId) => fetch(`${API_BASE}/projects/assign`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ projectId })
  }).then(handleResponse),

  updateProjectAssignment: (assignmentId, data) => fetch(`${API_BASE}/project-assignments/${assignmentId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse),

  getUserProjects: (skillId) => fetch(`${API_BASE}/skills/${skillId}/my-projects`, {
    headers: authHeaders()
  }).then(handleResponse),

  getChallenges: (skillId) => fetch(`${API_BASE}/skills/${skillId}/challenges`, {
    headers: authHeaders()
  }).then(handleResponse),

  getUserChallengeSubmissions: (skillId) => fetch(`${API_BASE}/skills/${skillId}/my-challenges`, {
    headers: authHeaders()
  }).then(handleResponse),

  getPracticeActivities: (skillId) => fetch(`${API_BASE}/skills/${skillId}/practice`, {
    headers: authHeaders()
  }).then(handleResponse),

  submitPracticeResult: (data) => fetch(`${API_BASE}/practice/submit`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  getUserPracticeResults: (skillId) => fetch(`${API_BASE}/skills/${skillId}/my-practice`, {
    headers: authHeaders()
  }).then(handleResponse),

  getRecommendations: (skillId) => fetch(`${API_BASE}/skills/${skillId}/recommendations`, {
    headers: authHeaders()
  }).then(handleResponse),

  // =============================================
  //          BADGES
  // =============================================
  getBadges: () => fetch(`${API_BASE}/badges`, {
    headers: authHeaders()
  }).then(handleResponse),

  getUserBadges: () => fetch(`${API_BASE}/my-badges`, {
    headers: authHeaders()
  }).then(handleResponse),

  getMyBadges: () => fetch(`${API_BASE}/my-badges`, {
    headers: authHeaders()
  }).then(handleResponse),

  // =============================================
  //          LEADERBOARD
  // =============================================
  getLeaderboard: (type = 'xp', limit = 50) => {
    const url = `${API_BASE}/leaderboard?type=${type}&limit=${limit}`;
    return fetch(url, {
      headers: authHeaders()
    }).then(handleResponse);
  },

  // =============================================
  //          FEED
  // =============================================
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

  // =============================================
  //          CHALLENGES
  // =============================================
  getMyChallenges: () => fetch(`${API_BASE}/my-challenges`, {
    headers: authHeaders()
  }).then(handleResponse),

  submitChallenge: (data) => fetch(`${API_BASE}/challenges/submit`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  // =============================================
  //          OPPORTUNITIES (Phase D)
  // =============================================
  getOpportunitiesPersonalized: () => fetch(`${API_BASE}/opportunities/personalized`, {
    headers: authHeaders(),
  }).then(handleResponse),

  getOpportunities: (params) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    const url = query ? `${API_BASE}/opportunities?${query}` : `${API_BASE}/opportunities`;
    return fetch(url, { headers: authHeaders() }).then(handleResponse);
  },

  getOpportunity: (id) => fetch(`${API_BASE}/opportunities/${id}`, {
    headers: authHeaders()
  }).then(handleResponse),

  applyOpportunity: (id) => fetch(`${API_BASE}/opportunities/${id}/apply`, {
    method: 'POST',
    headers: authHeaders(),
  }).then(handleResponse),

  getMyApplications: () => fetch(`${API_BASE}/my-applications`, {
    headers: authHeaders()
  }).then(handleResponse),

  getPendingApplications: () => fetch(`${API_BASE}/opportunities/applications/pending`, {
    headers: authHeaders(),
  }).then(handleResponse),

  approveApplication: (id) => fetch(`${API_BASE}/opportunities/applications/${id}/approve`, {
    method: 'POST',
    headers: authHeaders(),
  }).then(handleResponse),

  rejectApplication: (id) => fetch(`${API_BASE}/opportunities/applications/${id}/reject`, {
    method: 'POST',
    headers: authHeaders(),
  }).then(handleResponse),

  // =============================================
  //          MENTORSHIP (Phase D)
  // =============================================
  listMentors: () => fetch(`${API_BASE}/mentorship/mentors`, {
    headers: authHeaders(),
  }).then(handleResponse),

  registerAsMentor: (data) => fetch(`${API_BASE}/mentorship/mentors/register`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  requestMentorship: (mentorId, topic) => fetch(`${API_BASE}/mentorship/request`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ mentorId, topic }),
  }).then(handleResponse),

  acceptMentorship: (linkId) => fetch(`${API_BASE}/mentorship/${linkId}/accept`, {
    method: 'POST',
    headers: authHeaders(),
  }).then(handleResponse),

  getMyMentorships: () => fetch(`${API_BASE}/mentorship/my`, {
    headers: authHeaders(),
  }).then(handleResponse),

  // =============================================
  //          ORBIT
  // =============================================
  startOrbitSession: (data) => fetch(`${API_BASE}/orbit/session/start`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  generateOrbitActivities: (data) => fetch(`${API_BASE}/orbit/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  submitOrbitFeedback: (data) => fetch(`${API_BASE}/orbit/feedback`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  endOrbitSession: (data) => fetch(`${API_BASE}/orbit/session/end`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  getOrbitWeaknesses: () => fetch(`${API_BASE}/orbit/weaknesses`, {
    headers: authHeaders()
  }).then(handleResponse),

  getOrbitSessionCount: () => fetch(`${API_BASE}/orbit/sessions/count`, {
    headers: authHeaders(),
  }).then(handleResponse),

  getStackedSuggestions: () => fetch(`${API_BASE}/orbit/stacked-suggestions`, {
    headers: authHeaders(),
  }).then(handleResponse),

  // =============================================
  //          STUDY
  // =============================================
  getCurrentStudy: () => fetch(`${API_BASE}/study/current`, {
    headers: authHeaders()
  }).then(handleResponse),

  updateCurrentStudy: (data) => fetch(`${API_BASE}/study/current`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  getStudyNotes: () => fetch(`${API_BASE}/study/notes`, {
    headers: authHeaders()
  }).then(handleResponse),

  createStudyNote: (data) => fetch(`${API_BASE}/study/notes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  updateStudyNote: (id, data) => fetch(`${API_BASE}/study/notes/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  deleteStudyNote: (id) => fetch(`${API_BASE}/study/notes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse),

  pinStudyNote: (id, data) => fetch(`${API_BASE}/study/notes/${id}/pin`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  getHighlights: () => fetch(`${API_BASE}/study/highlights`, {
    headers: authHeaders()
  }).then(handleResponse),

  createHighlight: (data) => fetch(`${API_BASE}/study/highlights`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  getBookmarks: () => fetch(`${API_BASE}/study/bookmarks`, {
    headers: authHeaders()
  }).then(handleResponse),

  createBookmark: (data) => fetch(`${API_BASE}/study/bookmarks`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  deleteBookmark: (id) => fetch(`${API_BASE}/study/bookmarks/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse),

  // =============================================
  //          MOMENTUM (Communities)
  // =============================================
  getCommunities: (params) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    const url = query ? `${API_BASE}/momentum/communities?${query}` : `${API_BASE}/momentum/communities`;
    return fetch(url, { headers: authHeaders() }).then(handleResponse);
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

  leaveCommunity: (communityId) => fetch(`${API_BASE}/communities/${communityId}/leave`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse),

  getCommunityPosts: (id, params) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    const url = query
      ? `${API_BASE}/momentum/communities/${id}/posts?${query}`
      : `${API_BASE}/momentum/communities/${id}/posts`;
    return fetch(url, { headers: authHeaders() }).then(handleResponse);
  },

  toggleLike: (postId) => fetch(`${API_BASE}/momentum/posts/${postId}/like`, {
    method: 'POST',
    headers: authHeaders()
  }).then(handleResponse),

  getCommunityEvents: (id) => fetch(`${API_BASE}/momentum/communities/${id}/events`, {
    headers: authHeaders()
  }).then(handleResponse),

  rsvpEvent: (eventId, status) => fetch(`${API_BASE}/events/${eventId}/rsvp`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  }).then(handleResponse),

  getUserCommunities: () => fetch(`${API_BASE}/user/communities`, {
    headers: authHeaders(),
  }).then(handleResponse),

  getMyCommunities: () => fetch(`${API_BASE}/my-communities`, {
    headers: authHeaders(),
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
    const url = before
      ? `${API_BASE}/communities/${id}/messages?before=${before}`
      : `${API_BASE}/communities/${id}/messages`;
    return fetch(url, { headers: authHeaders() }).then(handleResponse);
  },

  sendCommunityMessage: (id, content) => fetch(`${API_BASE}/communities/${id}/messages`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content })
  }).then(handleResponse),

  // =============================================
  //          BRIDGE (messaging)
  // =============================================
  getBridgeStudentProgress: (studentId) => {
    if (studentId) {
      return fetch(`${API_BASE}/bridge/student/${studentId}/progress`, {
        headers: authHeaders()
      }).then(handleResponse);
    }
    return fetch(`${API_BASE}/bridge/my-progress`, {
      headers: authHeaders()
    }).then(handleResponse);
  },

  getBridgeTeacherStudents: () => fetch(`${API_BASE}/bridge/my-students`, {
    headers: authHeaders()
  }).then(handleResponse),

  getBridgeStudents: () => fetch(`${API_BASE}/bridge/my-students`, {
    headers: authHeaders()
  }).then(handleResponse),

  getBridgeParentChild: () => fetch(`${API_BASE}/bridge/my-child`, {
    headers: authHeaders()
  }).then(handleResponse),

  getBridgeChild: () => fetch(`${API_BASE}/bridge/my-child`, {
    headers: authHeaders()
  }).then(handleResponse),

  getBridgeStudentProgressById: (id) => fetch(`${API_BASE}/bridge/student/${id}/progress`, {
    headers: authHeaders()
  }).then(handleResponse),

  getBridgeAnnouncements: () => fetch(`${API_BASE}/bridge/announcements`, {
    headers: authHeaders()
  }).then(handleResponse),

  postBridgeAnnouncement: (targetRoles, title, content) => fetch(`${API_BASE}/bridge/announcements`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ targetRoles, title, content }),
  }).then(handleResponse),

  generateConnectionCode: () => fetch(`${API_BASE}/bridge/generate-code`, {
    headers: authHeaders()
  }).then(handleResponse),

  getBridgeCode: () => fetch(`${API_BASE}/bridge/generate-code`, {
    headers: authHeaders()
  }).then(handleResponse),

  linkStudent: (code) => fetch(`${API_BASE}/bridge/link-student`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ code })
  }).then(handleResponse),

  connectBridge: (code) => fetch(`${API_BASE}/bridge/connect`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ code })
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

  getBridgePeerContacts: () => fetch(`${API_BASE}/bridge/peer-contacts`, {
    headers: authHeaders()
  }).then(handleResponse),

  getOrCreatePeerConversation: (userId) => fetch(`${API_BASE}/bridge/conversation/with/${userId}`, {
    headers: authHeaders()
  }).then(handleResponse),

  sendEncouragement: (studentId, content) => fetch(`${API_BASE}/bridge/encouragement`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ studentId, content }),
  }).then(handleResponse),

  // =============================================
  //          PARENT & TEACHER
  // =============================================
  getParentChildren: () => fetch(`${API_BASE}/parent/children`, {
    headers: authHeaders()
  }).then(handleResponse),

  getParentChildProgress: () => fetch(`${API_BASE}/bridge/parent-child-progress`, {
    headers: authHeaders()
  }).then(handleResponse),

  getTeacherStudents: () => fetch(`${API_BASE}/teacher/students`, {
    headers: authHeaders()
  }).then(handleResponse),

  getTeacherStudentProgress: (studentId) => fetch(`${API_BASE}/teacher/student/${studentId}/progress`, {
    headers: authHeaders()
  }).then(handleResponse),

  getTeacherClassSummary: () => fetch(`${API_BASE}/teacher/class-summary`, {
    headers: authHeaders()
  }).then(handleResponse),

  // =============================================
  //          NOTIFICATIONS
  // =============================================
  getNotifications: () => fetch(`${API_BASE}/notifications`, {
    headers: authHeaders()
  }).then(handleResponse),

  markNotificationRead: (id) => fetch(`${API_BASE}/bridge/notifications/${id}/read`, {
    method: 'PUT',
    headers: authHeaders()
  }).then(handleResponse),

  // =============================================
  //          RESOURCES & EVENTS
  // =============================================
  getResources: (subject) => {
    if (subject) {
      return fetch(`${API_BASE}/resources?subject=${encodeURIComponent(subject)}`, {
        headers: authHeaders()
      }).then(handleResponse);
    }
    return fetch(`${API_BASE}/resources`, {
      headers: authHeaders()
    }).then(handleResponse);
  },

  getAllEvents: () => fetch(`${API_BASE}/events`, {
    headers: authHeaders()
  }).then(handleResponse),

  // =============================================
  //          ACADEMIC HUB
  // =============================================
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
    const query = params ? new URLSearchParams(params).toString() : '';
    const url = query ? `${API_BASE}/academic/subjects?${query}` : `${API_BASE}/academic/subjects`;
    return fetch(url, { headers: authHeaders() }).then(handleResponse);
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

  // =============================================
  //          TIMETABLE
  // =============================================
  getTimetableDay: (date) => fetch(`${API_BASE}/timetable/my/day/${date}`, {
    headers: authHeaders()
  }).then(handleResponse),

  getTimetableWeek: (startDate) => fetch(`${API_BASE}/timetable/my/week/${startDate}`, {
    headers: authHeaders()
  }).then(handleResponse),

  getTimetableMonth: (year, month) => fetch(`${API_BASE}/timetable/my/month/${year}/${month}`, {
    headers: authHeaders()
  }).then(handleResponse),

  // =============================================
  //          SETTINGS
  // =============================================
  getSettings: () => fetch(`${API_BASE}/settings`, {
    headers: authHeaders()
  }).then(handleResponse),

  updateSettings: (data) => fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  // =============================================
  //          SUBSCRIPTION
  // =============================================
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

  // =============================================
  //          LIBRARY
  // =============================================
  getLibraryCategories: () => fetch(`${API_BASE}/library/categories`, {
    headers: authHeaders()
  }).then(handleResponse),

  getLibraryBooks: (params) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    const url = query ? `${API_BASE}/library/books?${query}` : `${API_BASE}/library/books`;
    return fetch(url, { headers: authHeaders() }).then(handleResponse);
  },

  getLibraryBook: (id) => fetch(`${API_BASE}/library/books/${id}`, {
    headers: authHeaders()
  }).then(handleResponse),

  getLibraryContinueReading: () => fetch(`${API_BASE}/library/continue`, {
    headers: authHeaders()
  }).then(handleResponse),

  updateLibraryProgress: (bookId, data) => fetch(`${API_BASE}/library/books/${bookId}/progress`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  getLibraryProgress: (bookId) => fetch(`${API_BASE}/library/books/${bookId}/progress`, {
    headers: authHeaders()
  }).then(handleResponse),

  getLibraryBookmarks: (bookId) => fetch(`${API_BASE}/library/books/${bookId}/bookmarks`, {
    headers: authHeaders()
  }).then(handleResponse),

  createLibraryBookmark: (bookId, data) => fetch(`${API_BASE}/library/books/${bookId}/bookmarks`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  deleteLibraryBookmark: (bookId, bookmarkId) => fetch(`${API_BASE}/library/books/${bookId}/bookmarks/${bookmarkId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse),

  // =============================================
  //          AI
  // =============================================
  aiTutorChat: (message, context) => fetch(`${API_BASE}/ai/tutor`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message, context }),
  }).then(handleResponse),

  aiGenerateQuiz: (data) => fetch(`${API_BASE}/ai/quiz`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  aiGenerateOrbitContent: (data) => fetch(`${API_BASE}/ai/orbit/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  aiGetRecommendations: () => fetch(`${API_BASE}/ai/recommendations`, {
    headers: authHeaders()
  }).then(handleResponse),

  // =============================================
  //          PERSONALIZATION
  // =============================================
  generatePersonalization: () => fetch(`${API_BASE}/personalize/generate`, {
    method: 'POST',
    headers: authHeaders()
  }).then(handleResponse),

  actOnRecommendation: (id) => fetch(`${API_BASE}/personalize/recommendations/${id}/act`, {
    method: 'PUT',
    headers: authHeaders()
  }).then(handleResponse),

  // =============================================
  //          ADMIN
  // =============================================
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

  // =============================================
  //          INSTITUTION
  // =============================================
  getInstitutionDashboard: () => fetch(`${API_BASE}/institution/dashboard`, {
    headers: authHeaders()
  }).then(handleResponse),

  updateStudentGroup: (data) => fetch(`${API_BASE}/institution/students/group`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  getGroups: () => fetch(`${API_BASE}/institution/groups`, {
    headers: authHeaders()
  }).then(handleResponse),

  createGroup: (data) => fetch(`${API_BASE}/institution/groups`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  updateGroup: (id, data) => fetch(`${API_BASE}/institution/groups/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  deleteGroup: (id) => fetch(`${API_BASE}/institution/groups/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse),

  getTimetableByGroup: (groupId) => fetch(`${API_BASE}/institution/timetable/group/${groupId}`, {
    headers: authHeaders()
  }).then(handleResponse),

  uploadTimetableCSV: (formData) => fetch(`${API_BASE}/institution/timetable/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData,
  }).then(handleResponse),

  createResource: (data) => fetch(`${API_BASE}/institution/resources`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  getInstitutionResources: (targetType, targetId) => fetch(`${API_BASE}/institution/resources/${targetType}/${targetId}`, {
    headers: authHeaders()
  }).then(handleResponse),

  createAnnouncement: (data) => fetch(`${API_BASE}/institution/announcements`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  getAnnouncements: () => fetch(`${API_BASE}/institution/announcements`, {
    headers: authHeaders()
  }).then(handleResponse),

  assignTeacher: (data) => fetch(`${API_BASE}/institution/assign`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  removeTeacherAssignment: (teacherId, groupId) => fetch(`${API_BASE}/institution/assign/${teacherId}/${groupId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse),

  getStudentStudySphere: () => fetch(`${API_BASE}/institution/studysphere`, {
    headers: authHeaders()
  }).then(handleResponse),

  getHierarchy: () => fetch(`${API_BASE}/institution/hierarchy`, {
    headers: authHeaders()
  }).then(handleResponse),

  getStudentSubjects: () => fetch(`${API_BASE}/institution/student-subjects`, {
    headers: authHeaders()
  }).then(handleResponse),

  getInstitutionRooms: () => fetch(`${API_BASE}/institution/rooms`, {
    headers: authHeaders()
  }).then(handleResponse),

  createRoom: (data) => fetch(`${API_BASE}/institution/rooms`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  updateRoom: (id, data) => fetch(`${API_BASE}/institution/rooms/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  deleteRoom: (id) => fetch(`${API_BASE}/institution/rooms/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse),

  getInstitutionCourses: () => fetch(`${API_BASE}/institution/courses`, {
    headers: authHeaders()
  }).then(handleResponse),

  createCourse: (data) => fetch(`${API_BASE}/institution/courses`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  updateCourse: (id, data) => fetch(`${API_BASE}/institution/courses/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  deleteCourse: (id) => fetch(`${API_BASE}/institution/courses/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse),

  getInstitutionTeachers: () => fetch(`${API_BASE}/institution/teachers`, {
    headers: authHeaders()
  }).then(handleResponse),

  createTimetableEntry: (data) => fetch(`${API_BASE}/institution/timetable`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  updateTimetableEntry: (id, data) => fetch(`${API_BASE}/institution/timetable/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse),

  deleteTimetableEntry: (id) => fetch(`${API_BASE}/institution/timetable/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse),

  // =============================================
  //          STUDY GROUPS
  // =============================================
  getMyStudyGroups: () => fetch(`${API_BASE}/study-groups/my`, {
    headers: authHeaders()
  }).then(handleResponse),

  // =============================================
  //          MISC
  // =============================================
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
};