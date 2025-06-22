const DANGEROUS_INGREDIENTS = {
  celiac: ['wheat', 'flour', 'barley', 'rye', 'gluten', 'bread', 'pasta', 'semolina', 'couscous'],
  'lactose-intolerant': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'lactose', 'casein'],
};

const isUnsafe = (recipe, preferences) => {
  if (!preferences || preferences.length === 0) {
    return false;
  }

  const recipeIngredients = recipe.ingredients.join(' ').toLowerCase();

  for (const preference of preferences) {
    const forbiddenList = DANGEROUS_INGREDIENTS[preference];
    if (forbiddenList) {
      for (const forbidden of forbiddenList) {
        if (recipeIngredients.includes(forbidden)) {
          console.log(`Filtering out "${recipe.name}" due to preference "${preference}" and ingredient "${forbidden}"`);
          return true; // Found a dangerous ingredient
        }
      }
    }
  }

  return false; // No dangerous ingredients found
};

const filterRecipes = (recipes, preferences) => {
  if (!preferences || preferences.length === 0) {
    return recipes;
  }
  return recipes.filter(recipe => !isUnsafe(recipe, preferences));
};

module.exports = {
  filterRecipes,
}; 