const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('pulsepoll_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'An unexpected error occurred');
  }

  return data;
};

export default API_BASE_URL;
