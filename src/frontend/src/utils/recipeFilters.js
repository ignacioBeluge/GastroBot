// Helper function to extract time in minutes from recipe time string
const extractTimeInMinutes = (timeString) => {
  if (!timeString) return 0;
  
  // Handle different time formats: "30 min", "1 hour", "1h 30m", etc.
  const timeStr = timeString.toLowerCase();
  
  // Extract hours
  const hourMatch = timeStr.match(/(\d+)\s*h/);
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  
  // Extract minutes
  const minuteMatch = timeStr.match(/(\d+)\s*m/);
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
  
  // If no specific format, try to extract just numbers
  if (hours === 0 && minutes === 0) {
    const numberMatch = timeStr.match(/(\d+)/);
    if (numberMatch) {
      // Assume it's minutes if it's a reasonable number, otherwise hours
      const num = parseInt(numberMatch[1]);
      return num <= 300 ? num : num * 60; // If > 300, assume it's hours
    }
  }
  
  return hours * 60 + minutes;
};

// Filter recipes based on time
const filterByTime = (recipe, timeFilter) => {
  if (timeFilter === 'all') return true;
  
  const timeInMinutes = extractTimeInMinutes(recipe.time);
  
  switch (timeFilter) {
    case 'quick':
      return timeInMinutes < 30;
    case 'medium':
      return timeInMinutes >= 30 && timeInMinutes <= 60;
    case 'long':
      return timeInMinutes > 60;
    default:
      return true;
  }
};

// Filter recipes based on rating
const filterByRating = (recipe, ratingFilter) => {
  if (ratingFilter === 'all') return true;
  
  const rating = parseFloat(recipe.rating) || 0;
  
  switch (ratingFilter) {
    case 'high':
      return rating >= 4.5;
    case 'good':
      return rating >= 4.0;
    case 'decent':
      return rating >= 3.5;
    default:
      return true;
  }
};

// Filter recipes based on difficulty
const filterByDifficulty = (recipe, difficultyFilter) => {
  if (difficultyFilter === 'all') return true;
  
  const difficulty = recipe.difficulty?.toLowerCase() || '';
  
  switch (difficultyFilter) {
    case 'easy':
      return difficulty === 'easy';
    case 'medium':
      return difficulty === 'medium';
    case 'hard':
      return difficulty === 'hard';
    default:
      return true;
  }
};

// Main filtering function
export const filterRecipes = (recipes, filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return recipes;
  }
  
  return recipes.filter(recipe => {
    const passesTimeFilter = filterByTime(recipe, filters.time);
    const passesRatingFilter = filterByRating(recipe, filters.rating);
    const passesDifficultyFilter = filterByDifficulty(recipe, filters.difficulty);
    
    return passesTimeFilter && passesRatingFilter && passesDifficultyFilter;
  });
};

export { extractTimeInMinutes }; 