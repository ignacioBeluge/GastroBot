import axios from 'axios';
import { getCurrentUser } from './authService';

const API_URL = 'http://localhost:5000/api/user';

const getAuthToken = () => {
  const user = getCurrentUser();
  return user?.token || '';
};

const getAuthHeaders = () => {
  const token = getAuthToken();
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

export const getUserPlan = async () => {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}/plan`, {
    headers: { 'x-auth-token': token }
  });
  if (!res.ok) throw new Error('Failed to fetch plan');
  return res.json();
};

export const getPaymentMethods = async () => {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}/payment-methods`, {
    headers: { 'x-auth-token': token }
  });
  if (!res.ok) throw new Error('Failed to fetch payment methods');
  return res.json();
};

export const addPaymentMethod = async (method) => {
  const token = getAuthToken();
  console.log('addPaymentMethod token:', token);
  const res = await fetch(`${API_URL}/payment-methods`, {
    method: 'POST',
    headers: {
      'x-auth-token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(method)
  });
  if (!res.ok) throw new Error('Failed to add payment method');
  return res.json();
};

export const setCurrentPaymentMethod = async (method) => {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}/payment-methods/current`, {
    method: 'PUT',
    headers: {
      'x-auth-token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(method)
  });
  if (!res.ok) throw new Error('Failed to set current payment method');
  return res.json();
}; 