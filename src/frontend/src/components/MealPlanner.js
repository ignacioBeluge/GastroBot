import React, { useState, useEffect } from 'react';
import './MealPlanner.css';
import { mealPlanService } from '../services/mealPlanService';
import { getUserPreferences } from '../services/userService';
import { getCurrentUser } from '../services/authService';
import { FaRegEye, FaTimes } from 'react-icons/fa';

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
          const dateObj = new Date(mp.date);
          const dayIdx = (dateObj.getUTCDay() + 6) % 7; // 0=Monday, 1=Tuesday, ..., 6=Sunday
          const day = daysOfWeek[dayIdx];
          if (!planMap[day]) planMap[day] = {};
          planMap[day][mp.mealTime] = { ...mp };
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
        name: recipeObj.name,
        img: recipeObj.img
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

  // Hover state for expanded cell
  const [hoveredCell, setHoveredCell] = useState({ day: null, mealTime: null });

  // Modal state for recipe details
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Handler for details icon
  const handleShowDetails = (meal) => {
    setSelectedRecipe(meal);
    setModalOpen(true);
  };

  // Handler for closing modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRecipe(null);
  };

  // Render the grid using CSS grid
  return (
    <div className="meal-planner-container">
      <div className="meal-planner-grid">
        {/* Corner cell */}
        <div className="corner-cell" style={{ gridRow: 1, gridColumn: 1 }}></div>
        {/* Header cells */}
        {daysOfWeek.map((day, i) => (
          <div key={day} className="header-cell" style={{ gridRow: 1, gridColumn: i + 2 }}>{day}</div>
        ))}
        {/* Meal time labels and cells */}
        {mealTimes.map((mealTime, rowIdx) => (
          <React.Fragment key={mealTime}>
            <div className="meal-time-cell" style={{ gridRow: rowIdx + 2, gridColumn: 1 }}>{mealTime.charAt(0).toUpperCase() + mealTime.slice(1)}</div>
            {daysOfWeek.map((day, colIdx) => (
              <div
                key={day + mealTime}
                className={`cell${hoveredCell.day === day && hoveredCell.mealTime === mealTime ? ' cell-expanded' : ''}`}
                style={{ gridRow: rowIdx + 2, gridColumn: colIdx + 2 }}
                onClick={() => handleCellClick(day, mealTime)}
                onMouseEnter={() => setHoveredCell({ day, mealTime })}
                onMouseLeave={() => setHoveredCell({ day: null, mealTime: null })}
              >
                {mealPlan[day]?.[mealTime]?.name ? (
                  hoveredCell.day === day && hoveredCell.mealTime === mealTime ? (
                    <div className="cell-expanded-content">
                      {mealPlan[day][mealTime].img && (
                        <img src={mealPlan[day][mealTime].img} alt={mealPlan[day][mealTime].name} className="cell-img-thumb" />
                      )}
                      <span
                        className={`cell-content${mealPlan[day][mealTime].name.length > 16 ? ' cell-content-long' : ''}`}
                        title={mealPlan[day][mealTime].name}
                      >
                        {mealPlan[day][mealTime].name}
                      </span>
                      <span className="cell-icons">
                        <FaRegEye
                          className="cell-icon cell-details-icon"
                          title="Show details"
                          onClick={e => { e.stopPropagation(); handleShowDetails(mealPlan[day][mealTime]); }}
                        />
                        <FaTimes
                          className="cell-icon cell-delete-icon"
                          title="Delete"
                          onClick={e => { e.stopPropagation(); handleDeleteMeal(mealPlan[day][mealTime]); }}
                        />
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`cell-content${mealPlan[day][mealTime].name.length > 16 ? ' cell-content-long' : ''}`}
                      title={mealPlan[day][mealTime].name}
                    >
                      {mealPlan[day][mealTime].name}
                    </span>
                  )
                ) : '+'}
              </div>
            ))}
          </React.Fragment>
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
      
      {/* Recipe Details Modal */}
      <RecipeModal 
        isOpen={modalOpen} 
        recipe={selectedRecipe} 
        onClose={handleCloseModal} 
      />
    </div>
  );
}

// Modal component for recipe details
const RecipeModal = ({ isOpen, recipe, onClose }) => {
  if (!isOpen || !recipe) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{recipe.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {recipe.img && (
            <div className="modal-image">
              <img src={recipe.img} alt={recipe.name} />
            </div>
          )}
          <div className="modal-info">
            <p><strong>Meal ID:</strong> {recipe.mealdbId}</p>
            <p><strong>Date:</strong> {recipe.date}</p>
            <p><strong>Meal Time:</strong> {recipe.mealTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanner; 