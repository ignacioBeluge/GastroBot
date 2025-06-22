import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCurrentUser } from '../services/authService';
import './CategoryRecipes.css';

const getRandomDifficulty = () => {
  const difficulties = ['Easy', 'Medium', 'Hard'];
  return difficulties[Math.floor(Math.random() * difficulties.length)];
};

const getRandomRating = () => (4 + Math.random()).toFixed(1);

const getRandomTime = () => `${20 + Math.floor(Math.random() * 30)}min`;

const CategoryRecipes = ({ category, onBack, onShowRecipe }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const user = getCurrentUser();
        const token = user?.token;

        if (!token) {
          setError('You must be logged in to view recipes.');
          setLoading(false);
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/browse/category/${category.strCategory}`, {
          headers: { 'x-auth-token': token }
        });
        
        setRecipes(response.data);
      } catch (err) {
        setError('Failed to load recipes. Please try again later.');
        console.error('Error fetching category recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [category.strCategory]);

  const handleRecipeClick = (recipe) => {
    onShowRecipe(recipe);
  };

  if (loading) {
    return (
      <div className="category-recipes-bg">
        <div className="category-recipes-container">
          <div className="category-recipes-header">
            <button className="category-recipes-back-btn" onClick={onBack}>
              <svg width="28" height="28" viewBox="0 0 22 22">
                <circle cx="11" cy="11" r="11" fill="#f5f5f5" />
                <path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </button>
            <span className="category-recipes-title">{category.strCategory}</span>
          </div>
          <div className="category-recipes-loading">Loading recipes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="category-recipes-bg">
      <div className="category-recipes-container">
        <div className="category-recipes-header">
          <button className="category-recipes-back-btn" onClick={onBack}>
            <svg width="28" height="28" viewBox="0 0 22 22">
              <circle cx="11" cy="11" r="11" fill="#f5f5f5" />
              <path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          <span className="category-recipes-title">{category.strCategory}</span>
        </div>
        
        {recipes.length === 0 ? (
          <div className="category-recipes-empty">
            <div className="category-recipes-empty-icon">🍽️</div>
            <div className="category-recipes-empty-text">No recipes found for this category</div>
          </div>
        ) : (
          <div className="category-recipes-grid">
            {recipes.map((recipe) => (
              <div
                key={recipe.idMeal}
                className="category-recipes-card"
                onClick={() => handleRecipeClick(recipe)}
              >
                <div className="category-recipes-image-container">
                  <img src={recipe.strMealThumb} alt={recipe.strMeal} className="category-recipes-image" />
                  <div className="category-recipes-overlay">
                    <div className="category-recipes-meta">
                      <span className="category-recipes-time">{recipe.strTags || getRandomTime()}</span>
                      <span className="category-recipes-difficulty">{getRandomDifficulty()}</span>
                      <span className="category-recipes-rating">{getRandomRating()} ⭐</span>
                    </div>
                  </div>
                </div>
                <div className="category-recipes-content">
                  <h3 className="category-recipes-name">{recipe.strMeal}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryRecipes; 