import React, { useState } from 'react';
import './LoginSignUp.css';
import authService from '../services/authService';

const SignUp = ({ onSwitch, onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== retypePassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(name, email, password);
      if (onLogin) onLogin(response);
    } catch (error) {
      setError(error.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-top-decor" />
        <h2 className="auth-title">Sign Up</h2>
        <p className="auth-subtitle">Create your account</p>
        {error && <div className="auth-error">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">NAME
            <input 
              type="text" 
              className="auth-input" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="John Doe" 
              required 
              disabled={loading}
            />
          </label>
          <label className="auth-label">EMAIL
            <input 
              type="email" 
              className="auth-input" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="example@gmail.com" 
              required 
              disabled={loading}
            />
          </label>
          <label className="auth-label">PASSWORD
            <div className="auth-input-group">
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="auth-input" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="********" 
                required 
                disabled={loading}
              />
              <button 
                type="button" 
                className="auth-eye" 
                onClick={() => setShowPassword(v => !v)}
                disabled={loading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </label>
          <label className="auth-label">RETYPE PASSWORD
            <div className="auth-input-group">
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="auth-input" 
                value={retypePassword} 
                onChange={e => setRetypePassword(e.target.value)} 
                placeholder="********" 
                required 
                disabled={loading}
              />
            </div>
          </label>
          <button 
            className="auth-btn" 
            type="submit"
            disabled={loading}
          >
            {loading ? 'CARGANDO...' : 'SIGN UP'}
          </button>
        </form>
        <div className="auth-bottom-row">
          <span>Already have an account? <button className="auth-link" onClick={() => onSwitch('login')} disabled={loading}>LOG IN</button></span>
        </div>
        <div className="auth-or">Or</div>
        <div className="auth-socials">
          <button className="auth-social fb" title="Facebook" disabled={loading} />
          <button className="auth-social tw" title="Twitter" disabled={loading} />
          <button className="auth-social ap" title="Apple" disabled={loading} />
        </div>
      </div>
    </div>
  );
};

export default SignUp; 