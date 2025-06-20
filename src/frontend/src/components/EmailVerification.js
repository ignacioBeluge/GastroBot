import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyEmail } from '../services/authService';
import './EmailVerification.css';

const EmailVerification = () => {
  const [status, setStatus] = useState('verificando');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyUserEmail = async () => {
      try {
        const token = new URLSearchParams(location.search).get('token');
        if (!token) {
          setStatus('error');
          setErrorMessage('Token de verificación no encontrado');
          return;
        }

        await verifyEmail(token);
        setStatus('success');
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } catch (error) {
        setStatus('error');
        setErrorMessage(error.message || 'Error en la verificación del email');
      }
    };

    verifyUserEmail();
  }, [location, navigate]);

  return (
    <div className="verification-container">
      <div className="verification-card">
        {status === 'verificando' && (
          <>
            <h2>Verificando tu cuenta...</h2>
            <div className="loading-spinner"></div>
          </>
        )}
        
        {status === 'success' && (
          <>
            <h2>¡Cuenta verificada!</h2>
            <p>Tu cuenta ha sido verificada exitosamente.</p>
            <p>Serás redirigido al inicio de sesión en unos segundos...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <h2>Error en la verificación</h2>
            <p>{errorMessage}</p>
            <button onClick={() => navigate('/login', { replace: true })} className="verification-button">
              Volver al inicio de sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerification; 