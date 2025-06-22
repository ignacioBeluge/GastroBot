import React, { useState } from 'react';
import './Search.css';

const Search = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (data.meals) {
          const recipesWithDetails = data.meals.map(meal => ({
            ...meal,
            name: meal.strMeal,
            img: meal.strMealThumb,
            difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
            rating: (4 + Math.random()).toFixed(1),
            time: `${20 + Math.floor(Math.random() * 30)}min`,
          }));
          setResults(recipesWithDetails);
        } else {
          setResults([]);
        }
      })
      .catch(err => {
        console.error('Error searching recipes:', err);
        setResults([]);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="search-bg">
      <div className="search-container">
        <div className="search-header">
          <button className="search-back-btn" onClick={onBack}>
            <svg width="28" height="28" viewBox="0 0 22 22">
              <circle cx="11" cy="11" r="11" fill="#f5f5f5" />
              <path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          <span className="search-title">Search Recipes</span>
        </div>
        
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for recipes..."
            className="search-input"
          />
          <button type="submit" className="search-btn">Search</button>
        </form>
        
        {loading && <div className="search-loading">Searching...</div>}
        
        {results.length > 0 && (
          <div className="search-results">
            {results.map((recipe) => (
              <div key={recipe.idMeal} className="search-result-item">
                <img src={recipe.img} alt={recipe.name} className="search-result-image" />
                <div className="search-result-content">
                  <h3 className="search-result-name">{recipe.name}</h3>
                  <div className="search-result-meta">
                    <span className="search-result-time">{recipe.time}</span>
                    <span className="search-result-difficulty">{recipe.difficulty}</span>
                    <span className="search-result-rating">{recipe.rating} ⭐</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search; 