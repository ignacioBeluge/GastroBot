import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCurrentUser } from '../services/authService';
import FilterBar from './FilterBar';
import { filterRecipes } from '../utils/recipeFilters';
import './CategoryRecipes.css';
import { mealPlanService } from '../services/mealPlanService';
import { FaPlus } from 'react-icons/fa';
import AddToMealPlannerModal from './AddToMealPlannerModal';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealTimes = ['breakfast', 'lunch', 'snack', 'dinner'];

const getRandomDifficulty = () => {
  const difficulties = ['Easy', 'Medium', 'Hard'];
  return difficulties[Math.floor(Math.random() * difficulties.length)];
};

const getRandomRating = () => (4 + Math.random()).toFixed(1);

const getRandomTime = () => `${20 + Math.floor(Math.random() * 30)}min`;

const CategoryRecipes = ({ category, onBack, onShowRecipe }) => {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    time: 'all',
    rating: 'all',
    difficulty: 'all'
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [userMealPlan, setUserMealPlan] = useState({});

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
        setFilteredRecipes(response.data);
      } catch (err) {
        setError('Failed to load recipes. Please try again later.');
        console.error('Error fetching category recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [category.strCategory]);

  // Fetch user's meal plan for the week on mount
  useEffect(() => {
    async function fetchMealPlan() {
      try {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const plans = await mealPlanService.getMealPlans(weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]);
        const planMap = {};
        plans.forEach(mp => {
          const dateObj = new Date(mp.date);
          const dayIdx = (dateObj.getUTCDay() + 6) % 7;
          const day = daysOfWeek[dayIdx];
          if (!planMap[day]) planMap[day] = {};
          planMap[day][mp.mealTime] = { ...mp };
        });
        setUserMealPlan(planMap);
      } catch (e) {
        // ignore
      }
    }
    fetchMealPlan();
  }, []);

  // Apply filters whenever filters or recipes change
  useEffect(() => {
    const filtered = filterRecipes(recipes, filters);
    setFilteredRecipes(filtered);
  }, [filters, recipes]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRecipeClick = (recipe) => {
    onShowRecipe(recipe);
  };

  const handlePlusClick = (recipe) => {
    setSelectedRecipe(recipe);
    setAddModalOpen(true);
  };

  const handleAddToMealPlan = async ({ day, mealTime, recipe }) => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + daysOfWeek.indexOf(day));
    await mealPlanService.addMealPlan({
      date: date.toISOString().split('T')[0],
      mealTime,
      mealdbId: recipe.idMeal || recipe.id,
      name: recipe.name,
      img: recipe.img
    });
    // Update local meal plan state
    setUserMealPlan(prev => {
      const updated = { ...prev };
      if (!updated[day]) updated[day] = {};
      updated[day][mealTime] = { name: recipe.name };
      return updated;
    });
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

        {/* Filter Bar */}
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />
        
        {/* Results count */}
        <div className="category-recipes-results">
          <span className="category-recipes-results-text">
            Showing {filteredRecipes.length} of {recipes.length} recipes
          </span>
        </div>
        
        {filteredRecipes.length === 0 ? (
          <div className="category-recipes-empty">
            <div className="category-recipes-empty-icon">🍽️</div>
            <div className="category-recipes-empty-text">
              {recipes.length === 0 ? 'No recipes found for this category' : 'No recipes match your filters'}
            </div>
            {recipes.length > 0 && (
              <button 
                onClick={() => setFilters({ time: 'all', rating: 'all', difficulty: 'all' })}
                className="category-recipes-clear-filters-btn"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="category-recipes-grid">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.idMeal}
                className="category-recipes-card"
                onClick={() => handleRecipeClick(recipe)}
              >
                <div className="category-recipes-image-container">
                  <img src={recipe.img} alt={recipe.name} className="category-recipes-image" />
                  <button className="add-to-mealplan-btn" onClick={e => { e.stopPropagation(); handlePlusClick(recipe); }} title="Add to meal planner">
                    <FaPlus />
                  </button>
                  <div className="category-recipes-overlay">
                    <div className="category-recipes-meta">
                      <span className="category-recipes-time">{recipe.time || getRandomTime()}</span>
                      <span className="category-recipes-difficulty">{recipe.difficulty || getRandomDifficulty()}</span>
                      <span className="category-recipes-rating">{recipe.rating || getRandomRating()} ⭐</span>
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
      <AddToMealPlannerModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        recipe={selectedRecipe}
        onAdd={handleAddToMealPlan}
        userMealPlan={userMealPlan}
        daysOfWeek={daysOfWeek}
        mealTimes={mealTimes}
      />
    </div>
  );
};

export default CategoryRecipes; 