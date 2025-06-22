import React, { useState } from 'react';
import { getCurrentUser, updateUser } from '../services/authService';
import './ProfilePage.css';

const EditProfile = ({ onBack }) => {
  const user = getCurrentUser();
  const [name, setName] = useState(user?.user?.name || '');
  const [bio, setBio] = useState(user?.user?.bio || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await updateUser(user.user.id, { name, bio });
      setSuccess('¡Perfil actualizado correctamente!');
      setTimeout(() => {
        setSuccess('');
        onBack();
      }, 1800);
    } catch (err) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
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
          <span className="profile-title">Edit Profile</span>
        </div>
        <div className="profile-avatar-big profile-avatar-edit-container">
          <span className="profile-avatar-edit">
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="14" fill="#ff7a00" />
              <path d="M9 19l7.5-7.5a1 1 0 0 1 1.4 0l1.1 1.1a1 1 0 0 1 0 1.4L11.5 21H9v-2z" fill="#fff" />
            </svg>
          </span>
        </div>
        <form className="profile-edit-form" onSubmit={handleSubmit}>
          <label>FULL NAME
            <input type="text" value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
          </label>
          <label>EMAIL
            <input type="email" value={user?.user?.email || ''} disabled readOnly />
          </label>
          <label>BIO
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} disabled={loading} />
          </label>
          {error && <div className="profile-error">{error}</div>}
          {success && <div className="profile-success">{success}</div>}
          <button className="profile-save-btn" type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'SAVE'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile; 