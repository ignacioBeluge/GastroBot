const DANGEROUS_INGREDIENTS = {
  celiac: [
    // More specific gluten-containing ingredients
    'wheat flour', 'all-purpose flour', 'bread flour', 'cake flour', 'rye flour', 'barley flour',
    'semolina', 'couscous', 'bulgur', 'farro', 'spelt', 'kamut', 'triticale',
    'breadcrumbs', 'panko', 'matzo meal', 'graham crackers', 'wheat germ','plain flour',
    // Common gluten-containing processed foods
    'soy sauce', 'teriyaki sauce', 'worcestershire sauce', 'malt vinegar',
    'beer', 'ale', 'lager', 'malt', 'malt extract'
  ],
  'lactose-intolerant': [
    // Dairy products that contain lactose
    'milk', 'whole milk', 'skim milk', 'buttermilk', 'evaporated milk', 'condensed milk',
    'cream', 'heavy cream', 'light cream', 'half-and-half', 'whipping cream',
    'cheese', 'cheddar cheese', 'mozzarella cheese', 'parmesan cheese', 'cream cheese',
    'yogurt', 'greek yogurt', 'sour cream', 'butter', 'margarine',
    'ice cream', 'gelato', 'pudding', 'custard'
  ],
  'vegetarian': ['chicken', 'beef', 'pork', 'lamb', 'fish', 'seafood', 'bacon', 'ham', 'sausage', 'turkey', 'chicken breast', 'chicken thighs', 'ground beef', 'steak', 'pork chops', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster',
    'duck', 'goose', 'venison', 'rabbit', 'quail', 'pheasant', 'game meat']
};

// Safe alternatives that should NOT be filtered
const SAFE_ALTERNATIVES = {
  celiac: [
    'gluten-free', 'gluten free', 'rice flour', 'almond flour', 'coconut flour', 
    'tapioca flour', 'potato flour', 'corn flour', 'quinoa flour', 'buckwheat flour',
    'tamari', 'coconut aminos', 'gluten-free soy sauce', 'gluten-free breadcrumbs'
  ],
  'lactose-intolerant': [
    'almond milk', 'soy milk', 'oat milk', 'coconut milk', 'rice milk', 'hemp milk',
    'lactose-free', 'lactose free', 'dairy-free', 'dairy free', 'vegan cheese',
    'nutritional yeast', 'coconut oil', 'olive oil', 'avocado oil'
  ],
};

const isUnsafe = (recipe, preferences) => {
  if (!preferences || preferences.length === 0) {
    return false;
  }

  const recipeIngredients = recipe.ingredients.join(' ').toLowerCase();
  const recipeName = recipe.name.toLowerCase();
  const recipeInstructions = (recipe.fullDesc || '').toLowerCase();

  for (const preference of preferences) {
    const forbiddenList = DANGEROUS_INGREDIENTS[preference];
    const safeList = SAFE_ALTERNATIVES[preference];
    
    if (forbiddenList) {
      let hasDangerousIngredient = false;
      
      // Check for dangerous ingredients
      for (const forbidden of forbiddenList) {
        if (recipeIngredients.includes(forbidden.toLowerCase())) {
          // Check if there's a safe alternative mentioned
          let hasSafeAlternative = false;
          if (safeList) {
            for (const safe of safeList) {
              if (recipeIngredients.includes(safe.toLowerCase()) || 
                  recipeName.includes(safe.toLowerCase()) ||
                  recipeInstructions.includes(safe.toLowerCase())) {
                hasSafeAlternative = true;
                break;
              }
            }
          }
          
          // Only filter if no safe alternative is found
          if (!hasSafeAlternative) {
            console.log(`Filtering out "${recipe.name}" due to preference "${preference}" and ingredient "${forbidden}"`);
            hasDangerousIngredient = true;
            break;
          }
        }
      }
      
      if (hasDangerousIngredient) {
        return true;
      }
    }
  }

  return false; // No dangerous ingredients found
};

const filterRecipes = (recipes, preferences) => {
  console.log(`Filtering ${recipes.length} recipes with preferences:`, preferences);
  
  if (!preferences || preferences.length === 0) {
    console.log('No preferences - returning all recipes');
    return recipes;
  }
  
  // For weight preferences, don't filter - just return all recipes
  const weightPreferences = preferences.filter(p => p.includes('weight'));
  if (weightPreferences.length > 0 && preferences.length === weightPreferences.length) {
    console.log('Only weight preferences - returning all recipes');
    return recipes;
  }
  
  // Filter out unsafe recipes for dietary restrictions
  const dietaryPreferences = preferences.filter(p => !p.includes('weight'));
  if (dietaryPreferences.length === 0) {
    console.log('No dietary preferences - returning all recipes');
    return recipes;
  }
  
  console.log(`Filtering for dietary preferences:`, dietaryPreferences);
  const filtered = recipes.filter(recipe => !isUnsafe(recipe, dietaryPreferences));
  console.log(`After filtering: ${filtered.length} recipes remain`);
  
  return filtered;
};

module.exports = {
  filterRecipes,
}; 