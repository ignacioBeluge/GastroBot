import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCurrentUser } from '../services/authService';
import './MealType.css';

const MealTypeList = ({ onBack, selectedMealType, onRecipeSelect }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedMealType) {
      console.log('MealTypeList: selectedMealType is null or undefined');
      return;
    }

    console.log('MealTypeList: Fetching recipes for meal type:', selectedMealType);

    const fetchMealTypeRecipes = async () => {
      setLoading(true);
      setError('');
      try {
        const user = getCurrentUser();
        const token = user?.token;

        if (!token) {
          setError('You must be logged in to view recipes.');
          setLoading(false);
          return;
        }

        console.log('MealTypeList: Making API call to:', `http://localhost:5000/api/browse/mealtype/${selectedMealType}`);

        const response = await axios.get(`http://localhost:5000/api/browse/mealtype/${selectedMealType}`, {
          headers: { 'x-auth-token': token }
        });

        console.log('MealTypeList: Received response with', response.data.length, 'recipes');

        setRecipes(response.data);
      } catch (error) {
        console.error('MealTypeList: Error fetching meal type recipes:', error);
        setError('Failed to load recipes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMealTypeRecipes();
  }, [selectedMealType]);

  const handleRecipeClick = (recipe) => {
    onRecipeSelect(recipe);
  };

  if (loading) {
    return (
      <div className="meal-type-list-bg">
        <div className="meal-type-list-container">
          <div className="meal-type-list-header">
            <button className="meal-type-list-back-btn" onClick={onBack}>
              <svg width="28" height="28" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="11" fill="#f5f5f5" />
                <path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </button>
            <span className="meal-type-list-title">{selectedMealType} Recipes</span>
          </div>
          <div className="meal-type-list-loading">Loading {selectedMealType.toLowerCase()} recipes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="meal-type-list-bg">
      <div className="meal-type-list-container">
        <div className="meal-type-list-header">
          <button className="meal-type-list-back-btn" onClick={onBack}>
            <svg width="28" height="28" viewBox="0 0 22 22">
              <circle cx="11" cy="11" r="11" fill="#f5f5f5" />
              <path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          <span className="meal-type-list-title">{selectedMealType} Recipes</span>
        </div>
        
        <div className="meal-type-list-grid">
          {recipes.map((recipe) => (
            <div key={recipe.idMeal} className="meal-type-list-card" onClick={() => handleRecipeClick(recipe)}>
              <img src={recipe.img} alt={recipe.name} className="meal-type-list-image" />
              <div className="meal-type-list-content">
                <h3 className="meal-type-list-name">{recipe.name}</h3>
                <div className="meal-type-list-meta">
                  <span className="meal-type-list-time">{recipe.time}</span>
                  <span className="meal-type-list-difficulty">{recipe.difficulty}</span>
                  <span className="meal-type-list-rating">{recipe.rating} ⭐</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {recipes.length === 0 && (
          <div className="meal-type-list-empty">
            <div className="meal-type-list-empty-icon">🍽️</div>
            <h3 className="meal-type-list-empty-title">No {selectedMealType ? selectedMealType.toLowerCase() : ''} recipes found</h3>
            <p className="meal-type-list-empty-text">This may be due to your dietary preferences. Try a different search!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealTypeList; 