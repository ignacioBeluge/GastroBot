import React from 'react';
import './FilterBar.css';

const FilterBar = ({ filters, onFilterChange }) => {
  const timeOptions = [
    { value: 'all', label: 'No preference' },
    { value: 'quick', label: 'Quick (< 30 min)' },
    { value: 'medium', label: 'Medium (30-60 min)' },
    { value: 'long', label: 'Long (> 60 min)' }
  ];

  const ratingOptions = [
    { value: 'all', label: 'All Ratings' },
    { value: 'high', label: '4.5+ Stars' },
    { value: 'good', label: '4.0+ Stars' },
    { value: 'decent', label: '3.5+ Stars' }
  ];

  const difficultyOptions = [
    { value: 'all', label: 'All Levels' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  const handleFilterChange = (filterType, value) => {
    onFilterChange({
      ...filters,
      [filterType]: value
    });
  };

  return (
    <div className="filter-bar">
      <div className="filter-section">
        <label className="filter-label">Time:</label>
        <select 
          value={filters.time || 'all'} 
          onChange={(e) => handleFilterChange('time', e.target.value)}
          className="filter-select"
        >
          {timeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <label className="filter-label">Rating:</label>
        <select 
          value={filters.rating || 'all'} 
          onChange={(e) => handleFilterChange('rating', e.target.value)}
          className="filter-select"
        >
          {ratingOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <label className="filter-label">Difficulty:</label>
        <select 
          value={filters.difficulty || 'all'} 
          onChange={(e) => handleFilterChange('difficulty', e.target.value)}
          className="filter-select"
        >
          {difficultyOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button 
        onClick={() => onFilterChange({ time: 'all', rating: 'all', difficulty: 'all' })}
        className="filter-clear-btn"
      >
        Clear Filters
      </button>
    </div>
  );
};

export default FilterBar; 