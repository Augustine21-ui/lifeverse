// frontend/src/services/orbitApi.js
// ⚠️ REPLACE ENTIRE FILE WITH THIS

// Import the default export from api.js
import api from './api';

// ============================================================
// HELPER - Extract data from response
// ============================================================

const extractData = (response) => {
  // If response has a data property, return it
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }
  // Otherwise return the whole response
  return response;
};

// ============================================================
// ORBIT API OBJECT
// ============================================================

const orbitApi = {
  // 🚀 Start a new Orbit session
  startSession: async (subject, topic, orbitType = 'exploration', activityType = 'introduction') => {
    try {
      console.log(`🚀 Starting orbit session: ${subject} - ${topic}`);
      const response = await api.post('/orbit/session/start', {
        subject,
        topic,
        orbitType,
        activityType,
      });
      return extractData(response);
    } catch (error) {
      console.error('❌ Failed to start Orbit session:', error);
      throw error;
    }
  },

  // 📊 Get session details
  getSession: async (sessionId) => {
    try {
      const response = await api.get(`/orbit/session/${sessionId}`);
      return extractData(response);
    } catch (error) {
      console.error(`❌ Failed to get session ${sessionId}:`, error);
      throw error;
    }
  },

  // 🎯 Generate next activity
  generateActivity: async (sessionId) => {
    try {
      console.log(`🎯 Generating activity for session: ${sessionId}`);
      const response = await api.post('/orbit/generate', { sessionId });
      return extractData(response);
    } catch (error) {
      console.error('❌ Failed to generate activity:', error);
      throw error;
    }
  },

  // ✅ Submit activity response
  submitActivity: async (sessionId, activityId, userAnswer) => {
    try {
      console.log(`✅ Submitting activity: ${activityId}`);
      const response = await api.post('/orbit/submit', {
        sessionId,
        activityId,
        userAnswer,
      });
      return extractData(response);
    } catch (error) {
      console.error('❌ Failed to submit activity:', error);
      throw error;
    }
  },

  // 🏁 End session
  endSession: async (sessionId) => {
    try {
      console.log(`🏁 Ending session: ${sessionId}`);
      const response = await api.post('/orbit/session/end', { sessionId });
      return extractData(response);
    } catch (error) {
      console.error('❌ Failed to end session:', error);
      throw error;
    }
  },

  // 📈 Get session progress
  getProgress: async () => {
    try {
      console.log('📈 Fetching orbit progress...');
      const response = await api.get('/orbit/progress');
      return extractData(response);
    } catch (error) {
      console.error('❌ Failed to get Orbit progress:', error);
      throw error;
    }
  },

  // 🔍 Get weaknesses
  getWeaknesses: async (subject = null) => {
    try {
      const url = subject ? `/orbit/weaknesses?subject=${encodeURIComponent(subject)}` : '/orbit/weaknesses';
      const response = await api.get(url);
      return extractData(response);
    } catch (error) {
      console.error('❌ Failed to get weaknesses:', error);
      throw error;
    }
  },

  // 📝 Submit feedback (legacy)
  submitFeedback: async (sessionId, activityId, feedback) => {
    try {
      const response = await api.post('/orbit/feedback', {
        sessionId,
        activityId,
        feedback,
      });
      return extractData(response);
    } catch (error) {
      console.error('❌ Failed to submit feedback:', error);
      throw error;
    }
  },

  // 📚 Get available subjects
  getSubjects: async () => {
    try {
      const response = await api.get('/orbit/subjects');
      return extractData(response);
    } catch (error) {
      console.error('❌ Failed to get subjects:', error);
      // Return fallback subjects
      return {
        subjects: [
          { id: 'mind', label: 'Mind', topics: ['Psychology', 'Philosophy', 'Neuroscience'] },
          { id: 'body', label: 'Body', topics: ['Biology', 'Health', 'Fitness'] },
          { id: 'spirit', label: 'Spirit', topics: ['Meditation', 'Mindfulness', 'Ethics'] },
          { id: 'social', label: 'Social', topics: ['Sociology', 'Communication', 'Leadership'] },
        ],
      };
    }
  },

  // 📊 Get mastery for a subject
  getMastery: async (subject) => {
    try {
      const response = await api.get(`/orbit/mastery?subject=${encodeURIComponent(subject)}`);
      return extractData(response);
    } catch (error) {
      console.error(`❌ Failed to get mastery for ${subject}:`, error);
      throw error;
    }
  },

  // 📜 Get session history
  getHistory: async (limit = 10, offset = 0) => {
    try {
      const response = await api.get(`/orbit/history?limit=${limit}&offset=${offset}`);
      return extractData(response);
    } catch (error) {
      console.error('❌ Failed to get Orbit history:', error);
      throw error;
    }
  },
};

// ============================================================
// EXPORTS
// ============================================================

// Default export
export default orbitApi;

// Named exports for individual methods
export const {
  startSession,
  getSession,
  generateActivity,
  submitActivity,
  endSession,
  getProgress,
  getWeaknesses,
  submitFeedback,
  getSubjects,
  getMastery,
  getHistory,
} = orbitApi;

// Also export as named object
export { orbitApi };

// ============================================================
// DEBUGGING
// ============================================================

console.log('✅ orbitApi.js loaded successfully');
console.log('📦 orbitApi methods:', Object.keys(orbitApi));

// Check if api was imported correctly
console.log('🔧 api object type:', typeof api);
console.log('🔧 api.get type:', typeof api.get);
console.log('🔧 api.post type:', typeof api.post);

if (typeof window !== 'undefined') {
  window.__orbitApi = orbitApi;
}

// ============================================================
// SELF-TEST - Verify the API works
// ============================================================

// This will run on load and help debug issues
const testApi = async () => {
  try {
    console.log('🧪 Testing API connection...');
    // Just check if the methods exist
    if (typeof api.get !== 'function') {
      console.error('❌ CRITICAL: api.get is not a function!');
      console.error('📦 api object:', api);
    } else {
      console.log('✅ api.get is a function');
    }
    
    if (typeof api.post !== 'function') {
      console.error('❌ CRITICAL: api.post is not a function!');
      console.error('📦 api object:', api);
    } else {
      console.log('✅ api.post is a function');
    }
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
};

// Run the test
testApi();