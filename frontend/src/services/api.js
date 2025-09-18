import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

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

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
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
  
  createProject: (name, description) =>
    api.post('/projects/', { name, description }),
  
  addParticipant: (projectId, email, role) =>
    api.post(`/projects/${projectId}/participants`, { email, role }),
  
  getProjectDoDs: (projectId) =>
    api.get(`/projects/${projectId}/dods`),
};

// DoD services
export const dodService = {
  createDoD: (title, description, projectId) =>
    api.post('/dods/', { title, description, project_id: projectId }),
  
  addDoDItem: (dodId, title, description, isRequired = true, order = 0) =>
    api.post(`/dods/${dodId}/items`, {
      title,
      description,
      is_required: isRequired,
      order,
    }),
};

export default api;