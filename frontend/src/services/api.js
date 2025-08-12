import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data).then(res => {
  localStorage.setItem('token', res.data.token);
  return res;
});
export const resetPassword = (data) => API.post('/auth/reset-password', data);
export const getProfile = () => API.get('/profile');
export const updateProfile = (data) => API.put('/profile', data);
export const deleteProfile = () => API.delete('/profile');
export const getPending = () => API.get('/admin/pending');
export const approveUser = (userId) => API.put(`/admin/approve/${userId}`);