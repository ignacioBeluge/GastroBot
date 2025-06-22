const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Cargar variables de entorno
require('dotenv').config();

router.post('/', async (req, res) => {
  const { messages } = req.body;

  if (!messages) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  try {
    const response = await fetch('https://free.v36.cm/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 200,
      }),
    });

    console.log('This is the response from AI API:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from AI API:', errorData);
      return res.status(response.status).json({ error: 'Error from AI service' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error connecting to AI service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 