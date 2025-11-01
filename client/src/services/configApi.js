import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
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
      daily_logs_enabled: false
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

