import axios from 'axios';


console.log("API_BASE_URL:", process.env.REACT_APP_API_URL);
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';
console.log("API_BASE_URL:", API_BASE_URL);
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
};

// Project services
export const projectService = {
  getProjects: () =>
    api.get('/projects/'),
  getProject: (projectId) =>
    api.get(`/projects/${projectId}`),                    
  createProject: (name, description) =>
    api.post('/projects/', { name, description }),
  deleteProject: (projectId) =>
    api.delete(`/projects/${projectId}`),
  getParticipants: (projectId) =>
    api.get(`/projects/${projectId}/participants`),      
  addParticipant: (projectId, email, role) =>
    api.post(`/projects/${projectId}/participants`, { email, role }),
  removeParticipant: (projectId, participantId) =>
    api.delete(`/projects/${projectId}/participants/${participantId}`), 
  getProjectDoDs: (projectId) =>
    api.get(`/projects/${projectId}/dods`),
};

// DoD services
export const dodService = {
  createDoD: (title, description, projectId) =>
    api.post('/dods/', { title, description, project_id: projectId }),
  updateDoD: (dodId, title, description) =>                          // ← Nouvelle fonction
    api.put(`/dods/${dodId}`, { title, description }),
  deleteDoD: (dodId) =>                                              // ← Nouvelle fonction
    api.delete(`/dods/${dodId}`),
  addDoDItem: (dodId, title, description, isRequired = true, order = 0) =>
    api.post(`/dods/${dodId}/items`, {
      title,
      description,
      is_required: isRequired,
      order,
    }),
  updateDoDItem: (itemId, title, description, isRequired = true, order = 0) =>  // ← Nouvelle fonction
    api.put(`/dods/items/${itemId}`, {  // Note: structure simplifiée pour l'API
      title,
      description,
      is_required: isRequired,
      order,
    }),
  deleteDoDItem: (itemId) =>                                         // ← Nouvelle fonction
    api.delete(`/dods/items/${itemId}`), // Note: structure simplifiée pour l'API
};

export default api;