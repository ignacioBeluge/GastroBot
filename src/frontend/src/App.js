import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import EmailVerification from './components/EmailVerification';
import { isAuthenticated } from './services/authService';

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const isAuth = isAuthenticated();
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Nuevo componente para las rutas
function AppRoutes() {
  const navigate = useNavigate();
  const handleSignOut = () => {
    navigate('/login', { replace: true });
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route 
        path="/home" 
        element={
          <ProtectedRoute>
            <Home onSignOut={handleSignOut} />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={isAuthenticated() ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />} />
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
