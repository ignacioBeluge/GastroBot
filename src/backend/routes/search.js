const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

require('dotenv').config();

router.post('/', async (req, res) => {
  const { query, preferences } = req.body;

  // console.log('Search query:', query);

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  let url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;

  // If preferences are provided, use them to refine the search.
  // Note: TheMealDB free API has limited filtering. This is a basic implementation.
  // For celiac/lactose, we primarily rely on AI filtering.
  if (preferences && preferences.includes('vegetarian')) {
    url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=Vegetarian`;
  }
  if (preferences && preferences.includes('vegan')) {
    url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=Vegan`;
  }
  
  // Custom prompt additions based on preferences
  let preferenceText = '';
  if (preferences && preferences.length > 0) {
    preferenceText = ` The user has the following dietary needs: ${preferences.join(', ')}. Ensure the recipe is suitable for them.`;
  }
  // This part would be used if we were still using AI search directly,
  // but we leave the logic here to show how it would be integrated.
  // The chat endpoint WILL use this logic.

  try {
    const allResults = await Promise.all(
      ingredients.map(async ingredient => {
        const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(ingredient)}`;
        const response = await fetch(url);

        if (!response.ok) {
          console.warn(`Failed for ingredient "${ingredient}"`);
          return [];
        }

        const data = await response.json();

        if (!data.meals) return [];

        // Enhance each recipe
        return data.meals.map(meal => ({
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
      })
    );

    // Flatten results and deduplicate by recipe ID
    const flatResults = allResults.flat();
    const uniqueResults = Object.values(Object.fromEntries(
      flatResults.map(r => [r.id, r]) // remove duplicates by id
    ));

    res.json(uniqueResults);

  } catch (error) {
    console.error('Error fetching from TheMealDB:', error);
    res.status(500).json({ error: 'Failed to fetch recipes from TheMealDB' });
  }
});

module.exports = router; 