import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const recipeService = {
  // Obtener todas las recetas
  getAllRecipes: async () => {
    try {
      const response = await axios.get(`${API_URL}/recipes`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener las recetas' };
    }
  },

  // Obtener una receta por ID
  getRecipeById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/recipes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener la receta' };
    }
  },

  // Obtener recetas por categoría
  getRecipesByCategory: async (category) => {
    try {
      const response = await axios.get(`${API_URL}/recipes/category/${category}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener las recetas por categoría' };
    }
  },

  // Buscar recetas
  searchRecipes: async (query) => {
    try {
      const response = await axios.get(`${API_URL}/recipes/search/${query}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al buscar recetas' };
    }
  },

  // Crear una nueva receta
  createRecipe: async (recipeData) => {
    try {
      const response = await axios.post(`${API_URL}/recipes`, recipeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear la receta' };
    }
  },

  // Actualizar una receta
  updateRecipe: async (id, recipeData) => {
    try {
      const response = await axios.put(`${API_URL}/recipes/${id}`, recipeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar la receta' };
    }
  },

  // Eliminar una receta
  deleteRecipe: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/recipes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar la receta' };
    }
  },

  // Get recipe details by ID
  getRecipeDetails: async (recipeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/recipes/details/${recipeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recipe details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      throw error;
    }
  }
}; 