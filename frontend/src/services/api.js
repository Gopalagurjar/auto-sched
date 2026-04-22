import axios from 'axios';

// ✅ ENV se URL lo (Vercel compatible)
const API_URL = import.meta.env.VITE_API_URL || "https://auto-sched.onrender.com/";

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401 (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('fullName');
      localStorage.removeItem('faculty_id');
      localStorage.removeItem('student_group_id');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
