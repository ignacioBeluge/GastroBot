import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export const register = async (userData) => {
  try {
    // Limpiar cualquier sesión anterior
    localStorage.removeItem('user');
    
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'El email ya está registrado');
    }
    throw new Error(error.response?.data?.message || 'Error en el registro');
  }
};

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
      // Disparar un evento personalizado para notificar el cambio de estado
      window.dispatchEvent(new Event('authStateChanged'));
    }
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error(error.response.data.message || 'Credenciales inválidas');
    }
    throw new Error(error.response?.data?.message || 'Error en el inicio de sesión');
  }
};

export const logout = () => {
  localStorage.removeItem('user');
  // Disparar un evento personalizado para notificar el cambio de estado
  window.dispatchEvent(new Event('authStateChanged'));
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

export const validateToken = async () => {
  try {
    const user = getCurrentUser();
    if (!user || !user.token) {
      return false;
    }

    const response = await axios.get(`${API_URL}/validate`, {
      headers: { 'x-auth-token': user.token }
    });

    if (response.data.valid) {
      // Update user data with fresh data from server
      const updatedUser = {
        ...user,
        user: response.data.user
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return true;
    }
    
    return false;
  } catch (error) {
    // Token is invalid, clear it
    localStorage.removeItem('user');
    return false;
  }
};

export const isAuthenticated = async () => {
  const user = getCurrentUser();
  // First check if we have a token locally
  const hasToken = !!(user && user.token && typeof user.token === 'string' && user.token.length > 0);
  
  if (!hasToken) {
    localStorage.removeItem('user');
    return false;
  }

  // Then validate with backend
  return await validateToken();
};

export const verifyEmail = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/verify-email/${token}`);
    // Limpiar el estado anterior del usuario
    localStorage.removeItem('user');
    return response.data;
  } catch (error) {
    // Limpiar el estado anterior del usuario en caso de error
    localStorage.removeItem('user');
    throw new Error(error.response?.data?.message || 'Error en la verificación del email');
  }
};

export const updateUser = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/user/${id}`, data);
    // Actualizar localStorage con los nuevos datos
    const user = getCurrentUser();
    if (user) {
      user.user.name = response.data.name;
      user.user.bio = response.data.bio;
      localStorage.setItem('user', JSON.stringify(user));
    }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Error al actualizar usuario');
  }
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  verifyEmail,
  updateUser
};

export default authService; 