import axios from 'axios';

const getBaseUrl = () => {
  // If explicitly set in environment (e.g. during build), use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Fallback Logic:
  // If running on Railway (production domain), but env var is missing/empty,
  // force usage of the production backend.
  if (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')) {
    return 'https://redline-crm-production.up.railway.app/api';
  }

  // Default to localhost for development
  return 'http://localhost:3000/api';
};

export const API_URL = getBaseUrl();

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error or handle global errors like 401
    // console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
