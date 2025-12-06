import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8500/api';

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
      permanent_info: '',
      header_color: '#2563eb'
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
      permanent_info: '',
      header_color: '#2563eb'
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

export const uploadLogo = async (file) => {
  try {
    const formData = new FormData();
    formData.append('logo', file);
    
    const token = localStorage.getItem('admin_token');
    const response = await axios.post(`${API_BASE_URL}/config/upload-logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to upload logo');
  }
};

export const deleteLogo = async () => {
  try {
    const response = await api.delete('/config/logo');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete logo');
  }
};

