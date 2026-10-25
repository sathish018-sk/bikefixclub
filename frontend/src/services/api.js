import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bikefix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration or 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/register');
      if (!isAuthRoute) {
        localStorage.removeItem('bikefix_token');
        localStorage.removeItem('bikefix_user');
        // Optional redirect if session expired
        // window.location.href = '/login?expired=1';
      }
    }
    const message = error.response?.data?.message || 'A network error occurred. Please try again.';
    const customError = new Error(message);
    customError.response = error.response;
    customError.status = error.response?.status;
    return Promise.reject(customError);
  }
);

export default api;
