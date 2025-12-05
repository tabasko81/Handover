import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8500/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add admin token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUsers = async () => {
  try {
    const response = await api.get('/users');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch users');
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch users');
  }
};

export const createUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create user');
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create user');
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/users/${id}`, userData);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update user');
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update user');
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/users/${id}`);
    if (response.data.status === 'success') {
      return true;
    }
    throw new Error(response.data.message || 'Failed to delete user');
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete user');
  }
};

export const sendPasswordEmail = async (id, password) => {
  try {
    const response = await api.post(`/users/${id}/send-password`, { password });
    if (response.data.status === 'success') {
      return true;
    }
    throw new Error(response.data.message || 'Failed to send password email');
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to send password email');
  }
};

export const moveUser = async (id, direction) => {
  try {
    const response = await api.post(`/users/${id}/move`, { direction });
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to move user');
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to move user');
  }
};

