// API Configuration
// In production, set REACT_APP_API_URL environment variable
// Example: REACT_APP_API_URL=https://your-backend-url.onrender.com
export const API_URL = process.env.REACT_APP_API_URL || '';

// Helper function to get full API URL
export const getApiUrl = (path) => {
  // If API_URL is set, use it (production)
  if (API_URL) {
    return `${API_URL}${path}`;
  }
  // Otherwise use relative path (development with proxy)
  return path;
};

