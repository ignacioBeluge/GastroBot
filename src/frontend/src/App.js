import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import EmailVerification from './components/EmailVerification';
import { isAuthenticated } from './services/authService';

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        setIsAuth(authenticated);
      } catch (error) {
        setIsAuth(false);
      } finally {
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, []);

  if (!authChecked) {
    return <div>Loading...</div>;
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Nuevo componente para las rutas
function AppRoutes() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        setIsAuth(authenticated);
      } catch (error) {
        setIsAuth(false);
      } finally {
        setAuthChecked(true);
      }
    };
    
    checkAuth();
    
    // Listen for auth state changes
    const handleAuthChange = () => {
      checkAuth();
    };
    
    window.addEventListener('authStateChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const handleSignOut = () => {
    navigate('/login', { replace: true });
  };

  // Don't render anything until we've checked authentication
  if (!authChecked) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={isAuth ? <Navigate to="/home" replace /> : <Login />} />
      <Route path="/register" element={isAuth ? <Navigate to="/home" replace /> : <Register />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route 
        path="/home" 
        element={
          <ProtectedRoute>
            <Home onSignOut={handleSignOut} />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={isAuth ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;
