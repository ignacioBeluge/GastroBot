import React from 'react';
import './MealType.css';

const MealType = ({ onBack, onSelect }) => (
  <div className="meal-type-bg">
    <div className="meal-type-container">
      <div className="meal-type-header">
        <button className="meal-type-back-btn" onClick={onBack}>
          <svg width="28" height="28" viewBox="0 0 22 22">
            <circle cx="11" cy="11" r="11" fill="#f5f5f5" />
            <path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </button>
        <span className="meal-type-title">Meal Types</span>
      </div>
      
      <div className="meal-type-grid">
        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
          <div key={type} className="meal-type-card" onClick={() => onSelect(type)}>
            <div className="meal-type-icon">
              {type === 'Breakfast' && '🌅'}
              {type === 'Lunch' && '🌞'}
              {type === 'Dinner' && '🌙'}
              {type === 'Snack' && '🍎'}
            </div>
            <h3 className="meal-type-name">{type}</h3>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default MealType; 