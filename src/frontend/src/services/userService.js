import axios from 'axios';
import { getCurrentUser } from './authService';

const API_URL = 'http://localhost:5000/api/user';

const getAuthHeaders = () => {
  const user = getCurrentUser();
  const token = user?.token;
  if (!token) return {};
  return { 'x-auth-token': token };
};

export const getUserPreferences = async () => {
  const headers = getAuthHeaders();
  if (!headers['x-auth-token']) {
    return Promise.reject('No token found');
  }
  const response = await axios.get(`${API_URL}/preferences`, { headers });
  return response.data;
};

export const updateUserPreferences = async (preferences) => {
  const headers = getAuthHeaders();
  if (!headers['x-auth-token']) {
    return Promise.reject('No token found');
  }
  const response = await axios.put(`${API_URL}/preferences`, { preferences }, { headers });
  return response.data;
}; 