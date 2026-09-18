import { fetchWithAuth } from './api';

export const authService = {
  signup: async (name, email, password, confirmPassword) => {
    return await fetchWithAuth('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
  },

  login: async (email, password) => {
    return await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getMe: async () => {
    return await fetchWithAuth('/auth/me', {
      method: 'GET',
    });
  },
};
