const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');

// Obtener todas las recetas
router.get('/', async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener una receta por ID
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Receta no encontrada' });
    }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener recetas por categoría
router.get('/category/:category', async (req, res) => {
  try {
    const recipes = await Recipe.find({ category: req.params.category });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Buscar recetas
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const recipes = await Recipe.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear una nueva receta
router.post('/', async (req, res) => {
  const recipe = new Recipe(req.body);
  try {
    const newRecipe = await recipe.save();
    res.status(201).json(newRecipe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Actualizar una receta
router.put('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!recipe) {
      return res.status(404).json({ message: 'Receta no encontrada' });
    }
    res.json(recipe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Eliminar una receta
router.delete('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Receta no encontrada' });
    }
    res.json({ message: 'Receta eliminada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recipe details by ID from TheMealDB
router.get('/details/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch recipe details from TheMealDB API
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await response.json();
    
    if (!data.meals || data.meals.length === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    res.json(data.meals[0]);
  } catch (error) {
    console.error('Error fetching recipe details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 