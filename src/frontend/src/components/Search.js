import React, { useState, useRef, useEffect } from 'react';
import './Search.css';

const Search = ({ onBack, onRecipeSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

    try {
      const response = await fetch('http://localhost:5000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch recipe from AI');
      }

      const recipe = await response.json();
      setResults([recipe]); // The backend returns a single, complete recipe object

    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred during the search. Please try again.');
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
          <span className="search-title">AI Recipe Search</span>
        </div>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="What do you want to cook?"
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
              {results.map((recipe, index) => (
                <div key={index} className="search-recipe-card" onClick={() => handleRecipeClick(recipe)}>
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

          {!loading && results.length === 0 && !error && (
            <div className="search-empty-state">
              <div className="search-empty-icon">🍳</div>
              <h3>Ready to find your next meal?</h3>
              <p>Use the search bar above to ask our AI for any recipe you can imagine!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search; 