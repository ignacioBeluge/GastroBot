const express = require('express');
const router = express.Router();
const MealPlan = require('../models/MealPlan');
const auth = require('../middleware/auth');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const { filterRecipes } = require('../services/recipeFilterService');

// Get all meal plans for the authenticated user (optionally by week)
router.get('/', auth, async (req, res) => {
  try {
    const { weekStart, weekEnd } = req.query;
    const query = { user: req.user._id };
    if (weekStart && weekEnd) {
      query.date = { $gte: new Date(weekStart), $lte: new Date(weekEnd) };
    }
    const plans = await MealPlan.find(query).populate('recipe');
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a meal plan entry
router.post('/', auth, async (req, res) => {
  try {
    const { date, mealTime, recipe } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const recipeDoc = await Recipe.findById(recipe);
    if (!recipeDoc) return res.status(404).json({ message: 'Recipe not found' });
    // Convert recipeDoc to plain object and add ingredients array if needed
    const recipeObj = recipeDoc.toObject();
    if (!recipeObj.ingredients && recipeObj.ingredient) {
      recipeObj.ingredients = recipeObj.ingredient;
    }
    // Ensure ingredients is an array of strings
    if (!Array.isArray(recipeObj.ingredients)) {
      recipeObj.ingredients = [];
    }
    // Filter check
    const filtered = filterRecipes([recipeObj], user.dietaryPreferences);
    if (filtered.length === 0) {
      return res.status(400).json({ message: 'Recipe does not match your dietary preferences' });
    }
    const mealPlan = new MealPlan({
      user: req.user._id,
      date,
      mealTime,
      recipe
    });
    await mealPlan.save();
    res.status(201).json(mealPlan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a meal plan entry
router.put('/:id', auth, async (req, res) => {
  try {
    const { date, mealTime, recipe } = req.body;
    const mealPlan = await MealPlan.findOne({ _id: req.params.id, user: req.user._id });
    if (!mealPlan) return res.status(404).json({ message: 'Meal plan not found' });
    if (date) mealPlan.date = date;
    if (mealTime) mealPlan.mealTime = mealTime;
    if (recipe) mealPlan.recipe = recipe;
    await mealPlan.save();
    res.json(mealPlan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a meal plan entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!mealPlan) return res.status(404).json({ message: 'Meal plan not found' });
    res.json({ message: 'Meal plan deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 