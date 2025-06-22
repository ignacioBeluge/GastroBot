const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

require('dotenv').config();

router.post('/', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const prompt = `
    You are a world-class chef and recipe database. 
    A user is searching for a recipe for "${query}".
    Find the best recipe for this dish. If it's a common dish, provide the standard recipe. If it's ambiguous or creative, create a suitable recipe.
    Return the recipe as a JSON object with the following structure:
    {
      "name": "Recipe Name",
      "img": "a URL to a relevant, high-quality image of the dish",
      "time": "estimated time to prepare, e.g., '45 min'",
      "difficulty": "Easy, Medium, or Hard",
      "rating": "a rating out of 5, e.g., 4.7",
      "ingredients": ["1 cup flour", "2 eggs", "1/2 cup milk"],
      "fullDesc": "Step-by-step instructions, separated by newline characters (\\n). Be clear and concise."
    }
    Only return the JSON object, with no other text or explanation before or after it.
  `;

  try {
    const response = await fetch('https://free.v36.cm/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error from AI API:', errorData);
      return res.status(response.status).json({ error: 'Error from AI service during search' });
    }

    const data = await response.json();
    const recipeContent = data.choices[0].message.content;

    // Clean the response to ensure it's valid JSON
    const cleanedJsonString = recipeContent.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const recipeJson = JSON.parse(cleanedJsonString);
      res.json(recipeJson);
    } catch (parseError) {
      console.error('Error parsing AI response JSON:', parseError);
      console.error('Original AI response:', recipeContent);
      res.status(500).json({ error: 'Failed to parse recipe from AI response' });
    }

  } catch (error) {
    console.error('Error connecting to AI service for search:', error);
    res.status(500).json({ error: 'Internal server error during search' });
  }
});

module.exports = router; 