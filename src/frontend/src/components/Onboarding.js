import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';
import './Onboarding.css';

const Onboarding = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Si el usuario está autenticado, redirigir a home
    if (isAuthenticated()) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <h1>Bienvenido a GastroBot</h1>
        <p>Tu asistente personal de cocina</p>
        <div className="onboarding-buttons">
          <button 
            className="onboarding-button primary"
            onClick={() => navigate('/login')}
          >
            Iniciar Sesión
          </button>
          <button 
            className="onboarding-button secondary"
            onClick={() => navigate('/register')}
          >
            Registrarse
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 