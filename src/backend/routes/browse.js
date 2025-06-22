const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { filterRecipes } = require('../services/recipeFilterService');

const fetchFullRecipeDetails = async (recipeStub) => {
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeStub.idMeal}`);
    const data = await response.json();
    if (!data.meals || data.meals.length === 0) return null;
    
    const meal = data.meals[0];
    return {
      ...meal,
      id: meal.idMeal,
      name: meal.strMeal,
      img: meal.strMealThumb,
      fullDesc: meal.strInstructions,
      time: meal.strTags ? meal.strTags.split(',')[0] : `${20 + Math.floor(Math.random() * 40)} min`,
      difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      ingredients: Array.from({ length: 20 }, (_, i) => {
        const ing = meal[`strIngredient${i + 1}`];
        const measure = meal[`strMeasure${i + 1}`];
        return ing && ing.trim() ? `${measure || ''} ${ing}`.trim() : null;
      }).filter(Boolean),
    };
  } catch (error) {
    return null;
  }
};

router.get('/category/:categoryName', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('dietaryPreferences');
    const preferences = user.dietaryPreferences;

    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${req.params.categoryName}`);
    const data = await response.json();
    if (!data.meals) return res.json([]);

    const recipeStubs = data.meals;
    const recipePromises = recipeStubs.map(stub => fetchFullRecipeDetails(stub));
    const fullRecipes = (await Promise.all(recipePromises)).filter(Boolean); // Filter out any nulls from failed fetches

    const safeRecipes = filterRecipes(fullRecipes, preferences);

    res.json(safeRecipes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/mealtype/:typeName', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('dietaryPreferences');
    const preferences = user.dietaryPreferences;

    // TheMealDB uses 'search' for meal types, not a filter.
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${req.params.typeName}`);
    const data = await response.json();
    if (!data.meals) return res.json([]);

    // The 'search' endpoint returns full details, so no extra lookups needed.
    const fullRecipes = data.meals.map(meal => ({
      ...meal,
      id: meal.idMeal,
      name: meal.strMeal,
      img: meal.strMealThumb,
      fullDesc: meal.strInstructions,
      time: meal.strTags ? meal.strTags.split(',')[0] : `${20 + Math.floor(Math.random() * 40)} min`,
      difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      ingredients: Array.from({ length: 20 }, (_, i) => {
        const ing = meal[`strIngredient${i + 1}`];
        const measure = meal[`strMeasure${i + 1}`];
        return ing && ing.trim() ? `${measure || ''} ${ing}`.trim() : null;
      }).filter(Boolean),
    }));

    const safeRecipes = filterRecipes(fullRecipes, preferences);

    res.json(safeRecipes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 