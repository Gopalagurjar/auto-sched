import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api'; // use your configured axios instance

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const fullName = localStorage.getItem('fullName');
    const faculty_id = localStorage.getItem('faculty_id');
    const student_group_id = localStorage.getItem('student_group_id');
    if (token && role) {
      setUser({
        role,
        fullName,
        faculty_id: faculty_id ? Number(faculty_id) : null,
        student_group_id: student_group_id ? Number(student_group_id) : null,
      });
      // Set default Authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // ✅ Send JSON instead of form-urlencoded
      const res = await api.post('/auth/login', { username, password });
      const data = res.data;

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      const fullName = data.full_name || username;
      localStorage.setItem('fullName', fullName);
      if (data.faculty_id) localStorage.setItem('faculty_id', data.faculty_id);
      if (data.student_group_id) localStorage.setItem('student_group_id', data.student_group_id);

      // Set default Authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;

      setUser({
        role: data.role,
        fullName,
        faculty_id: data.faculty_id,
        student_group_id: data.student_group_id,
      });
      return data;
    } catch (error) {
      // Re-throw so Login.jsx can handle it
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    localStorage.removeItem('faculty_id');
    localStorage.removeItem('student_group_id');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};