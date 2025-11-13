import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Admin login (for backoffice)
export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.status === 'success') {
      localStorage.setItem('admin_token', response.data.data.token);
      return response.data.data;
    }
    throw new Error(response.data.message || 'Login failed');
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

// Verify admin token
export const verifyToken = async () => {
  try {
    const token = localStorage.getItem('admin_token');
    if (!token) return false;
    
    const response = await api.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.status === 'success';
  } catch (error) {
    return false;
  }
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to change password');
  }
};

// Logout admin
export const logout = () => {
  localStorage.removeItem('admin_token');
};

// User login (for main page)
export const userLogin = async (username, password) => {
  try {
    const response = await api.post('/auth/user/login', { username, password });
    if (response.data.status === 'success') {
      localStorage.setItem('user_token', response.data.data.token);
      return response.data.data;
    }
    throw new Error(response.data.message || 'Login failed');
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

// Verify user token
export const verifyUserToken = async () => {
  try {
    const token = localStorage.getItem('user_token');
    if (!token) return false;
    
    const response = await api.get('/auth/user/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.status === 'success';
  } catch (error) {
    return false;
  }
};

// Logout user
export const userLogout = () => {
  localStorage.removeItem('user_token');
};
