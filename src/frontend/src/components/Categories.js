import React, { useState, useEffect } from 'react';
import './Categories.css';

const Categories = ({ onBack, onCategory }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://www.themealdb.com/api/json/v1/1/categories.php')
      .then(res => res.json())
      .then(data => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .catch(err => {
        console.error('Error fetching categories:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="categories-bg">
        <div className="categories-container">
          <div className="categories-header">
            <button className="categories-back-btn" onClick={onBack}>
              <svg width="28" height="28" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="11" fill="#f5f5f5" />
                <path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </button>
            <span className="categories-title">Categories</span>
          </div>
          <div className="categories-loading">Loading categories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="categories-bg">
      <div className="categories-container">
        <div className="categories-header">
          <button className="categories-back-btn" onClick={onBack}>
            <svg width="28" height="28" viewBox="0 0 22 22">
              <circle cx="11" cy="11" r="11" fill="#f5f5f5" />
              <path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          <span className="categories-title">Categories</span>
        </div>
        
        <div className="categories-grid">
          {categories.map((category) => (
            <div
              key={category.idCategory}
              className="category-card"
              onClick={() => onCategory(category)}
            >
              <img src={category.strCategoryThumb} alt={category.strCategory} className="category-image" />
              <div className="category-content">
                <h3 className="category-name">{category.strCategory}</h3>
                <p className="category-description">{category.strCategoryDescription}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories; 