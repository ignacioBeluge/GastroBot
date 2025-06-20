require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');

const recipes = [
  {
    name: 'Milanesa De Pollo',
    description: 'Milanesa is a thin, breaded and fried meat cutlet, popular in Latin America, especially Argentina.',
    ingredients: [
      { name: 'Chicken', amount: '4', unit: 'pieces' },
      { name: 'Eggs', amount: '2', unit: 'units' },
      { name: 'Garlic', amount: '2', unit: 'cloves' },
      { name: 'Pepper', amount: '1', unit: 'tsp' },
      { name: 'Salt', amount: '1', unit: 'tsp' },
      { name: 'Orange', amount: '1', unit: 'unit' },
      { name: 'Breadcrumbs', amount: '2', unit: 'cups' }
    ],
    instructions: [
      { step: 1, description: 'Preparar la carne: sazone la carne a gusto, condiméntela, y empanada para posteriormente cocinar' },
      { step: 2, description: 'Calentar sartén: caliente el sartén con aceite suficiente.' },
      { step: 3, description: 'Poner milanesas en sartén caliente: fría las milanesas hasta dorar.' },
      { step: 4, description: 'Sacar milanesas: retire y escurra el exceso de aceite.' }
    ],
    image: '/milanesa.png',
    category: 'Dinner',
    prepTime: 20,
    cookTime: 20,
    servings: 4,
    difficulty: 'Media',
    rating: 4.7
  },
  {
    name: 'Cheese Burger',
    description: 'Classic American burger with cheese and vegetables',
    ingredients: [
      { name: 'Ground Beef', amount: '500', unit: 'g' },
      { name: 'Cheese', amount: '4', unit: 'slices' },
      { name: 'Buns', amount: '4', unit: 'units' },
      { name: 'Lettuce', amount: '1', unit: 'head' },
      { name: 'Tomato', amount: '2', unit: 'units' },
      { name: 'Onion', amount: '1', unit: 'unit' }
    ],
    instructions: [
      { step: 1, description: 'Formar las hamburguesas con la carne molida' },
      { step: 2, description: 'Cocinar las hamburguesas en la parrilla o sartén' },
      { step: 3, description: 'Agregar el queso y dejar que se derrita' },
      { step: 4, description: 'Armar la hamburguesa con los vegetales y el pan' }
    ],
    image: '/burger.png',
    category: 'Lunch',
    prepTime: 15,
    cookTime: 10,
    servings: 4,
    difficulty: 'Fácil',
    rating: 4.5
  },
  {
    name: 'Buffalo Pizza',
    description: 'Spicy buffalo chicken pizza with blue cheese',
    ingredients: [
      { name: 'Pizza Dough', amount: '1', unit: 'kg' },
      { name: 'Buffalo Sauce', amount: '1', unit: 'cup' },
      { name: 'Chicken', amount: '300', unit: 'g' },
      { name: 'Blue Cheese', amount: '200', unit: 'g' },
      { name: 'Mozzarella', amount: '200', unit: 'g' }
    ],
    instructions: [
      { step: 1, description: 'Preparar la masa de pizza' },
      { step: 2, description: 'Cocinar el pollo con salsa buffalo' },
      { step: 3, description: 'Armar la pizza con los ingredientes' },
      { step: 4, description: 'Hornear hasta que el queso se derrita' }
    ],
    image: '/pizza.png',
    category: 'Dinner',
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    difficulty: 'Media',
    rating: 4.2
  },
  {
    name: 'Chocotorta',
    description: 'Classic Argentinian dessert with chocolate cookies and dulce de leche',
    ingredients: [
      { name: 'Chocolate Cookies', amount: '500', unit: 'g' },
      { name: 'Dulce de Leche', amount: '400', unit: 'g' },
      { name: 'Cream Cheese', amount: '400', unit: 'g' },
      { name: 'Coffee', amount: '2', unit: 'cups' }
    ],
    instructions: [
      { step: 1, description: 'Preparar el café y dejar enfriar' },
      { step: 2, description: 'Mezclar el dulce de leche con el cream cheese' },
      { step: 3, description: 'Mojar las galletas en el café' },
      { step: 4, description: 'Armar capas alternando galletas y la mezcla' }
    ],
    image: '/chocotorta.png',
    category: 'Dessert',
    prepTime: 15,
    cookTime: 0,
    servings: 8,
    difficulty: 'Fácil',
    rating: 4.8
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Limpiar la colección existente
    await Recipe.deleteMany({});
    console.log('Colección de recetas limpiada');

    // Insertar las nuevas recetas
    await Recipe.insertMany(recipes);
    console.log('Recetas insertadas exitosamente');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

seedDatabase(); 