// src/api/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  withCredentials: true, // ⬅️ Needed for cookies and Laravel Sanctum
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer token if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
