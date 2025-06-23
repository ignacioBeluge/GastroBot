const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { filterRecipes } = require('../services/recipeFilterService');

// Rate limiting helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchFullRecipeDetails = async (recipeStub) => {
  try {
    // Add delay to prevent rate limiting
    await delay(100);
    
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
    const preferences = user.dietaryPreferences || [];

    console.log(`Category ${req.params.categoryName} - User preferences:`, preferences);

    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${req.params.categoryName}`);
    
    if (!response.ok) {
      console.error(`TheMealDB API error for category ${req.params.categoryName}:`, response.status, response.statusText);
      return res.status(500).json({ error: 'Failed to fetch recipes from external API' });
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error(`Invalid JSON response for category ${req.params.categoryName}:`, jsonError);
      const responseText = await response.text();
      console.error('Response text:', responseText);
      return res.status(500).json({ error: 'Invalid response from external API' });
    }

    if (!data.meals) {
      console.log(`No meals found for category: ${req.params.categoryName}`);
      return res.json([]);
    }

    console.log(`Found ${data.meals.length} recipes for category: ${req.params.categoryName}`);

    const recipeStubs = data.meals;
    const recipePromises = recipeStubs.map(stub => fetchFullRecipeDetails(stub));
    const fullRecipes = (await Promise.all(recipePromises)).filter(Boolean); // Filter out any nulls from failed fetches

    console.log(`Successfully fetched ${fullRecipes.length} full recipes`);

    const safeRecipes = filterRecipes(fullRecipes, preferences);

    console.log(`After filtering: ${safeRecipes.length} recipes remain`);

    res.json(safeRecipes);
  } catch (err) {
    console.error('Category endpoint error:', err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/mealtype/:typeName', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('dietaryPreferences');
    const preferences = user.dietaryPreferences || [];

    console.log(`Meal type ${req.params.typeName} - User preferences:`, preferences);

    // For meal types, we'll use a different approach since TheMealDB doesn't have a direct meal type filter
    // We'll search for common breakfast/lunch/dinner terms and combine results
    const searchTerms = {
      'Breakfast': ['breakfast', 'pancake', 'waffle', 'omelette', 'scrambled', 'bacon', 'toast', 'cereal'],
      'Lunch': ['lunch', 'sandwich', 'salad', 'soup', 'pasta', 'rice', 'chicken'],
      'Dinner': ['dinner', 'steak', 'roast', 'grilled', 'baked', 'fish', 'beef', 'lamb'],
      'Snack': ['snack', 'cookie', 'cake', 'muffin', 'brownie', 'chips', 'nuts']
    };

    const searchTermsForType = searchTerms[req.params.typeName] || [req.params.typeName.toLowerCase()];
    
    console.log(`Searching for meal type "${req.params.typeName}" with terms:`, searchTermsForType);

    // Fetch recipes for each search term with delays to avoid rate limiting
    const allRecipes = [];
    for (const term of searchTermsForType) {
      try {
        await delay(200); // Add delay between requests
        
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(term)}`);
        
        if (!response.ok) {
          console.warn(`TheMealDB API error for term "${term}":`, response.status);
          continue;
        }

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.warn(`Invalid JSON response for term "${term}":`, jsonError);
          continue;
        }

        if (data.meals) {
          const recipes = data.meals.map(meal => ({
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
          
          allRecipes.push(...recipes);
        }
      } catch (error) {
        console.warn(`Error fetching recipes for term "${term}":`, error.message);
      }
    }

    // Remove duplicates based on recipe ID
    const uniqueRecipes = Object.values(
      allRecipes.reduce((acc, recipe) => {
        acc[recipe.id] = recipe;
        return acc;
      }, {})
    );

    console.log(`Found ${uniqueRecipes.length} unique recipes for meal type: ${req.params.typeName}`);

    const safeRecipes = filterRecipes(uniqueRecipes, preferences);

    console.log(`After filtering: ${safeRecipes.length} recipes remain`);

    res.json(safeRecipes);
  } catch (err) {
    console.error('Meal type endpoint error:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 