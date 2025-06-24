import axios from 'axios';
import { getCurrentUser } from './authService';

const API_URL = 'http://localhost:5000/api/mealplan';

const getAuthHeaders = () => {
  const user = getCurrentUser();
  const token = user?.token;
  if (!token) return {};
  return { 'x-auth-token': token };
};

export const mealPlanService = {
  getMealPlans: async (weekStart, weekEnd) => {
    const headers = getAuthHeaders();
    const params = weekStart && weekEnd ? { weekStart, weekEnd } : {};
    const response = await axios.get(API_URL, { headers, params });
    return response.data;
  },
  addMealPlan: async (data) => {
    const headers = getAuthHeaders();
    const response = await axios.post(API_URL, data, { headers });
    return response.data;
  },
  updateMealPlan: async (id, data) => {
    const headers = getAuthHeaders();
    const response = await axios.put(`${API_URL}/${id}`, data, { headers });
    return response.data;
  },
  deleteMealPlan: async (id) => {
    const headers = getAuthHeaders();
    const response = await axios.delete(`${API_URL}/${id}`, { headers });
    return response.data;
  }
}; 