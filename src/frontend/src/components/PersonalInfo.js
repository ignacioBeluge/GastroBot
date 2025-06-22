import React from 'react';
import { getCurrentUser } from '../services/authService';
import './ProfilePage.css';

const PersonalInfo = ({ onBack, onEdit }) => {
  const user = getCurrentUser();
  
  return (
    <div className="profile-bg">
      <div className="profile-card">
        <div className="profile-header-row">
          <button className="profile-back-btn" onClick={onBack}>
            <svg width="28" height="28" viewBox="0 0 22 22">
              <circle cx="11" cy="11" r="11" fill="#f5f5f5" />
              <path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          <span className="profile-title">Personal Info</span>
          <button className="profile-edit-btn" onClick={onEdit}>EDIT</button>
        </div>
        <div className="profile-avatar-big" />
        <div className="profile-username">{user?.user?.name || 'Usuario'}</div>
        <div className="profile-desc">¡Bienvenido a GastroBot!</div>
        <div className="profile-info-list">
          <div className="profile-info-item">
            <span className="profile-info-icon">👤</span>
            <div>
              <div className="profile-info-label">FULL NAME</div>
              <div className="profile-info-value">{user?.user?.name || 'Usuario'}</div>
            </div>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-icon">📧</span>
            <div>
              <div className="profile-info-label">EMAIL</div>
              <div className="profile-info-value">{user?.user?.email || '-'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo; 