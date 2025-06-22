import React, { useState, useEffect } from 'react';
import './MealType.css';

const MealTypeList = ({ onBack, selectedMealType }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMealTypeRecipes = async () => {
      try {
        // Fetch recipes based on meal type
        let searchQuery = '';
        switch (selectedMealType) {
          case 'Breakfast':
            searchQuery = 'breakfast';
            break;
          case 'Lunch':
            searchQuery = 'lunch';
            break;
          case 'Dinner':
            searchQuery = 'dinner';
            break;
          case 'Snack':
            searchQuery = 'snack';
            break;
          default:
            searchQuery = 'meal';
        }

        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${searchQuery}`);
        const data = await response.json();
        
        if (data.meals && data.meals.length > 0) {
          // Process and enhance the recipes
          const processedRecipes = data.meals.slice(0, 12).map(meal => {
            const ingredients = [];
            for (let i = 1; i <= 20; i++) {
              const ing = meal[`strIngredient${i}`];
              const measure = meal[`strMeasure${i}`];
              if (ing && ing.trim() && ing.trim().toLowerCase() !== 'null' && ing.trim().toLowerCase() !== 'undefined') {
                ingredients.push((measure && measure.trim() ? measure.trim() + ' ' : '') + ing.trim());
              }
            }
            
            return {
              ...meal,
              name: meal.strMeal,
              img: meal.strMealThumb,
              fullDesc: meal.strInstructions,
              time: meal.strTags || '30 min',
              ingredients,
              difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
              rating: (4 + Math.random()).toFixed(1),
            };
          });
          
          setRecipes(processedRecipes);
        } else {
          // Fallback to random recipes if no specific meal type recipes found
          const randomResponse = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
          const randomData = await randomResponse.json();
          if (randomData.meals && randomData.meals[0]) {
            const meal = randomData.meals[0];
            const ingredients = [];
            for (let i = 1; i <= 20; i++) {
              const ing = meal[`strIngredient${i}`];
              const measure = meal[`strMeasure${i}`];
              if (ing && ing.trim() && ing.trim().toLowerCase() !== 'null' && ing.trim().toLowerCase() !== 'undefined') {
                ingredients.push((measure && measure.trim() ? measure.trim() + ' ' : '') + ing.trim());
              }
            }
            
            const recipe = {
              ...meal,
              name: meal.strMeal,
              img: meal.strMealThumb,
              fullDesc: meal.strInstructions,
              time: meal.strTags || '30 min',
              ingredients,
              difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
              rating: (4 + Math.random()).toFixed(1),
            };
            
            setRecipes([recipe]);
          }
        }
      } catch (error) {
        console.error('Error fetching meal type recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMealTypeRecipes();
  }, [selectedMealType]);

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
            <div key={recipe.idMeal} className="meal-type-list-card">
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
            <h3 className="meal-type-list-empty-title">No {selectedMealType.toLowerCase()} recipes found</h3>
            <p className="meal-type-list-empty-text">Try searching for different meal types or check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealTypeList; 