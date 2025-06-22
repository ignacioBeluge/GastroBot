import React, { useState, useEffect } from 'react';
import './Favorite.css';

const History = ({ onBack, setSelectedRecipe, setShowRecipeDetail, setPage, setFromHistory }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const hist = JSON.parse(localStorage.getItem('history') || '[]');
    setHistory(hist);
  }, []);

  const clearHist = () => {
    localStorage.removeItem('history');
    setHistory([]);
  };

  const handleRecipeClick = async (recipe) => {
    try {
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.idMeal}`);
      const data = await response.json();
      
      if (data.meals && data.meals[0]) {
        const meal = data.meals[0];
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
          const ing = meal[`strIngredient${i}`];
          const measure = meal[`strMeasure${i}`];
          if (ing && ing.trim() && ing.trim().toLowerCase() !== 'null' && ing.trim().toLowerCase() !== 'undefined') {
            ingredients.push((measure && measure.trim() ? measure.trim() + ' ' : '') + ing.trim());
          }
        }
        
        const fullRecipe = {
          ...meal,
          name: meal.strMeal,
          img: meal.strMealThumb,
          fullDesc: meal.strInstructions,
          time: meal.strTags || recipe.time,
          ingredients,
        };
        
        setSelectedRecipe(fullRecipe);
        setShowRecipeDetail(true);
        setFromHistory(true);
      }
    } catch (error) {
      console.error('Error fetching recipe details:', error);
    }
  };

  return (
    <div className="favorite-bg">
      <div className="favorite-container">
        <div className="favorite-header">
          <button className="favorite-back-btn" onClick={onBack}>
            <svg width="28" height="28" viewBox="0 0 22 22">
              <circle cx="11" cy="11" r="11" fill="#f5f5f5" />
              <path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          <span className="favorite-title">History</span>
          {history.length > 0 && (
            <button className="favorite-clear-btn" onClick={clearHist}>
              Clear All
            </button>
          )}
        </div>
        
        {history.length === 0 ? (
          <div className="favorite-empty">
            <div className="favorite-empty-icon">🕓</div>
            <h3 className="favorite-empty-title">No history yet</h3>
            <p className="favorite-empty-text">Start exploring recipes and they'll appear here!</p>
            <button className="favorite-empty-btn" onClick={() => setPage('categories')}>
              Explore Recipes
            </button>
          </div>
        ) : (
          <div className="favorite-list">
            {history.map((recipe) => (
              <div key={recipe.idMeal} className="favorite-item" onClick={() => handleRecipeClick(recipe)}>
                <img src={recipe.img} alt={recipe.name} className="favorite-image" />
                <div className="favorite-content">
                  <h3 className="favorite-name">{recipe.name}</h3>
                  <div className="favorite-meta">
                    <span className="favorite-time">{recipe.time}</span>
                    <span className="favorite-difficulty">{recipe.difficulty}</span>
                    <span className="favorite-rating">{recipe.rating} ⭐</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History; 