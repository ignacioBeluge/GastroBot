const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Cargar variables de entorno
require('dotenv').config();

const isRecipeQuery = (text) => {
  const lowerText = text.toLowerCase();
  const keywords = [
    'recipe', 'cook', 'make', 'prepare', 'ingredients for', 
    'how to', 'what is in a', 'can you find', 'recipe for'
  ];
  return keywords.some(k => lowerText.includes(k));
};

const fetchRecipesFromDB = async (query) => {
  const ingredients = query.toLowerCase().replace('recipe for', '').replace('a recipe for', '').split(/[, ]+/).map(q => q.trim()).filter(Boolean);
  const allResults = await Promise.all(
    ingredients.map(async ingredient => {
      const url = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`;
      try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return data.meals || [];
      } catch {
        return [];
      }
    })
  );
  const flatResults = allResults.flat();
  return Object.values(Object.fromEntries(
    flatResults.map(r => [r.idMeal, r])
  ));
};

const generateRecipeWithAI = async (query, preferences = []) => {
  let preferenceText = '';
  if (preferences && preferences.length > 0) {
    preferenceText = ` The user has the following dietary needs: ${preferences.join(', ')}. Please ensure the recipe is strictly suitable for them (e.g., for 'celiac', no gluten; for 'lactose-intolerant', no dairy).`;
  }

  const prompt = `You are a world-class chef and recipe database. A user is searching for a recipe for "${query}".${preferenceText} Provide a single, complete recipe for this dish. Return the recipe as a JSON object with the following structure: {"name": "Recipe Name","time": "e.g., '45 min'","difficulty": "Easy, Medium, or Hard","rating": "e.g., 4.7","ingredients": ["1 cup flour", "2 eggs"],"fullDesc": "Step-by-step instructions separated by newline characters (\\n)."}. Only return the JSON object, with no other text.`;
  try {
    const response = await fetch('https://free.v36.cm/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: prompt }], temperature: 0.3 }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const recipeContent = data.choices[0].message.content;
    const cleanedJson = recipeContent.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error('Error generating recipe with AI:', error);
    return null;
  }
};

router.post('/', async (req, res) => {
  const { messages, preferences } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  const userMessage = messages[messages.length - 1];
  const userQuery = userMessage.content;

  if (isRecipeQuery(userQuery)) {
    try {
      const dbRecipes = await fetchRecipesFromDB(userQuery);
      if (dbRecipes.length > 0) {
        return res.json({ type: 'recipe_list', content: dbRecipes.slice(0, 5) }); // Limit to 5 results
      }

      // If DB fails, fallback to AI generation
      const aiRecipe = await generateRecipeWithAI(userQuery, preferences);
      if (aiRecipe) {
        const mappedRecipe = {
          idMeal: `ai-${Date.now()}`,
          strMeal: aiRecipe.name,
          strMealThumb: null,
          name: aiRecipe.name,
          img: null,
          time: aiRecipe.time,
          difficulty: aiRecipe.difficulty,
          rating: aiRecipe.rating,
          ingredients: aiRecipe.ingredients,
          fullDesc: aiRecipe.fullDesc,
          source: 'AI' // Differentiator for frontend
        };
        return res.json({ type: 'recipe_list', content: [mappedRecipe] });
      } else {
        const failureMessage = "I couldn't find a recipe for that, and I wasn't able to create one either. Could you try a different search?";
        return res.json({ type: 'text', content: failureMessage });
      }
    } catch (error) {
      return res.status(500).json({ type: 'text', content: 'Sorry, I had trouble searching for recipes right now.' });
    }
  }
  
  // Default to general conversation
  let preferenceText = '';
  if (preferences && preferences.length > 0) {
    preferenceText = ` Remember, the user has the following dietary needs: ${preferences.join(', ')}. Tailor your advice accordingly.`;
  }
  try {
    const systemPrompt = { role: 'system', content: `You are GastroBot, a helpful cooking assistant. Format your answers clearly using Markdown. Be friendly and concise.${preferenceText}` };
    const response = await fetch('https://free.v36.cm/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AI_API_KEY}`},
      body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: [systemPrompt, ...messages], max_tokens: 250, temperature: 0.5 }),
    });
    if (!response.ok) throw new Error('AI service error');
    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || 'I am not sure how to respond.';
    res.json({ type: 'text', content: aiText });
  } catch (error) {
    res.status(500).json({ type: 'text', content: 'Sorry, I am having trouble connecting to my brain.' });
  }
});

module.exports = router; 