import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './EmailVerification.css';

const EmailVerification = () => {
  const [status, setStatus] = useState('verificando');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleVerification = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        // Handle error cases from backend redirects
        if (error) {
          setStatus('error');
          switch (error) {
            case 'no-token':
              setErrorMessage('Token de verificación no encontrado');
              break;
            case 'invalid-token':
              setErrorMessage('Token inválido o expirado');
              break;
            case 'server-error':
              setErrorMessage('Error en el servidor');
              break;
            default:
              setErrorMessage('Error en la verificación del email');
          }
          return;
        }

        // If no token and no error, show loading
        if (!token) {
          setStatus('error');
          setErrorMessage('Token de verificación no encontrado');
          return;
        }

        // If we have a token, the backend has already verified it and redirected us
        // So we can show success immediately
        setStatus('success');
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } catch (error) {
        setStatus('error');
        setErrorMessage('Error en la verificación del email');
      }
    };

    handleVerification();
  }, [location, navigate]);

  return (
    <div className="verification-container">
      <div className="verification-card">
        {status === 'verificando' && (
          <>
            <h2>Verifying your account...</h2>
            <div className="loading-spinner"></div>
          </>
        )}
        
        {status === 'success' && (
          <>
            <h2>Account verified!</h2>
            <p>Your account has been verified successfully.</p>
            <p>You will be redirected to the login page in a few seconds...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <h2>Verification error</h2>
            <p>{errorMessage}</p>
            <button onClick={() => navigate('/login', { replace: true })} className="verification-button">
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerification; 