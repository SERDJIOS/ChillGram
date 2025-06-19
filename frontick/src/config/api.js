// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  API_URL: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api`,
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
};

// Helper function to get auth headers
export const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

// Helper function to get auth headers for FormData
export const getAuthHeadersFormData = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}); 