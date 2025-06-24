import React, { useState, useEffect } from 'react';
import './MealPlanner.css';
import { mealPlanService } from '../services/mealPlanService';
import { getUserPreferences } from '../services/userService';
import { getCurrentUser } from '../services/authService';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealTimes = ['breakfast', 'lunch', 'snack', 'dinner'];

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  return new Date(d.setDate(diff));
}

function getDateForDay(startOfWeek, dayIndex) {
  const d = new Date(startOfWeek);
  d.setDate(d.getDate() + dayIndex);
  return d;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

const initialPlan = {};

function MealPlanner() {
  const [mealPlan, setMealPlan] = useState(initialPlan);
  const [sidePanel, setSidePanel] = useState({ open: false, content: null });
  const [preferences, setPreferences] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));

  // Load user preferences and meal plan
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const user = getCurrentUser();
        if (!user || !user.token) {
          setLoading(false);
          return;
        }
        const prefs = await getUserPreferences();
        setPreferences(prefs);
        // Get meal plans for the week
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const plans = await mealPlanService.getMealPlans(formatDate(weekStart), formatDate(weekEnd));
        // Map to { [day]: { [mealTime]: mealObj } }
        const planMap = {};
        plans.forEach(mp => {
          const day = daysOfWeek[new Date(mp.date).getDay() === 0 ? 6 : new Date(mp.date).getDay() - 1];
          if (!planMap[day]) planMap[day] = {};
          planMap[day][mp.mealTime] = { ...mp, name: mp.recipe?.name || '' };
        });
        setMealPlan(planMap);
      } catch (e) {
        // handle error
      }
      setLoading(false);
    }
    fetchData();
  }, [weekStart]);

  // Handler for clicking a cell (add or view meal)
  const handleCellClick = async (day, mealTime) => {
    const meal = mealPlan[day]?.[mealTime];
    if (meal && meal.mealdbId && (!meal.details || !meal.details.ingredients || !meal.details.fullDesc)) {
      // Fetch full recipe details from TheMealDB if missing
      try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.mealdbId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.meals && data.meals[0]) {
            const m = data.meals[0];
            const details = {
              ...m,
              name: m.strMeal,
              img: m.strMealThumb,
              fullDesc: m.strInstructions,
              ingredients: Array.from({ length: 20 }, (_, i) => {
                const ing = m[`strIngredient${i + 1}`];
                const measure = m[`strMeasure${i + 1}`];
                return ing && ing.trim() ? `${measure || ''} ${ing}`.trim() : null;
              }).filter(Boolean),
            };
            setMealPlan(prev => {
              const updated = { ...prev };
              if (!updated[day]) updated[day] = {};
              updated[day][mealTime] = { ...meal, details };
              return updated;
            });
            setSidePanel({ open: true, content: { type: 'details', meal: { ...meal, details } } });
            return;
          }
        }
      } catch (e) { /* ignore */ }
    }
    setSearch('');
    setSearchResults([]);
    setSearchError('');
    setSidePanel({
      open: true,
      content: meal
        ? { type: 'details', meal }
        : { type: 'add', day, mealTime }
    });
  };

  // Handler for closing side panel
  const closeSidePanel = () => {
    setSidePanel({ open: false, content: null });
    setSearch('');
    setSearchResults([]);
    setSearchError('');
  };

  // Handler for adding a meal
  const handleAddMeal = async (recipeId) => {
    const { day, mealTime } = sidePanel.content;
    const date = formatDate(getDateForDay(weekStart, daysOfWeek.indexOf(day)));
    // Find the full recipe object from searchResults
    const recipeObj = searchResults.find(r => r.id === recipeId);
    if (!recipeObj) return;
    try {
      const res = await mealPlanService.addMealPlan({
        date,
        mealTime,
        mealdbId: recipeObj.id,
        name: recipeObj.name
      });
      setMealPlan(prev => {
        const updated = { ...prev };
        if (!updated[day]) updated[day] = {};
        updated[day][mealTime] = { ...res };
        return updated;
      });
      setSidePanel({ open: false, content: null });
    } catch (e) {
      alert(e.message || 'Could not add meal');
    }
  };

  // Handler for deleting a meal
  const handleDeleteMeal = async (meal) => {
    try {
      await mealPlanService.deleteMealPlan(meal._id);
      setMealPlan(prev => {
        const updated = { ...prev };
        if (updated[sidePanel.content.meal.day]) {
          delete updated[sidePanel.content.meal.day][sidePanel.content.meal.mealTime];
        }
        return updated;
      });
      closeSidePanel();
    } catch (e) {
      alert(e.message || 'Could not delete meal');
    }
  };

  // Real search: query backend when search changes
  useEffect(() => {
    if (!sidePanel.open || sidePanel.content?.type !== 'add') return;
    if (!search.trim()) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    let cancelled = false;
    async function doSearch() {
      setSearchLoading(true);
      setSearchError('');
      try {
        const user = getCurrentUser();
        const token = user?.token;
        const response = await fetch('http://localhost:5000/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'x-auth-token': token } : {})
          },
          body: JSON.stringify({ query: search.trim(), preferences }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to fetch recipes');
        }
        const recipes = await response.json();
        if (!cancelled) {
          setSearchResults(recipes);
        }
      } catch (err) {
        if (!cancelled) {
          setSearchError(err.message || 'An error occurred during the search. Please try again.');
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }
    doSearch();
    return () => { cancelled = true; };
  }, [search, preferences, sidePanel]);

  // Render the grid
  return (
    <div className="meal-planner-container">
      <div className="meal-planner-grid">
        <div className="header-row">
          <div className="corner-cell"></div>
          {daysOfWeek.map(day => (
            <div key={day} className="header-cell">{day}</div>
          ))}
        </div>
        {mealTimes.map(mealTime => (
          <div className="row" key={mealTime}>
            <div className="meal-time-cell">{mealTime.charAt(0).toUpperCase() + mealTime.slice(1)}</div>
            {daysOfWeek.map(day => (
              <div
                key={day + mealTime}
                className="cell"
                onClick={() => handleCellClick(day, mealTime)}
              >
                {mealPlan[day]?.[mealTime]?.name ? (
                  <span
                    className={`cell-content${mealPlan[day][mealTime].name.length > 16 ? ' cell-content-long' : ''}`}
                    title={mealPlan[day][mealTime].name}
                  >
                    {mealPlan[day][mealTime].name}
                  </span>
                ) : '+'}
              </div>
            ))}
          </div>
        ))}
      </div>
      {sidePanel.open && (
        <div className="side-panel">
          <button className="close-btn" onClick={closeSidePanel}>×</button>
          {/* Render content based on type */}
          {sidePanel.content.type === 'details' && (
            <div>
              <h2>{sidePanel.content.meal.name}</h2>
              <p><b>Meal Time:</b> {sidePanel.content.meal.mealTime}</p>
              <p><b>Date:</b> {formatDate(sidePanel.content.meal.date)}</p>
              <p><b>Ingredients:</b> {sidePanel.content.meal.details?.ingredients?.join(', ')}</p>
              <p><b>Description:</b> {sidePanel.content.meal.details?.fullDesc}</p>
              <button onClick={() => handleDeleteMeal(sidePanel.content.meal)}>Delete</button>
            </div>
          )}
          {sidePanel.content.type === 'add' && (
            <div>
              <h3>Add meal for {sidePanel.content.day} - {sidePanel.content.mealTime}</h3>
              <input
                type="text"
                placeholder="Search recipes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="recipe-search-input"
              />
              {searchLoading && <div style={{ color: '#ff7a00', margin: '1rem 0' }}>Searching...</div>}
              {searchError && <div className="no-recipes">{searchError}</div>}
              <div className="reduced-search-results">
                {searchResults.slice(0, 2).map(r => (
                  <div key={r.id} className="reduced-search-card" onClick={() => handleAddMeal(r.id)}>
                    <img src={r.img} alt={r.name} className="reduced-search-image" />
                    <div className="reduced-search-content">
                      <div className="reduced-search-name">{r.name}</div>
                      <div className="reduced-search-meta">
                        <span>{r.time}</span>
                        <span>{r.difficulty}</span>
                        <span>⭐ {r.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {!searchLoading && searchResults.length === 0 && search && !searchError && (
                  <div className="no-recipes">No recipes found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {loading && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, background: 'rgba(255,255,255,0.5)', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}
    </div>
  );
}

export default MealPlanner; 