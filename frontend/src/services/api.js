// frontend/src/services/api.js
// ⚠️ REPLACE ENTIRE FILE WITH THIS

// ============================================================
// IMPORTANT: This file MUST export both named AND default exports
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper: Get auth headers
const authHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Helper: Handle response
const handleResponse = async (response) => {
  if (response.status === 204) {
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    // If response is not JSON
    if (response.ok) {
      return { success: true };
    }
    throw new Error(`Server error: ${response.status}`);
  }

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// ============================================================
// METHOD DEFINITIONS
// ============================================================

const get = async (url) => {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`❌ API GET error (${url}):`, error);
    throw error;
  }
};

const post = async (url, data) => {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`❌ API POST error (${url}):`, error);
    throw error;
  }
};

const put = async (url, data) => {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`❌ API PUT error (${url}):`, error);
    throw error;
  }
};

const patch = async (url, data) => {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`❌ API PATCH error (${url}):`, error);
    throw error;
  }
};

const del = async (url) => {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error(`❌ API DELETE error (${url}):`, error);
    throw error;
  }
};

// ============================================================
// EXPORT AS OBJECT
// ============================================================

// Create the api object with all methods
const api = {
  get,
  post,
  put,
  patch,
  delete: del,
  // Also add convenience methods for compatibility
  GET: get,
  POST: post,
  PUT: put,
  PATCH: patch,
  DELETE: del,
};

// ============================================================
// EXPORT STRATEGIES - MULTIPLE WAYS TO EXPORT
// ============================================================

// 1. Default export (import api from './api')
export default api;

// 2. Named exports (import { api, get, post } from './api')
export { api, get, post, put, patch, del as delete };

// 3. Also export as a module with named properties
export const API = api;

// ============================================================
// FOR DEBUGGING - Check if exports work
// ============================================================

console.log('✅ api.js loaded successfully');
console.log('📦 api object:', Object.keys(api));
console.log('🔧 API_BASE:', API_BASE);

// Store a reference to the api on window for debugging
if (typeof window !== 'undefined') {
  window.__api = api;
  window.__apiBase = API_BASE;
}