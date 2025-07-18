const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { filterRecipes } = require('../services/recipeFilterService');

require('dotenv').config();

router.post('/', async (req, res) => {
  const { query, preferences } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    // Search for recipes by name
    const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch from TheMealDB');
    }

    const data = await response.json();

    if (!data.meals) {
      return res.json([]);
    }

    // Enhance each recipe with additional properties
    const enhancedRecipes = data.meals.map(meal => ({
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

    // Apply dietary preference filtering
    const filteredRecipes = filterRecipes(enhancedRecipes, preferences);

    res.json(filteredRecipes);

  } catch (error) {
    console.error('Error fetching from TheMealDB:', error);
    res.status(500).json({ error: 'Failed to fetch recipes from TheMealDB' });
  }
});

module.exports = router; 