const express = require('express');
const router = express.Router();
const MealPlan = require('../models/MealPlan');
const auth = require('../middleware/auth');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const { filterRecipes } = require('../services/recipeFilterService');

// Add logging middleware
router.use((req, res, next) => {
  console.log(`[MealPlan API] ${req.method} ${req.originalUrl} - User: ${req.user ? req.user._id : 'N/A'}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('[MealPlan API] Payload:', req.body);
  }
  next();
});

// Get all meal plans for the authenticated user (optionally by week)
router.get('/', auth, async (req, res) => {
  try {
    const { weekStart, weekEnd } = req.query;
    const query = { user: req.user._id };
    if (weekStart && weekEnd) {
      query.date = { $gte: new Date(weekStart), $lte: new Date(weekEnd) };
    }
    const plans = await MealPlan.find(query).populate('recipe');
    console.log('[MealPlan API] Returning plans:', plans.length);
    res.json(plans);
  } catch (err) {
    console.error('[MealPlan API] GET error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add a meal plan entry
router.post('/', auth, async (req, res) => {
  try {
    const { date, mealTime, mealdbId, name } = req.body;
    if (!mealdbId || !name) {
      console.warn('[MealPlan API] POST missing mealdbId or name');
      return res.status(400).json({ message: 'mealdbId and name are required' });
    }
    const mealPlan = new MealPlan({
      user: req.user._id,
      date,
      mealTime,
      mealdbId,
      name
    });
    await mealPlan.save();
    console.log('[MealPlan API] Created meal plan:', mealPlan);
    res.status(201).json(mealPlan);
  } catch (err) {
    console.error('[MealPlan API] POST error:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update a meal plan entry
router.put('/:id', auth, async (req, res) => {
  try {
    const { date, mealTime, mealdbId, name } = req.body;
    const mealPlan = await MealPlan.findOne({ _id: req.params.id, user: req.user._id });
    if (!mealPlan) {
      console.warn('[MealPlan API] PUT not found:', req.params.id);
      return res.status(404).json({ message: 'Meal plan not found' });
    }
    if (date) mealPlan.date = date;
    if (mealTime) mealPlan.mealTime = mealTime;
    if (mealdbId) mealPlan.mealdbId = mealdbId;
    if (name) mealPlan.name = name;
    await mealPlan.save();
    console.log('[MealPlan API] Updated meal plan:', mealPlan);
    res.json(mealPlan);
  } catch (err) {
    console.error('[MealPlan API] PUT error:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete a meal plan entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!mealPlan) {
      console.warn('[MealPlan API] DELETE not found:', req.params.id);
      return res.status(404).json({ message: 'Meal plan not found' });
    }
    console.log('[MealPlan API] Deleted meal plan:', mealPlan._id);
    res.json({ message: 'Meal plan deleted' });
  } catch (err) {
    console.error('[MealPlan API] DELETE error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 