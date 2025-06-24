import React, { useState, useRef, useEffect } from 'react';
import { getUserPreferences } from '../services/userService';
import { mealPlanService } from '../services/mealPlanService';
import './Search.css';
import { FaPlus } from 'react-icons/fa';

const Search = ({ onBack, onRecipeSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false); // Track if a search has been performed
  const searchInputRef = useRef(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedDay, setSelectedDay] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][0]);
  const [selectedMealTime, setSelectedMealTime] = useState(['breakfast', 'lunch', 'snack', 'dinner'][0]);
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [userMealPlan, setUserMealPlan] = useState({});

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTimes = ['breakfast', 'lunch', 'snack', 'dinner'];

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);
    setSearched(true); // Mark that a search has been initiated

    try {
      // Fetch preferences to send with the search
      const preferences = await getUserPreferences();

      const response = await fetch('http://localhost:5000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim(), preferences: preferences }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch recipes');
      }

      const recipes = await response.json();
      setResults(recipes);

    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred during the search. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = (recipe) => {
    onRecipeSelect(recipe, false); // Pass the full recipe object
  };

  const handlePlusClick = (recipe) => {
    setSelectedRecipe(recipe);
    setAddModalOpen(true);
    setAddError('');
    setSelectedDay(daysOfWeek[0]);
    setSelectedMealTime(mealTimes[0]);
  };

  const handleAddToMealPlan = async () => {
    setAddError('');
    setAddLoading(true);
    try {
      // Check if slot is already taken
      if (userMealPlan[selectedDay]?.[selectedMealTime]) {
        setAddError(`You already have a meal for ${selectedDay} ${selectedMealTime}`);
        setAddLoading(false);
        return;
      }
      // Add meal
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + daysOfWeek.indexOf(selectedDay));
      await mealPlanService.addMealPlan({
        date: date.toISOString().split('T')[0],
        mealTime: selectedMealTime,
        mealdbId: selectedRecipe.id,
        name: selectedRecipe.name,
        img: selectedRecipe.img
      });
      // Update local meal plan state
      setUserMealPlan(prev => {
        const updated = { ...prev };
        if (!updated[selectedDay]) updated[selectedDay] = {};
        updated[selectedDay][selectedMealTime] = { name: selectedRecipe.name };
        return updated;
      });
      setAddModalOpen(false);
      setSelectedRecipe(null);
      setAddLoading(false);
      // Optionally, trigger a callback to update the meal planner view if needed
    } catch (e) {
      setAddError(e.message || 'Could not add meal');
      setAddLoading(false);
    }
  };

  const handleCloseAddModal = () => {
    setAddModalOpen(false);
    setSelectedRecipe(null);
    setAddError('');
    setAddLoading(false);
  };

  return (
    <div className="search-bg">
      <div className="search-container">
        <div className="search-header">
          <button className="search-back-btn" onClick={onBack}>
            <svg width="28" height="28" viewBox="0 0 22 22">
              <circle cx="11" cy="11" r="11" fill="#f5f5f5" />
              <path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          <span className="search-title">Search Recipes</span>
        </div>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search for a recipe..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="search-submit-btn" disabled={loading}>
            {loading ? <div className="search-loader" /> : 'Search'}
          </button>
        </form>

        <div className="search-results">
          {error && <div className="search-error">{error}</div>}
          
          {results.length > 0 && (
            <div className="search-results-grid">
              {results.map((recipe) => (
                <div key={recipe.id} className="search-recipe-card" onClick={() => handleRecipeClick(recipe)}>
                  <img src={recipe.img} alt={recipe.name} className="search-recipe-image" />
                  <div className="search-recipe-content">
                    <h3 className="search-recipe-name">{recipe.name}</h3>
                    <div className="search-recipe-meta">
                      <span>{recipe.time}</span>
                      <span>{recipe.difficulty}</span>
                      <span>⭐ {recipe.rating}</span>
                    </div>
                  </div>
                  <button className="add-to-mealplan-btn" onClick={e => { e.stopPropagation(); handlePlusClick(recipe); }} title="Add to meal planner">
                    <FaPlus />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && searched && !error && (
            <div className="search-empty-state">
              <div className="search-empty-icon">😕</div>
              <h3>No Recipes Found</h3>
              <p>We couldn't find any recipes for "{query}". Try a different search!</p>
            </div>
          )}

          {!searched && !loading && (
             <div className="search-empty-state">
              <div className="search-empty-icon">🍳</div>
              <h3>What are you craving?</h3>
              <p>Use the search bar above to find your next favorite meal.</p>
            </div>
          )}
        </div>
      </div>

      {addModalOpen && (
        <div className="modal-overlay" onClick={handleCloseAddModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add to Meal Planner</h2>
              <button className="modal-close" onClick={handleCloseAddModal}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <img src={selectedRecipe?.img} alt={selectedRecipe?.name} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                <span style={{ fontWeight: 600, color: '#ff7a00' }}>{selectedRecipe?.name}</span>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Day: </label>
                <select className="add-meal-select" value={selectedDay} onChange={e => setSelectedDay(e.target.value)}>
                  {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
                <label style={{ marginLeft: '1rem' }}>Meal Time: </label>
                <select className="add-meal-select" value={selectedMealTime} onChange={e => setSelectedMealTime(e.target.value)}>
                  {mealTimes.map(mt => <option key={mt} value={mt}>{mt.charAt(0).toUpperCase() + mt.slice(1)}</option>)}
                </select>
              </div>
              {addError && <div style={{ color: '#ff4444', marginBottom: '1rem' }}>{addError}</div>}
              <button className="add-confirm-btn" onClick={handleAddToMealPlan} disabled={addLoading}>
                {addLoading ? 'Adding...' : 'Add to Meal Planner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search; 