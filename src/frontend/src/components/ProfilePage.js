import React, { useRef, useState } from 'react';
import { getCurrentUser } from '../services/authService';
import { uploadProfilePicture } from '../services/userService';
import './ProfilePage.css';
// import { useNavigate } from 'react-router-dom';

const profileMenuList = [
  { icon: '🧑‍💼', label: 'Personal Info', key: 'personal' },
  { icon: '💳', label: 'Payment', key: 'payment' },
  { icon: '🚪', label: 'Sign Out', key: 'signout', logout: true },
];

const ProfilePage = ({ onBack, onMenu, onSignOut }) => {
  const [userObj, setUserObj] = useState(getCurrentUser());
  const name = userObj?.user?.name || '';
  const bio = userObj?.user?.bio || '';
  const plan = userObj?.user?.plan || 'free';
  const profilePicture = userObj?.user?.profilePicture || '';
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const res = await uploadProfilePicture(file);
      // Update localStorage and state
      const updatedUser = { ...userObj };
      updatedUser.user.profilePicture = res.profilePicture;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserObj(updatedUser);
    } catch (err) {
      setUploadError('Failed to upload image.');
    }
    setUploading(false);
  };

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
          <div className="profile-avatar-big profile-avatar-upload" onClick={handleAvatarClick} style={{ cursor: 'pointer', position: 'relative' }}>
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="profile-avatar-img" />
            ) : (
              <span className="profile-avatar-placeholder">👤</span>
            )}
            {uploading && <div className="profile-avatar-uploading">Uploading...</div>}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>
        {plan === 'pro' && (
          <div className="profile-pro-badge">PRO</div>
        )}
        {uploadError && <div className="profile-error">{uploadError}</div>}
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