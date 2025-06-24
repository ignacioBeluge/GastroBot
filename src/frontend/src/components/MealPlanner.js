import React, { useState, useEffect } from 'react';
import './MealPlanner.css';
import { mealPlanService } from '../services/mealPlanService';
import { recipeService } from '../services/recipeService';
import { getUserPreferences } from '../services/userService';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealTimes = ['breakfast', 'lunch', 'dinner', 'snack'];

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
  const [recipes, setRecipes] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));

  // Load user preferences, recipes, and meal plan
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const prefs = await getUserPreferences();
        setPreferences(prefs);
        const allRecipes = await recipeService.getAllRecipes();
        // Filter recipes by preferences (frontend, backend will also check)
        const filtered = prefs && prefs.length > 0
          ? allRecipes.filter(r => !r.ingredients || r.ingredients.every(ing => !prefs.some(p => (ing || '').toLowerCase().includes(p.toLowerCase()))))
          : allRecipes;
        setRecipes(filtered);
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
  const handleCellClick = (day, mealTime) => {
    const meal = mealPlan[day]?.[mealTime];
    setSidePanel({
      open: true,
      content: meal ? { type: 'details', meal } : { type: 'add', day, mealTime }
    });
  };

  // Handler for closing side panel
  const closeSidePanel = () => {
    setSidePanel({ open: false, content: null });
  };

  // Handler for adding a meal
  const handleAddMeal = async (recipeId) => {
    const { day, mealTime } = sidePanel.content;
    const date = formatDate(getDateForDay(weekStart, daysOfWeek.indexOf(day)));
    try {
      const res = await mealPlanService.addMealPlan({ date, mealTime, recipe: recipeId });
      // Update state
      setMealPlan(prev => {
        const updated = { ...prev };
        if (!updated[day]) updated[day] = {};
        const recipeObj = recipes.find(r => r._id === recipeId);
        updated[day][mealTime] = { ...res, name: recipeObj?.name || '' };
        return updated;
      });
      closeSidePanel();
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

  // Filter recipes by search
  const filteredRecipes = recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

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
                {mealPlan[day]?.[mealTime]?.name || '+'}
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
              <p><b>Ingredients:</b> {sidePanel.content.meal.recipe?.ingredients?.join(', ')}</p>
              <p><b>Description:</b> {sidePanel.content.meal.recipe?.fullDesc}</p>
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
                style={{ width: '100%', marginBottom: 12 }}
              />
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {filteredRecipes.map(r => (
                  <div key={r._id} style={{ padding: 8, borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => handleAddMeal(r._id)}>
                    <b>{r.name}</b>
                    <div style={{ fontSize: 12, color: '#888' }}>{r.ingredients?.slice(0, 3).join(', ')}{r.ingredients?.length > 3 ? '...' : ''}</div>
                  </div>
                ))}
                {filteredRecipes.length === 0 && <div>No recipes found.</div>}
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