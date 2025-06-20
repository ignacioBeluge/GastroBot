const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  ingredients: [{
    name: String,
    amount: String,
    unit: String
  }],
  instructions: [{
    step: Number,
    description: String
  }],
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  prepTime: {
    type: Number,
    required: true
  },
  cookTime: {
    type: Number,
    required: true
  },
  servings: {
    type: Number,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Fácil', 'Media', 'Difícil'],
    required: true
  },
  rating: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Recipe', recipeSchema); 