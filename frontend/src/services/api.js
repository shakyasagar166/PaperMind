import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to requests if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('papermind_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('papermind_token');
      localStorage.removeItem('papermind_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => {
    // OAuth2PasswordRequestForm expects URLSearchParams form-encoded data
    const params = new URLSearchParams();
    params.append('username', data.username || data.email);
    params.append('password', data.password);
    return api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  getMe: () => api.get('/auth/me'),
};

export const papersAPI = {
  list: (params) => api.get('/papers', { params }),
  get: (id) => api.get(`/papers/${id}`),
  upload: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/papers/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  update: (id, data) => api.put(`/papers/${id}`, data),
  delete: (id) => api.delete(`/papers/${id}`),
  downloadUrl: (id) => `${API_BASE_URL}/papers/${id}/download`,
};

export const chatAPI = {
  createSession: (data) => api.post('/chat/sessions', data),
  listSessions: (paperId) => api.get('/chat/sessions', { params: { paper_id: paperId } }),
  getSessionHistory: (sessionId) => api.get(`/chat/sessions/${sessionId}`),
  sendMessage: (sessionId, query, agentMode = 'research') =>
    api.post(`/chat/sessions/${sessionId}/messages`, { query, agent_mode: agentMode }),
};

export const summaryAPI = {
  getSummary: (paperId, mode = 'comprehensive') => api.post(`/summary/${paperId}`, { mode }),
  getCitations: (paperId, format = 'bibtex') =>
    api.get(`/summary/${paperId}/citations`, { params: { format_type: format } }),
};

export default api;
