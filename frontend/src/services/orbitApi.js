// frontend/src/services/orbitApi.js
// ✅ Updated - Better response handling

import { api } from './api';

export const orbitApi = {
  // Session management
  startSession: async (subject, topic, orbitType, activityType) => {
    try {
      console.log(`📤 Sending startSession request:`, { subject, topic, orbitType, activityType });
      
      const response = await api.post('/orbit/session/start', {
        subject, topic, orbitType, activityType
      });
      
      console.log('📥 startSession raw response:', response);
      
      // The response might be the data directly, or wrapped in { data: ... }
      // Return whatever we get, but ensure it's an object
      const result = response?.data || response || {};
      
      console.log('✅ startSession processed result:', result);
      return result;
    } catch (error) {
      console.error('❌ startSession error:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      throw error;
    }
  },

  endSession: async (sessionId, score, totalQuestions, correctAnswers, timeSpent) => {
    try {
      const response = await api.post('/orbit/session/end', {
        sessionId, score, totalQuestions, correctAnswers, timeSpent
      });
      return response?.data || response || {};
    } catch (error) {
      console.error('❌ endSession error:', error);
      throw error;
    }
  },

  generateActivity: async (sessionId, activityType) => {
    try {
      const response = await api.post('/orbit/generate', {
        sessionId, activityType
      });
      return response?.data || response || {};
    } catch (error) {
      console.error('❌ generateActivity error:', error);
      throw error;
    }
  },

  submitAnswer: async (activityId, userAnswer, timeTaken) => {
    try {
      const response = await api.post('/orbit/submit', {
        activityId, userAnswer, timeTaken
      });
      return response?.data || response || {};
    } catch (error) {
      console.error('❌ submitAnswer error:', error);
      throw error;
    }
  },

  getProgress: async () => {
    try {
      console.log('📤 Fetching progress...');
      const response = await api.get('/orbit/progress');
      console.log('📥 getProgress raw response:', response);
      
      // Handle different response formats
      const result = response?.data || response || {};
      
      // Ensure we have a progress object
      if (!result.progress) {
        result.progress = {
          sessions: { total_sessions: 0, total_score: 0, avg_score: 0 },
          mastery: [],
          weaknesses: []
        };
      }
      
      console.log('✅ getProgress processed:', result);
      return result;
    } catch (error) {
      console.error('❌ getProgress error:', error);
      // Return default progress so the UI doesn't break
      return {
        progress: {
          sessions: { total_sessions: 0, total_score: 0, avg_score: 0 },
          mastery: [],
          weaknesses: []
        }
      };
    }
  },

  getWeaknesses: async () => {
    try {
      const response = await api.get('/orbit/weaknesses');
      return response?.data || response || {};
    } catch (error) {
      console.error('❌ getWeaknesses error:', error);
      return { weaknesses: [] };
    }
  },

  feedback: async (sessionId, activityId, answer, time) => {
    try {
      const response = await api.post('/orbit/feedback', {
        sessionId, activityId, answer, time
      });
      return response?.data || response || {};
    } catch (error) {
      console.error('❌ feedback error:', error);
      throw error;
    }
  },

  getActiveSessions: async () => {
    try {
      const response = await api.get('/orbit/sessions/active');
      return response?.data || response || { sessions: [] };
    } catch (error) {
      console.error('❌ getActiveSessions error:', error);
      return { sessions: [] };
    }
  },

  getActivities: async (sessionId) => {
    try {
      const response = await api.get(`/orbit/sessions/${sessionId}/activities`);
      return response?.data || response || { activities: [] };
    } catch (error) {
      console.error('❌ getActivities error:', error);
      return { activities: [] };
    }
  }
};

export default orbitApi;