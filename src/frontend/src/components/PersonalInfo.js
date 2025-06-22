import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import { getUserPreferences, updateUserPreferences } from '../services/userService';
import './PersonalInfo.css';

const dietaryOptions = [
  { id: 'celiac', name: 'Celiac' },
  { id: 'lactose-intolerant', name: 'Lactose Intolerant' },
  { id: 'vegetarian', name: 'Vegetarian' },
  { id: 'vegan', name: 'Vegan' },
  { id: 'weight-loss', name: 'Weight Loss' },
  { id: 'weight-gain', name: 'Weight Gain' },
];

const PersonalInfo = ({ onBack, onEdit }) => {
  const user = getCurrentUser()?.user;
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const data = await getUserPreferences();
        setPreferences(data || []);
      } catch (err) {
        setError('Failed to load preferences.');
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleTogglePreference = (prefId) => {
    setPreferences(prev => 
      prev.includes(prefId) ? prev.filter(p => p !== prefId) : [...prev, prefId]
    );
  };

  const handleSaveChanges = async () => {
    setError('');
    setSuccess('');
    try {
      await updateUserPreferences(preferences);
      setSuccess('Preferences saved successfully!');
      setTimeout(() => setSuccess(''), 3000); // Clear message after 3 seconds
    } catch (err) {
      setError('Failed to save preferences. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="personal-info-bg">
        <div className="personal-info-container">
          <p>You must be logged in to view this page.</p>
          <button onClick={onBack}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="personal-info-bg">
      <div className="personal-info-container">
        <div className="personal-info-header">
          <button className="personal-info-back-btn" onClick={onBack}>
            <svg width="28" height="28" viewBox="0 0 22 22">
              <circle cx="11" cy="11" r="11" fill="#f5f5f5" />
              <path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          <span className="personal-info-title">Personal Information</span>
        </div>

        <div className="personal-info-content">
          <div className="personal-info-item">
            <span className="info-label">Name</span>
            <span className="info-value">{user.name}</span>
          </div>
          <div className="personal-info-item">
            <span className="info-label">Email</span>
            <span className="info-value">{user.email}</span>
          </div>
          <button className="edit-profile-btn" onClick={onEdit}>Edit Profile</button>
        </div>

        <div className="dietary-preferences-section">
          <h2 className="dietary-preferences-title">Dietary Preferences</h2>
          {loading ? (
            <p>Loading preferences...</p>
          ) : (
            <div className="dietary-options-grid">
              {dietaryOptions.map(option => (
                <button
                  key={option.id}
                  className={`dietary-option-btn ${preferences.includes(option.id) ? 'selected' : ''}`}
                  onClick={() => handleTogglePreference(option.id)}
                >
                  {option.name}
                </button>
              ))}
            </div>
          )}
          <button className="save-preferences-btn" onClick={handleSaveChanges}>
            Save Changes
          </button>
          {error && <p className="pref-error-msg">{error}</p>}
          {success && <p className="pref-success-msg">{success}</p>}
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo; 