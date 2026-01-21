import axios from 'axios';

// Create axios instance with base URL
// In production, set REACT_APP_API_URL environment variable
// Example: REACT_APP_API_URL=https://your-backend-url.onrender.com
const API_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
// Token is now stored in httpOnly cookie, so we don't need to add it manually
// But we keep this for backward compatibility with Authorization header
api.interceptors.request.use(
  (config) => {
    // Token is automatically sent via httpOnly cookie
    // Only add Authorization header if explicitly provided (for backward compatibility)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure credentials are sent with requests (for cookies)
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses (unauthorized) - clear user data
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear user data from localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Dispatch event to notify App component
      window.dispatchEvent(new Event('userLoggedOut'));
    }
    return Promise.reject(error);
  }
);

export default api;

