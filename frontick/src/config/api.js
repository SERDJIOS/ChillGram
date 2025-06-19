// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://chillgram.onrender.com',
  API_URL: 'https://chillgram.onrender.com/api',
  SOCKET_URL: 'https://chillgram.onrender.com'
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