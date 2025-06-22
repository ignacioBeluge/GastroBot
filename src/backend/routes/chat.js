const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Cargar variables de entorno
require('dotenv').config();

const isRecipeQuery = (text) => {
  const lowerText = text.toLowerCase();
  const keywords = [
    'recipe', 'cook', 'make', 'prepare', 'ingredients for', 
    'how to', 'what is in a', 'can you find'
  ];
  return keywords.some(k => lowerText.includes(k));
};

// This function is adapted from your search.js logic
const fetchRecipes = async (query) => {
  const ingredients = query.split(/[, ]+/).map(q => q.trim()).filter(Boolean);
  
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

router.post('/', async (req, res) => {
  const { messages } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  const userMessage = messages[messages.length - 1];
  const userQuery = userMessage.content;

  // Intent #1: Recipe Search
  if (isRecipeQuery(userQuery)) {
    try {
      const recipes = await fetchRecipes(userQuery);
      if (recipes.length > 0) {
        return res.json({ type: 'recipe_list', content: recipes });
      } else {
        // Fallback to AI if no recipes found
        userMessage.content = `Tell me you couldn't find a recipe for "${userQuery}" and ask if I'd like to try something else.`;
      }
    } catch (error) {
       return res.status(500).json({ type: 'text', content: 'Sorry, I had trouble searching for recipes right now.' });
    }
  }
  
  // Intent #2: General Conversation (Default)
  try {
    const systemPrompt = { 
      role: 'system', 
      content: 'You are GastroBot, a helpful cooking assistant. Format your answers clearly using Markdown. Be friendly and concise.' 
    };

    const response = await fetch('https://free.v36.cm/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [systemPrompt, ...messages],
        max_tokens: 250,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error('AI service responded with an error');
    }

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || 'I am not sure how to respond to that.';
    res.json({ type: 'text', content: aiText });

  } catch (error) {
    console.error('Error connecting to AI service:', error);
    res.status(500).json({ type: 'text', content: 'Sorry, I am having trouble connecting to my brain right now.' });
  }
});

module.exports = router; 