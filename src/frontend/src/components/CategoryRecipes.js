import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`);
        const data = await response.json();
        
        if (data.meals) {
          const recipesWithDetails = data.meals.map(meal => ({
            ...meal,
            name: meal.strMeal,
            img: meal.strMealThumb,
            difficulty: getRandomDifficulty(),
            rating: getRandomRating(),
            time: getRandomTime(),
          }));
          setRecipes(recipesWithDetails);
        } else {
          setRecipes([]);
        }
      } catch (error) {
        console.error('Error fetching recipes:', error);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [category]);

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
          difficulty: recipe.difficulty,
          rating: recipe.rating,
        };
        
        onShowRecipe(fullRecipe);
      }
    } catch (error) {
      console.error('Error fetching recipe details:', error);
    }
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
            <span className="category-recipes-title">{category}</span>
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
          <span className="category-recipes-title">{category}</span>
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
                  <img src={recipe.img} alt={recipe.name} className="category-recipes-image" />
                  <div className="category-recipes-overlay">
                    <div className="category-recipes-meta">
                      <span className="category-recipes-time">{recipe.time}</span>
                      <span className="category-recipes-difficulty">{recipe.difficulty}</span>
                      <span className="category-recipes-rating">{recipe.rating} ⭐</span>
                    </div>
                  </div>
                </div>
                <div className="category-recipes-content">
                  <h3 className="category-recipes-name">{recipe.name}</h3>
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