import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import './Search.css';

const AddToMealPlannerModal = ({ open, onClose, recipe, onAdd, userMealPlan, daysOfWeek, mealTimes }) => {
  const [selectedDay, setSelectedDay] = useState(daysOfWeek[0]);
  const [selectedMealTime, setSelectedMealTime] = useState(mealTimes[0]);
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    setSelectedDay(daysOfWeek[0]);
    setSelectedMealTime(mealTimes[0]);
    setAddError('');
    setAddLoading(false);
  }, [open, daysOfWeek, mealTimes]);

  if (!open || !recipe) return null;

  const handleAdd = async () => {
    setAddError('');
    setAddLoading(true);
    if (userMealPlan[selectedDay]?.[selectedMealTime]) {
      setAddError(`You already have a meal for ${selectedDay} ${selectedMealTime}`);
      setAddLoading(false);
      return;
    }
    try {
      await onAdd({
        day: selectedDay,
        mealTime: selectedMealTime,
        recipe
      });
      setAddLoading(false);
      onClose();
    } catch (e) {
      setAddError(e.message || 'Could not add meal');
      setAddLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add to Meal Planner</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <img src={recipe.img} alt={recipe.name} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
            <span style={{ fontWeight: 600, color: '#ff7a00' }}>{recipe.name}</span>
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
          <button className="add-confirm-btn" onClick={handleAdd} disabled={addLoading}>
            {addLoading ? 'Adding...' : 'Add to Meal Planner'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToMealPlannerModal; 