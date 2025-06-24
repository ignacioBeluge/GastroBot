import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCurrentUser } from '../services/authService';
import FilterBar from './FilterBar';
import { filterRecipes } from '../utils/recipeFilters';
import './MealType.css';
import { mealPlanService } from '../services/mealPlanService';
import { FaPlus } from 'react-icons/fa';
import AddToMealPlannerModal from './AddToMealPlannerModal';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealTimes = ['breakfast', 'lunch', 'snack', 'dinner'];

const MealTypeList = ({ onBack, selectedMealType, onRecipeSelect }) => {
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
        setFilteredRecipes(response.data);
      } catch (error) {
        console.error('MealTypeList: Error fetching meal type recipes:', error);
        setError('Failed to load recipes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMealTypeRecipes();
  }, [selectedMealType]);

  // Apply filters whenever filters or recipes change
  useEffect(() => {
    const filtered = filterRecipes(recipes, filters);
    setFilteredRecipes(filtered);
  }, [filters, recipes]);

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

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRecipeClick = (recipe) => {
    onRecipeSelect(recipe);
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

        {/* Filter Bar */}
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />
        
        {/* Results count */}
        <div className="meal-type-list-results">
          <span className="meal-type-list-results-text">
            Showing {filteredRecipes.length} of {recipes.length} recipes
          </span>
        </div>
        
        <div className="meal-type-list-grid">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.idMeal} className="meal-type-list-card" onClick={() => handleRecipeClick(recipe)}>
              <img src={recipe.img} alt={recipe.name} className="meal-type-list-image" />
              <button className="add-to-mealplan-btn" onClick={e => { e.stopPropagation(); handlePlusClick(recipe); }} title="Add to meal planner">
                <FaPlus />
              </button>
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
        
        {filteredRecipes.length === 0 && (
          <div className="meal-type-list-empty">
            <div className="meal-type-list-empty-icon">🍽️</div>
            <h3 className="meal-type-list-empty-title">
              {recipes.length === 0 ? `No ${selectedMealType ? selectedMealType.toLowerCase() : ''} recipes found` : 'No recipes match your filters'}
            </h3>
            <p className="meal-type-list-empty-text">
              {recipes.length === 0 ? 'This may be due to your dietary preferences. Try a different search!' : 'Try adjusting your filters to see more recipes.'}
            </p>
            {recipes.length > 0 && (
              <button 
                onClick={() => setFilters({ time: 'all', rating: 'all', difficulty: 'all' })}
                className="meal-type-list-clear-filters-btn"
              >
                Clear Filters
              </button>
            )}
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

export default MealTypeList; 