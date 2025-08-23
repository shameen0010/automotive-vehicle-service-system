import api from './api';

export const login = async (email, password) => {
  const res = await api.post('/users/login', { email, password });
  localStorage.setItem('token', res.data.token);
};

export const register = async (name, email, password, role) => {
  const res = await api.post('/users/register', { name, email, password, role });
  localStorage.setItem('token', res.data.token);
};

export const logout = () => {
  localStorage.removeItem('token');
  // Timeout: Use JWT expiry, or add idle timer in App.js
};