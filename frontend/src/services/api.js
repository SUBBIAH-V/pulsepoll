let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
rawUrl = rawUrl.trim().replace(/\/+$/, ''); // strip trailing slash

if (!rawUrl.endsWith('/api')) {
  rawUrl = `${rawUrl}/api`;
}

export const API_BASE_URL = rawUrl;

// Compute WS_BASE_URL automatically if not explicitly set
const wsProtocol = rawUrl.startsWith('https') ? 'wss:' : 'ws:';
const domainAndPath = rawUrl.replace(/^https?:\/\//, '').replace(/\/api$/, '');
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || `${wsProtocol}//${domainAndPath}/ws`;

export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('pulsepoll_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = {};
  if (text && text.trim()) {
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `Server error (${response.status})`);
  }

  return data;
};

export default API_BASE_URL;
