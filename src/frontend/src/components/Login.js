import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, isAuthenticated } from '../services/authService';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const authed = await isAuthenticated();
      if (authed) {
        navigate('/home', { replace: true });
      }
    }
    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Limpiar errores cuando el usuario modifica el formulario
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData);
      if (response.token) {
        navigate('/home', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Error logging in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2>GastroBot Login</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                disabled={loading}
                style={{ paddingRight: '44px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-eye"
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 28,
                  width: 28
                }}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                disabled={loading}
                aria-label={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? (
                  // SVG de ojo cerrado
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3" fill="#fff" stroke="#ff7a00"/><ellipse cx="12" cy="12" rx="10" ry="7" fill="none" stroke="#ff7a00"/><ellipse cx="12" cy="12" rx="3" ry="3" fill="#ff7a00"/></svg>
                ) : (
                  // SVG de ojo abierto
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in' : 'Log In'}
          </button>
        </form>

        <p className="register-link">
          Don't have an account?<Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login; 