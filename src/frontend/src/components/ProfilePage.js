import React from 'react';
import { getCurrentUser } from '../services/authService';
import './ProfilePage.css';
// import { useNavigate } from 'react-router-dom';

const profileMenuList = [
  { icon: '🧑‍💼', label: 'Personal Info', key: 'personal' },
  { icon: '💳', label: 'Payment', key: 'payment' },
  { icon: '🔔', label: 'Notifications' },
  { icon: '❓', label: 'FAQs' },
  { icon: '⭐', label: 'User Review' },
  { icon: '🚪', label: 'Sign Out', key: 'signout', logout: true },
];

const ProfilePage = ({ onBack, onMenu, onSignOut }) => {
  const user = getCurrentUser();
  const name = user?.user?.name || '';
  const bio = user?.user?.bio || '';
  const plan = user?.user?.plan || 'free';
  // const navigate = useNavigate();
  
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
          <span className="profile-title">Profile</span>
        </div>
        <div className="profile-avatar-badge-container">
          <div className="profile-avatar-big" />
          {plan === 'pro' && (
            <div className="profile-pro-badge">PRO</div>
          )}
        </div>
        <div className="profile-username">{name}</div>
        <div className="profile-menu-list-2">
          {profileMenuList.filter(item => !item.remove).map(item => (
            <div
              className={`profile-menu-item-2${item.logout ? ' logout' : ''}`}
              key={item.label}
              onClick={item.key === 'signout'
                ? () => { if (onSignOut) onSignOut(); }
                : item.key === 'payment'
                  ? () => onMenu('payment')
                  : item.key ? () => onMenu(item.key) : undefined}
            >
              <span className="profile-menu-icon-2">{item.icon}</span>
              <span>{item.label}</span>
              <span className="profile-menu-arrow-2">›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 