// frontend/src/services/orbitApi.js
import api from './api';   // ✅ default import (change from { api })

export const orbitApi = {
  startSession: async (subject, topic, orbitType, activityType) => {
    const response = await api.post('/orbit/session/start', {
      subject, topic, orbitType, activityType
    });
    return response.data;
  },

  endSession: async (sessionId, score, totalQuestions, correctAnswers, timeSpent) => {
    const response = await api.post('/orbit/session/end', {
      sessionId, score, totalQuestions, correctAnswers, timeSpent
    });
    return response.data;
  },

  generateActivity: async (sessionId, activityType) => {
    const response = await api.post('/orbit/generate', {
      sessionId, activityType
    });
    return response.data;
  },

  submitAnswer: async (activityId, userAnswer, timeTaken) => {
    const response = await api.post('/orbit/submit', {
      activityId, userAnswer, timeTaken
    });
    return response.data;
  },

  getProgress: async () => {
    const response = await api.get('/orbit/progress');
    return response.data;
  },

  getWeaknesses: async () => {
    const response = await api.get('/orbit/weaknesses');
    return response.data;
  },

  feedback: async (sessionId, activityId, answer, time) => {
    const response = await api.post('/orbit/feedback', {
      sessionId, activityId, answer, time
    });
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await api.get('/orbit/sessions/active');
    return response.data;
  },

  getActivities: async (sessionId) => {
    const response = await api.get(`/orbit/sessions/${sessionId}/activities`);
    return response.data;
  }
};