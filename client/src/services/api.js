import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8500/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add user token to requests
api.interceptors.request.use((config) => {
  const userToken = localStorage.getItem('user_token');
  if (userToken) {
    config.headers.Authorization = `Bearer ${userToken}`;
  }
  return config;
});

export const fetchLogs = async (params = {}) => {
  try {
    const response = await api.get('/logs', { params });
    return response.data;
  } catch (error) {
    console.error('Fetch logs error:', error);
    
    // Handle network errors
    if (!error.response) {
      throw new Error('Network Error: Cannot connect to server. Please check if the server is running.');
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch logs';
    const errorDetails = error.response?.data?.details;
    throw new Error(errorDetails?.error ? `${errorMessage}: ${errorDetails.error}` : errorMessage);
  }
};

// Note: fetchLog is available but not currently used - kept for future use
// export const fetchLog = async (id) => {
//   try {
//     const response = await api.get(`/logs/${id}`);
//     return response.data;
//   } catch (error) {
//     throw new Error(error.response?.data?.message || 'Failed to fetch log');
//   }
// };

export const createLog = async (logData) => {
  try {
    const response = await api.post('/logs', logData);
    return response.data;
  } catch (error) {
    console.error('Create log error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create log';
    const errorDetails = error.response?.data?.details;
    const validationErrors = error.response?.data?.details?.errors;
    
    if (validationErrors) {
      const errorList = Object.entries(validationErrors).map(([key, val]) => `${key}: ${val}`).join(', ');
      throw new Error(`${errorMessage}: ${errorList}`);
    }
    
    throw new Error(errorDetails?.error ? `${errorMessage}: ${errorDetails.error}` : errorMessage);
  }
};

export const updateLog = async (id, logData) => {
  try {
    const response = await api.put(`/logs/${id}`, logData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update log');
  }
};

export const archiveLog = async (id, isArchived) => {
  try {
    const response = await api.patch(`/logs/${id}/archive`, { is_archived: isArchived });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to archive log');
  }
};

export const deleteLog = async (id) => {
  try {
    await api.delete(`/logs/${id}`);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete log');
  }
};

export const setReminder = async (id, reminderDate) => {
  try {
    const response = await api.patch(`/logs/${id}/reminder`, { reminder_date: reminderDate });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to set reminder');
  }
};

export const clearReminder = async (id) => {
  try {
    const response = await api.patch(`/logs/${id}/reminder/clear`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to clear reminder');
  }
};

// Note: searchLogs is available but not currently used - kept for future use
// The search functionality is handled via fetchLogs with search parameter
// export const searchLogs = async (query, params = {}) => {
//   try {
//     const response = await api.get('/logs/search', { 
//       params: { query, ...params }
//     });
//     return response.data;
//   } catch (error) {
//     throw new Error(error.response?.data?.message || 'Failed to search logs');
//   }
// };

