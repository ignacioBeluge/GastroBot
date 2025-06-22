import React, { useState } from 'react';
import './RecipeDetail.css';

const splitSteps = (instructions) => {
  if (!instructions) return [];
  // Check if the instructions are newline-separated (from AI) or period-separated (from DB)
  if (instructions.includes('\n')) {
    return instructions.split('\n').filter(step => step.trim().length > 0);
  }
  return instructions
    .split(/\.\s+/)
    .filter(step => step.trim().length > 0)
    .map(step => step.trim() + (step.endsWith('.') ? '' : '.'));
};

const getFavorites = () => JSON.parse(localStorage.getItem('favorites') || '[]');
const getHistory = () => JSON.parse(localStorage.getItem('history') || '[]');

const RecipeDetail = ({ recipe, onBack }) => {
  const [isFavorite, setIsFavorite] = useState(() => {
    const favorites = getFavorites();
    return favorites.some(fav => fav.idMeal === recipe.idMeal);
  });

  const toggleFav = () => {
    const favorites = getFavorites();
    if (isFavorite) {
      const newFavorites = favorites.filter(fav => fav.idMeal !== recipe.idMeal);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      favorites.push(recipe);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      setIsFavorite(true);
    }
  };

  // Add to history
  React.useEffect(() => {
    const history = getHistory();
    const existingIndex = history.findIndex(item => item.idMeal === recipe.idMeal);
    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }
    history.unshift(recipe);
    if (history.length > 50) {
      history.splice(50);
    }
    localStorage.setItem('history', JSON.stringify(history));
  }, [recipe]);

  const steps = splitSteps(recipe.fullDesc);

  return (
    <div className="recipe-detail-bg">
      <div className="recipe-detail-card">
        <div className="recipe-detail-header">
          <button className="recipe-detail-back-btn" onClick={onBack}>
            <svg width="28" height="28" viewBox="0 0 22 22">
              <circle cx="11" cy="11" r="11" fill="#f5f5f5" />
              <path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          <span className="recipe-detail-title">Recipe Detail</span>
          <button className="recipe-detail-fav-btn" onClick={toggleFav}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? "#ff7a00" : "none"} stroke="#ff7a00" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        <div className="recipe-detail-image-container">
          <img src={recipe.img} alt={recipe.name} className="recipe-detail-image" />
          <div className="recipe-detail-overlay">
            <div className="recipe-detail-meta">
              <span className="recipe-detail-time">{recipe.time || '30 min'}</span>
              <span className="recipe-detail-difficulty">Medium</span>
              <span className="recipe-detail-rating">4.5 ⭐</span>
            </div>
          </div>
        </div>

        <div className="recipe-detail-content">
          <h1 className="recipe-detail-name">{recipe.name}</h1>
          
          <div className="recipe-detail-section">
            <h2 className="recipe-detail-section-title">Ingredients</h2>
            <div className="recipe-detail-ingredients">
              {recipe.ingredients.map((ingredient, index) => (
                <div key={index} className="recipe-detail-ingredient">
                  <span className="recipe-detail-ingredient-bullet">•</span>
                  <span className="recipe-detail-ingredient-text">{ingredient}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="recipe-detail-section">
            <h2 className="recipe-detail-section-title">Instructions</h2>
            <div className="recipe-detail-instructions">
              {steps.map((step, index) => (
                <div key={index} className="recipe-detail-step">
                  <div className="recipe-detail-step-number">{index + 1}</div>
                  <div className="recipe-detail-step-text">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail; 