import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchConfig = async () => {
  try {
    const response = await api.get('/config');
    return response.data;
  } catch (error) {
    console.error('Fetch config error:', error);
    // Return defaults if API fails
    return {
      page_name: 'Shift Handover Log',
      permanent_info: ''
    };
  }
};

export const fetchPublicConfig = async () => {
  try {
    const response = await api.get('/config/public');
    return response.data;
  } catch (error) {
    console.error('Fetch public config error:', error);
    // Return defaults if API fails (network error, server down, etc.)
    return {
      page_name: 'Shift Handover Log',
      permanent_info: ''
    };
  }
};

export const updateConfig = async (config) => {
  try {
    const response = await api.put('/config', config);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update configuration');
  }
};

