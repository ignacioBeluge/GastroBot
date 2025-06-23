import React, { useState, useRef, useEffect } from 'react';
import { getUserPreferences } from '../services/userService';
import './Search.css';

const Search = ({ onBack, onRecipeSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false); // Track if a search has been performed
  const searchInputRef = useRef(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);
    setSearched(true); // Mark that a search has been initiated

    try {
      // Fetch preferences to send with the search
      const preferences = await getUserPreferences();

      const response = await fetch('http://localhost:5000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim(), preferences: preferences }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch recipes');
      }

      const recipes = await response.json();
      setResults(recipes);

    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred during the search. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = (recipe) => {
    onRecipeSelect(recipe, false); // Pass the full recipe object
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
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search for a recipe..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="search-submit-btn" disabled={loading}>
            {loading ? <div className="search-loader" /> : 'Search'}
          </button>
        </form>

        <div className="search-results">
          {error && <div className="search-error">{error}</div>}
          
          {results.length > 0 && (
            <div className="search-results-grid">
              {results.map((recipe) => (
                <div key={recipe.id} className="search-recipe-card" onClick={() => handleRecipeClick(recipe)}>
                  <img src={recipe.img} alt={recipe.name} className="search-recipe-image" />
                  <div className="search-recipe-content">
                    <h3 className="search-recipe-name">{recipe.name}</h3>
                    <div className="search-recipe-meta">
                      <span>{recipe.time}</span>
                      <span>{recipe.difficulty}</span>
                      <span>⭐ {recipe.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && searched && !error && (
            <div className="search-empty-state">
              <div className="search-empty-icon">😕</div>
              <h3>No Recipes Found</h3>
              <p>We couldn't find any recipes for "{query}". Try a different search!</p>
            </div>
          )}

          {!searched && !loading && (
             <div className="search-empty-state">
              <div className="search-empty-icon">🍳</div>
              <h3>What are you craving?</h3>
              <p>Use the search bar above to find your next favorite meal.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search; 