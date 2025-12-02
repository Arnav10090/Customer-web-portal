import axios from 'axios';

// Create axios instance with base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/token/refresh/`,
            { refresh: refreshToken }
          );

          const newAccessToken = response.data.access;
          localStorage.setItem('accessToken', newAccessToken);
          
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, clear storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login/', { email, password }),
  
  register: (data) =>
    api.post('/auth/register/', data),
  
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};

// Documents endpoints
export const documentsAPI = {
  getDocuments: (params) =>
    api.get('/documents/', { params }),
  
  uploadDocument: (formData) =>
    api.post('/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getDocument: (id) =>
    api.get(`/documents/${id}/`),
  
  deleteDocument: (id) =>
    api.delete(`/documents/${id}/`),
};

// Submissions endpoints
export const submissionsAPI = {
  getSubmissions: (params) =>
    api.get('/submissions/', { params }),
  
  createSubmission: (data) => {
    // For FormData, don't set Content-Type header - let axios/browser handle it
    // This ensures the boundary is set correctly for multipart/form-data
    const config = {};
    if (data instanceof FormData) {
      config.headers = { 'Content-Type': undefined };
    }
    return api.post('/submissions/', data, config);
  },
  
  getSubmission: (id) =>
    api.get(`/submissions/${id}/`),
  
  updateSubmission: (id, data) =>
    api.patch(`/submissions/${id}/`, data),
  
  generateQRCode: (submissionId) =>
    api.get(`/submissions/${submissionId}/generate_qr/`),
};

// Vehicles endpoints
export const vehiclesAPI = {
  getVehicles: (params) =>
    api.get('/vehicles/', { params }),
  
  createVehicle: (data) =>
    api.post('/vehicles/', data),
  
  getVehicle: (id) =>
    api.get(`/vehicles/${id}/`),
  
  updateVehicle: (id, data) =>
    api.patch(`/vehicles/${id}/`, data),
};

// Drivers endpoints
export const driversAPI = {
  getDrivers: (params) =>
    api.get('/drivers/', { params }),
  
  createDriver: (data) =>
    api.post('/drivers/', data),
  
  getDriver: (id) =>
    api.get(`/drivers/${id}/`),
  
  updateDriver: (id, data) =>
    api.patch(`/drivers/${id}/`, data),
};

export default api;
