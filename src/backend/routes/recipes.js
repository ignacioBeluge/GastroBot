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

module.exports = router; 