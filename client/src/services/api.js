import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const fetchLogs = async (params = {}) => {
  try {
    const response = await api.get('/logs', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch logs');
  }
};

export const fetchLog = async (id) => {
  try {
    const response = await api.get(`/logs/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch log');
  }
};

export const createLog = async (logData) => {
  try {
    const response = await api.post('/logs', logData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create log');
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

export const searchLogs = async (query, params = {}) => {
  try {
    const response = await api.get('/logs/search', { 
      params: { query, ...params }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to search logs');
  }
};

