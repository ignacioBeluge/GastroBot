import React, { useState, useEffect } from 'react';
import './Home.css';
import { recipeService } from '../services/recipeService';
import { getCurrentUser, updateUser, logout } from '../services/authService';

// Custom hook for responsive design
function useResponsive() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

const profileMenuList = [
  { icon: '🧑‍💼', label: 'Personal Info', key: 'personal' },
  { icon: '🏠', label: 'Addresses' },
  { icon: '💳', label: 'Payment', key: 'payment' },
  { icon: '❤️', label: 'Favourite', key: 'favorite' },
  { icon: '🔔', label: 'Notifications' },
  { icon: '🕓', label: 'History', key: 'history' },
  { icon: '❓', label: 'FAQs' },
  { icon: '⭐', label: 'User Review' },
  { icon: '🚪', label: 'Sign Out', key: 'signout', logout: true },
];

const ProfilePage = ({ onBack, onMenu, onSignOut }) => {
  const user = getCurrentUser();
  const name = user?.user?.name || '';
  const bio = user?.user?.bio || '';
  return (
    <div className="profile-bg">
      <div className="profile-card">
        <div className="profile-header-row">
          <button className="profile-back-btn" onClick={onBack}>
            <svg width="28" height="28" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#f5f5f5" /><path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
          <span className="profile-title">Profile</span>
        </div>
        <div className="profile-avatar-big" />
        <div className="profile-username">{name}</div>
        <div className="profile-desc">{bio || '¡Agrega una bio desde Editar Perfil!'}</div>
        <div className="profile-menu-list-2">
          {profileMenuList.map(item => (
            <div
              className={`profile-menu-item-2${item.logout ? ' logout' : ''}`}
              key={item.label}
              onClick={item.key === 'signout'
                ? () => { if (onSignOut) onSignOut(); }
                : item.key ? () => onMenu(item.key) : undefined}
            >
              <span className="profile-menu-icon-2">{item.icon}</span>
              <span>{item.label}</span>
              <span className="profile-menu-arrow-2">›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Chatbox = ({ setSelectedRecipe, setShowRecipeDetail, messages: propMessages, setMessages: propSetMessages }) => {
  const [internalMessages, setInternalMessages] = useState([
    { from: 'bot', text: 'Hi! How can I help you today?' }
  ]);
  const messages = propMessages || internalMessages;
  const setMessages = propSetMessages || setInternalMessages;
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipeResults, setRecipeResults] = useState([]); // Para mostrar recetas en el chat
  const fileInputRef = React.useRef();
  const messagesEndRef = React.useRef(null);

  // Detectar si el mensaje es una consulta de receta
  function isRecipeQuery(text) {
    // Si contiene palabras clave de comida o ingredientes, o es una sola palabra (nombre de receta)
    const foodKeywords = ['receta', 'cómo hacer', 'como hacer', 'preparar', 'ingredientes', 'cocinar', 'hacer', 'cómo preparo', 'como preparo'];
    // Si tiene palabras clave o parece un nombre de comida (1-3 palabras, sin signos de pregunta)
    return foodKeywords.some(k => text.toLowerCase().includes(k)) ||
      (/^[a-zA-Z\s]+$/.test(text) && text.trim().split(' ').length <= 3 && !text.includes('?'));
  }
  // Detectar si es una pregunta general (no de receta)
  function isGeneralQuestion(text) {
    // Si termina en '?' o contiene palabras de saludo/pregunta
    const generalWords = ['how are you', 'who are you', 'what can you do', 'hello', 'hi', 'help', 'thanks', 'thank you', 'goodbye', 'bye'];
    const lower = text.toLowerCase();
    return text.trim().endsWith('?') || generalWords.some(w => lower.includes(w));
  }

  async function fetchAIResponse(userMessage) {
    setLoading(true);
    try {
      const res = await fetch('https://free.v36.cm/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-z7NSVDja8nDQgcW7A51cE6549d574008Bd95617cAc89746b',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful cooking assistant.' },
            ...messages.filter(m => m.from !== 'image').map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: userMessage }
          ],
          max_tokens: 200
        })
      });
      const data = await res.json();
      const aiText = data.choices?.[0]?.message?.content || 'Sorry, I could not answer.';
      setMessages(msgs => [...msgs, { from: 'bot', text: aiText }]);
    } catch (e) {
      setMessages(msgs => [...msgs, { from: 'bot', text: 'Error connecting to AI.' }]);
    }
    setLoading(false);
  }

  async function fetchRecipeFromAPI(query) {
    setLoading(true);
    setRecipeResults([]);
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.meals && data.meals.length > 0) {
        setRecipeResults(data.meals.slice(0, 5));
        setMessages(msgs => [...msgs, { from: 'bot', text: `Encontré estas recetas para "${query}":`, recipes: data.meals.slice(0, 5) }]);
      } else {
        setMessages(msgs => [...msgs, { from: 'bot', text: 'No encontré recetas, creando una para ti...' }]);
        fetchAIResponse(`Crea una receta original para: ${query}`);
      }
    } catch (e) {
      setMessages(msgs => [...msgs, { from: 'bot', text: 'Error buscando recetas.' }]);
    }
    setLoading(false);
  }

  const handleSend = e => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { from: 'user', text: input }]);
    if (isGeneralQuestion(input)) {
      fetchAIResponse(input);
    } else if (isRecipeQuery(input)) {
      fetchRecipeFromAPI(input);
    } else {
      fetchAIResponse(input);
    }
    setInput('');
  };

  const handleImage = e => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMessages([...messages, { from: 'user', image: url }]);
      setTimeout(() => {
        setMessages(msgs => [...msgs, { from: 'bot', text: 'Nice image!' }]);
      }, 600);
    }
  };
  const handleVoice = () => {
    setMessages([...messages, { from: 'user', text: '[Voice message]' }]);
    setTimeout(() => {
      setMessages(msgs => [...msgs, { from: 'bot', text: 'Voice received!' }]);
    }, 600);
  };

  // Handler para nuevo chat
  const handleNewChat = () => {
    setMessages([{ from: 'bot', text: 'Hi! How can I help you today?' }]);
  };

  return (
    <div className="chatbox-window">
      <div className="chatbox-header">
        <button onClick={handleNewChat} className="chatbox-new-btn" title="New chat">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="2" style={{ minWidth: 16 }}><path d="M4 17v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" /><rect x="7" y="7" width="6" height="6" rx="1" /><path d="M10 9v2M9 10h2" /></svg>
          <span>New chat</span>
        </button>
        <span className="chatbox-title">GastroBot Chat</span>
      </div>
      <div className="chatbox-body">
        {messages.map((msg, i) => (
          msg.image ? (
            <div key={i} className={msg.from === 'bot' ? 'chat-msg bot' : 'chat-msg user'}>
              <img src={msg.image} alt="upload" className="chat-msg-img" />
            </div>
          ) : msg.recipes ? (
            <div key={i} className="chat-msg bot">
              <div>{msg.text}</div>
              <div className="chat-recipes-list">
                {msg.recipes.map((rec, idx) => (
                  <div key={rec.idMeal} className="chat-recipe-item"
                    onClick={() => {
                      fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${rec.idMeal}`)
                        .then(res => res.json())
                        .then(data => {
                          if (data.meals && data.meals[0]) {
                            const meal = data.meals[0];
                            const ingredients = [];
                            for (let i = 1; i <= 20; i++) {
                              const ing = meal[`strIngredient${i}`];
                              const measure = meal[`strMeasure${i}`];
                              if (ing && ing.trim() && ing.trim().toLowerCase() !== 'null' && ing.trim().toLowerCase() !== 'undefined') {
                                ingredients.push((measure && measure.trim() ? measure.trim() + ' ' : '') + ing.trim());
                              }
                            }
                            setSelectedRecipe({
                              ...meal,
                              name: meal.strMeal,
                              img: meal.strMealThumb,
                              fullDesc: meal.strInstructions,
                              time: meal.strTags || '',
                              ingredients,
                            });
                            setShowRecipeDetail(true);
                          }
                        });
                    }}>
                    <img src={rec.strMealThumb} alt={rec.strMeal} className="chat-recipe-img" />
                    <div className="chat-recipe-name">{rec.strMeal}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div key={i} className={msg.from === 'bot' ? 'chat-msg bot' : 'chat-msg user'}>{msg.text}</div>
          )
        ))}
        {loading && <div className="chat-msg bot">...</div>}
        <div ref={messagesEndRef} />
      </div>
      <form className="chatbox-input" onSubmit={handleSend}>
        <button type="button" className="chatbox-icon-btn" onClick={() => fileInputRef.current.click()} title="Upload image">
          <svg width="22" height="22" viewBox="0 0 22 22" style={{ verticalAlign: 'middle' }}><path d="M4 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="#ff7a00" strokeWidth="2" fill="none" /><rect x="7" y="10" width="8" height="6" rx="1" stroke="#ff7a00" strokeWidth="2" fill="none" /><circle cx="11" cy="13" r="1.5" fill="#ff7a00" /></svg>
        </button>
        <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImage} />
        <button type="button" className="chatbox-icon-btn" onClick={handleVoice} title="Send voice">
          <svg width="22" height="22" viewBox="0 0 22 22" style={{ verticalAlign: 'middle' }}><rect x="8" y="4" width="6" height="10" rx="3" stroke="#ff7a00" strokeWidth="2" fill="none" /><path d="M11 18v-2" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" /><path d="M7 14a4 4 0 0 0 8 0" stroke="#ff7a00" strokeWidth="2" fill="none" /></svg>
        </button>
        <input className="chatbox-input-field" value={input} onChange={e => setInput(e.target.value)} placeholder="Type your message..." />
        <button className="chatbox-send" type="submit">➤</button>
      </form>
    </div>
  );
};

const SPOONACULAR_API_KEY = '82941f8714764fcc8d473b45e9cfaa9b';
async function fetchSpoonacularTime(mealName) {
  try {
    const res = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(mealName)}&number=1&apiKey=${SPOONACULAR_API_KEY}`);
    const data = await res.json();
    if (data.results && data.results[0] && data.results[0].id) {
      const id = data.results[0].id;
      const res2 = await fetch(`https://api.spoonacular.com/recipes/${id}/information?apiKey=${SPOONACULAR_API_KEY}`);
      const info = await res2.json();
      if (info.readyInMinutes) return info.readyInMinutes + ' min';
    }
  } catch (e) { }
  return '30 min';
}

const Search = ({ onBack }) => {
  const [popular, setPopular] = React.useState([]);
  const [showRecipeDetail, setShowRecipeDetail] = React.useState(false);
  const [selectedRecipe, setSelectedRecipe] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [recent, setRecent] = React.useState(() => JSON.parse(localStorage.getItem('recentSearches') || '[]'));
  
  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const meals = await fetchRandomMeals(5);
        const mealsWithTime = await Promise.all(meals.map(async meal => {
          const realTime = await fetchSpoonacularTime(meal.strMeal);
          return { ...meal, realTime };
        }));
        setPopular(mealsWithTime);
      } catch (error) {
        console.error('Error fetching meals:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(search)}`)
      .then(res => res.json())
      .then(data => {
        setPopular(data.meals ? data.meals.slice(0, 5) : []);
      })
      .catch(error => {
        console.error('Error searching recipes:', error);
      })
      .finally(() => {
        setLoading(false);
      });
    
    // Actualizar recientes
    let recents = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    recents = recents.filter(w => w.toLowerCase() !== search.trim().toLowerCase());
    recents.unshift(search.trim());
    if (recents.length > 5) recents = recents.slice(0, 5);
    setRecent(recents);
    localStorage.setItem('recentSearches', JSON.stringify(recents));
  };
  const topPhrases = [
    'Top 1 of The Day',
    'Top 2 of The Day',
    'Top 3 of The Day',
    'The most chosen one',
    'Trending now'
  ];
  if (showRecipeDetail && selectedRecipe) {
    return <RecipeDetail recipe={selectedRecipe} onBack={() => setShowRecipeDetail(false)} />;
  }
  return (
    <div className="search-bg">
      <div className="search-card" style={{ maxHeight: 540, minHeight: 540, display: 'flex', flexDirection: 'column' }}>
        <div className="search-header-row" style={{ flex: '0 0 auto' }}>
          <button className="search-back-btn" onClick={onBack}>
            <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#f5f5f5" /><path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
          <span className="search-title">Search</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', marginBottom: 0, scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="search-scroll-invisible">
          <style>{`.search-scroll-invisible::-webkit-scrollbar { display: none; }`}</style>
          <form className="search-input-row" onSubmit={handleSearch}>
            <svg width="20" height="20" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.5-3.5" /></svg>
            <input className="search-input" placeholder="e.g. pizza" value={search} onChange={e => setSearch(e.target.value)} />
            <button className="search-input-btn" type="submit"><svg width="20" height="20" fill="#eee" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg></button>
          </form>
          {/* Palabras recientemente buscadas */}
          {recent.length > 0 && (
            <div className="search-keywords-row" style={{ marginBottom: 8 }}>
              {recent.map((word, i) => (
                <span className="search-keyword" key={word + i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span onClick={() => { setSearch(word); setTimeout(() => { document.querySelector('.search-input').focus(); }, 0); }} style={{ cursor: 'pointer' }}>{word}</span>
                  <span
                    style={{ color: '#ff7a00', fontWeight: 'bold', cursor: 'pointer', marginLeft: 2, fontSize: 15 }}
                    title="Remove"
                    onClick={e => {
                      e.stopPropagation();
                      const newRecents = recent.filter((w, idx) => idx !== i);
                      setRecent(newRecents);
                      localStorage.setItem('recentSearches', JSON.stringify(newRecents));
                    }}
                  >
                    ×
                  </span>
                </span>
              ))}
            </div>
          )}
          <div className="home-section-title" style={{ fontSize: '1.18rem', fontWeight: 700, color: '#222', margin: '18px 0 10px 0', textAlign: 'left' }}>
            {search.trim() ? 'Recipes found' : 'Popular Recipes'}
          </div>
          <div className="search-popular-list-vertical">
            {loading ? (
              <div style={{ color: '#aaa', textAlign: 'center', width: '100%' }}>Loading...</div>
            ) : popular.length === 0 ? (
              <div style={{ color: '#aaa', textAlign: 'center', width: '100%' }}>No recipes found.</div>
            ) : (
              popular.map((meal, idx) => (
                <div key={meal.idMeal} className="search-popular-vertical-item" style={{ display: 'flex', alignItems: 'center', background: '#fff7f0', borderRadius: 14, marginBottom: 14, padding: 10, boxShadow: '0 2px 8px rgba(255,122,0,0.07)', cursor: 'pointer' }}
                  onClick={() => {
                    if (meal.idMeal) {
                      fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`)
                        .then(res => res.json())
                        .then(data => {
                          if (data.meals && data.meals[0]) {
                            const mealDetail = data.meals[0];
                            const ingredients = [];
                            for (let i = 1; i <= 20; i++) {
                              const ing = mealDetail[`strIngredient${i}`];
                              const measure = mealDetail[`strMeasure${i}`];
                              if (ing && ing.trim() && ing.trim().toLowerCase() !== 'null' && ing.trim().toLowerCase() !== 'undefined') {
                                ingredients.push((measure && measure.trim() ? measure.trim() + ' ' : '') + ing.trim());
                              }
                            }
                            setSelectedRecipe({
                              ...mealDetail,
                              name: mealDetail.strMeal,
                              img: mealDetail.strMealThumb,
                              fullDesc: mealDetail.strInstructions,
                              time: mealDetail.strTags || '',
                              ingredients,
                            });
                            setShowRecipeDetail(true);
                          }
                        });
                    }
                  }}
                >
                  <img src={meal.strMealThumb} alt={meal.strMeal} style={{ width: 54, height: 54, borderRadius: 10, objectFit: 'cover', marginRight: 14 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.08rem', color: '#222' }}>{meal.strMeal}</div>
                    {/* Frase destacada */}
                    <div style={{ color: '#ff7a00', fontSize: '0.97rem', marginTop: 2, fontWeight: 500 }}>
                      {topPhrases[idx % topPhrases.length]}
                    </div>
                    {/* Datos extra: rating, level, time */}
                    <div style={{ color: '#ff7a00', fontSize: '0.97rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: '1.1em' }}>⭐</span> {meal.rating || getRandomRating()}
                      </span>
                      <span>{meal.level || getRandomDifficulty()}</span>
                      <span><span role="img" aria-label="time">⏱️</span> {meal.realTime || meal.time || getRandomTime()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const categoriesData = [
  { name: 'Preparation Time', img: process.env.PUBLIC_URL + '/preparation.png' },
  { name: 'Meal Type', img: process.env.PUBLIC_URL + '/mealtype.png' },
  { name: 'Cuisine', img: process.env.PUBLIC_URL + '/cuisine.png' },
  { name: 'Main Ingredient', img: process.env.PUBLIC_URL + '/mainingredient.png' },
  { name: 'Cooking Method', img: process.env.PUBLIC_URL + '/cooking.png' },
  { name: 'Dietary Preference', img: process.env.PUBLIC_URL + '/dietary.png' },
  { name: 'Difficulty Level', img: process.env.PUBLIC_URL + '/difficulty.png' },
  { name: 'Nutrition Goal', img: process.env.PUBLIC_URL + '/nutrition.png' },
];
const mealTypes = [
  { name: 'Breakfast', img: process.env.PUBLIC_URL + '/breakfast.png' },
  { name: 'Lunch', img: process.env.PUBLIC_URL + '/lunch.png' },
  { name: 'Dinner', img: process.env.PUBLIC_URL + '/dinner.png' },
  { name: 'Snacks', img: process.env.PUBLIC_URL + '/snacks.png' },
  { name: 'Dessert', img: process.env.PUBLIC_URL + '/dessert.png' },
  { name: 'Drinks', img: process.env.PUBLIC_URL + '/drinks.png' },
  { name: 'Brunch', img: process.env.PUBLIC_URL + '/brunch.png' },
  { name: 'Side Dishes', img: process.env.PUBLIC_URL + '/sidedish.png' },
];
const dinnerRecipes = [
  { name: 'Locro', img: process.env.PUBLIC_URL + '/locro.png', rating: 4.7 },
  { name: 'Milanesa', img: process.env.PUBLIC_URL + '/milanesa.png', rating: 4.7 },
  { name: 'Lasagna', img: process.env.PUBLIC_URL + '/lasagna.png', rating: 3.9 },
  { name: 'Risotto', img: process.env.PUBLIC_URL + '/risotto.png', rating: 3.7 },
  { name: 'Beef', img: process.env.PUBLIC_URL + '/beef.png', rating: 4.4 },
  { name: 'Empanadas', img: process.env.PUBLIC_URL + '/empanadas.png', rating: 3.5 },
  { name: 'Fried rice', img: process.env.PUBLIC_URL + '/friedrice.png', rating: 2.5 },
  { name: 'Curry', img: process.env.PUBLIC_URL + '/curry.png', rating: 4.0 },
];

const Categories = ({ onBack, onCategory }) => {
  const [categoriesApi, setCategoriesApi] = useState([]);
  useEffect(() => {
    fetch('https://www.themealdb.com/api/json/v1/1/categories.php')
      .then(res => res.json())
      .then(data => {
        if (data.categories) setCategoriesApi(data.categories);
      });
  }, []);
  return (
    <div className="search-bg">
      <div className="search-card" style={{ maxHeight: 540, minHeight: 540, display: 'flex', flexDirection: 'column' }}>
        <div className="search-header-row" style={{ flex: '0 0 auto' }}>
          <button className="search-back-btn" onClick={onBack}>
            <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#f5f5f5" /><path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
          <span className="search-title">CATEGORIES</span>
          <button className="search-input-btn"><svg width="20" height="20" fill="#222" viewBox="0 0 20 20"><circle cx="10" cy="10" r="2" /><circle cx="10" cy="4" r="2" /><circle cx="10" cy="16" r="2" /></svg></button>
        </div>
        <div className="categories-grid categories-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', marginBottom: 0 }}>
          {categoriesApi.length === 0 ? (
            <span style={{ color: '#aaa' }}>Loading...</span>
          ) : (
            categoriesApi.map(cat => (
              <div className="categories-item" key={cat.idCategory} onClick={() => onCategory(cat.strCategory)}>
                <img src={cat.strCategoryThumb} alt={cat.strCategory} />
                <span>{cat.strCategory}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const MealType = ({ onBack, onSelect }) => (
  <div className="search-bg">
    <div className="search-card">
      <div className="search-header-row">
        <button className="search-back-btn" onClick={onBack}>
          <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#f5f5f5" /><path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
        </button>
        <span className="search-title"><span className="mealtype-btn">MEAL TYPE <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 4l3 3 3-3" stroke="#ff7a00" strokeWidth="1.5" fill="none" /></svg></span></span>
        <button className="search-input-btn"><svg width="20" height="20" fill="#222" viewBox="0 0 20 20"><circle cx="10" cy="10" r="2" /><circle cx="10" cy="4" r="2" /><circle cx="10" cy="16" r="2" /></svg></button>
      </div>
      <div className="categories-grid">
        {mealTypes.map((cat, i) => (
          <div className="categories-item" key={cat.name} onClick={cat.name === 'Dinner' ? onSelect : undefined}>
            <img src={cat.img} alt={cat.name} />
            <span>{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MealTypeList = ({ onBack }) => (
  <div className="search-bg">
    <div className="search-card">
      <div className="search-header-row">
        <button className="search-back-btn" onClick={onBack}>
          <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#f5f5f5" /><path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
        </button>
        <span className="search-title"><span className="mealtype-btn">DINNER <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 4l3 3 3-3" stroke="#ff7a00" strokeWidth="1.5" fill="none" /></svg></span></span>
        <button className="search-input-btn"><svg width="20" height="20" fill="#222" viewBox="0 0 20 20"><circle cx="10" cy="10" r="2" /><circle cx="10" cy="4" r="2" /><circle cx="10" cy="16" r="2" /></svg></button>
      </div>
      <div className="search-section-title">Suggested Recipes</div>
      <div className="mealtype-list">
        {dinnerRecipes.map(r => (
          <div className="mealtype-list-item" key={r.name}>
            <img src={r.img} alt={r.name} />
            <span>{r.name}</span>
            <span className="search-recipe-rating">⭐ {r.rating}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const milanesaData = {
  name: 'Milanesa De Pollo',
  img: process.env.PUBLIC_URL + '/milanesa.png',
  rating: 4.7,
  level: 'Middle level',
  time: '40 min',
  desc: 'Milanesa is a thin, breaded and fried meat cutlet, popular in Latin America, especially Argentina.',
  ingredients: [
    { icon: '🍗', name: 'Chicken' },
    { icon: '🥚', name: 'Eggs' },
    { icon: '🧄', name: 'Garlic' },
    { icon: '🌶️', name: 'Pepper' },
    { icon: '🧂', name: 'Salt' },
    { icon: '🍊', name: 'Orange' },
    { icon: '🍞', name: 'Breadcrumbs' },
  ],
  steps: [
    { img: process.env.PUBLIC_URL + '/milanesa.png', title: 'Preparar la carne', desc: 'sazone la carne a gusto, condiméntela, y empanada para posteriormente cocinar' },
    { img: process.env.PUBLIC_URL + '/milanesa.png', title: 'Calentar sartén', desc: 'caliente el sartén con aceite suficiente.' },
    { img: process.env.PUBLIC_URL + '/milanesa.png', title: 'Poner milanesas en sartén caliente', desc: 'fría las milanesas hasta dorar.' },
    { img: process.env.PUBLIC_URL + '/milanesa.png', title: 'Sacar milanesas', desc: 'retire y escurra el exceso de aceite.' },
  ]
};

const splitSteps = (instructions) => {
  if (!instructions) return [];
  // Separar por punto, salto de línea y también por ";" para pasos más pequeños
  return instructions.split(/[.\n;]/).map(s => s.trim()).filter(Boolean);
};

const getFavorites = () => JSON.parse(localStorage.getItem('favorites') || '[]');
const setFavorites = favs => localStorage.setItem('favorites', JSON.stringify(favs));
const getHistory = () => JSON.parse(localStorage.getItem('history') || '[]');
const setHistory = hist => localStorage.setItem('history', JSON.stringify(hist));

const RecipeDetail = ({ recipe, onBack }) => {
  const [isFav, setIsFav] = useState(false);
  const [fromFavorite, setFromFavorite] = useState(false);
  useEffect(() => {
    // Guardar en historial al entrar
    let hist = getHistory();
    if (!hist.find(r => r.idMeal === recipe.idMeal)) {
      hist.unshift({ ...recipe, idMeal: recipe.idMeal || recipe.id });
      if (hist.length > 50) hist = hist.slice(0, 50); // Limitar tamaño
      setHistory(hist);
    }
    // Verificar si es favorito
    const favs = getFavorites();
    setIsFav(!!favs.find(r => r.idMeal === recipe.idMeal));
  }, [recipe]);
  const toggleFav = () => {
    let favs = getFavorites();
    if (isFav) {
      favs = favs.filter(r => r.idMeal !== recipe.idMeal);
    } else {
      favs.unshift({
        ...recipe,
        idMeal: recipe.idMeal || recipe.id,
        rating: recipe.rating,
        level: recipe.level,
        time: recipe.time,
        realTime: recipe.realTime,
      });
    }
    setFavorites(favs);
    setIsFav(!isFav);
  };
  // Mapear ingredientes a string seguro
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map(ing => {
        if (typeof ing === 'string') return ing;
        if (ing && typeof ing === 'object' && ing.name) {
          return `${ing.amount ? ing.amount + ' ' : ''}${ing.unit ? ing.unit + ' ' : ''}${ing.name}`;
        }
        return '';
      }).filter(Boolean)
    : [];
  const steps = splitSteps(recipe.fullDesc);
  
  return (
    <div className="search-bg">
      <div className="search-card food-details-card" style={{ maxHeight: '90vh', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="food-details-img-wrap" style={{ flex: '0 0 auto' }}>
          <img src={recipe.img} alt={recipe.name} className="food-details-img" />
          <button className="search-back-btn food-details-back" onClick={onBack}>
            <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#f5f5f5" /><path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
          <button onClick={toggleFav} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', cursor: 'pointer', fontSize: 26 }} title={isFav ? 'Remove from favorites' : 'Add to favorites'}>
            <span style={{ color: isFav ? '#ff7a00' : '#ccc', textShadow: '0 1px 4px #fff' }}>{isFav ? '❤️' : '🤍'}</span>
          </button>
        </div>
        <div className="food-details-title" style={{ flex: '0 0 auto' }}>{recipe.name}</div>
        <div className="food-details-meta" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', marginBottom: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span role="img" aria-label="star">⭐</span> {recipe.rating}</span>
          <span>{recipe.level}</span>
          <span role="img" aria-label="time">⏱️</span> <span style={{ color: '#ff7a00', marginLeft: 4 }}>{recipe.time}</span>
        </div>
        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', marginTop: 8, scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="food-details-scroll-invisible">
          <style>{`.food-details-scroll-invisible::-webkit-scrollbar { display: none; }`}</style>
          <div className="food-details-ing-title">INGREDIENTS</div>
          <ul className="food-details-ings" style={{ flexWrap: 'wrap', justifyContent: 'flex-start', listStyle: 'disc', paddingLeft: 18 }}>
            {ingredients.length === 0 && <li style={{ color: '#aaa' }}>No ingredients found.</li>}
            {ingredients.map((ing, idx) => (
              <li className="food-details-ing" key={idx} style={{ background: 'none', color: '#ff7a00', fontWeight: 500, fontSize: '1rem', marginBottom: 2 }}>{ing}</li>
            ))}
          </ul>
          
          {/* Recipe Steps Section */}
          <div className="food-details-steps-title" style={{ marginTop: '24px', marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700, color: '#ff7a00', textAlign: 'center' }}>
            RECIPE STEPS
          </div>
          <div className="food-details-steps-container">
            {steps.map((step, idx) => (
              <div key={idx} className="food-details-step-item" style={{ 
                background: '#fff3e6', 
                borderRadius: 12, 
                padding: '16px 20px', 
                margin: '12px 0', 
                color: '#222', 
                fontSize: '1.05rem', 
                fontWeight: 500,
                border: '2px solid #ff7a00',
                position: 'relative'
              }}>
                <div className="step-number" style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '16px',
                  background: '#ff7a00',
                  color: 'white',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}>
                  {idx + 1}
                </div>
                <div style={{ marginTop: '8px' }}>
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const recommendedList = [
  {
    name: 'Milanesa De Pollo',
    desc: 'Spicy Savory Fried Meat, Cheese, Vegetables',
    rating: 4.7,
    time: 'Middle level',
    cook: '40min',
    img: process.env.PUBLIC_URL + '/milanesa.png',
    data: milanesaData,
  },
  {
    name: 'Cheese Burger',
    desc: 'Top 1 Of The Day',
    rating: 4.5,
    time: 'Easy',
    cook: '25min',
    img: process.env.PUBLIC_URL + '/burger.png',
    data: milanesaData,
  },
  {
    name: 'Buffalo Pizza',
    desc: 'Top 2 Of The Day',
    rating: 4.2,
    time: 'Medium',
    cook: '30min',
    img: process.env.PUBLIC_URL + '/pizza.png',
    data: milanesaData,
  },
  {
    name: 'Chocotorta',
    desc: 'Classic Argentinian Dessert',
    rating: 4.8,
    time: 'Easy',
    cook: '20min',
    img: process.env.PUBLIC_URL + '/chocotorta.png',
    data: milanesaData,
  },
];

const Favorite = ({ onBack, setSelectedRecipe, setShowRecipeDetail, setPage, setFromFavorite }) => {
  const [favs, setFavs] = useState(getFavorites());
  const removeFav = id => {
    const newFavs = favs.filter(r => r.idMeal !== id);
    setFavs(newFavs);
    setFavorites(newFavs);
  };
  const clearFavs = () => {
    setFavs([]);
    setFavorites([]);
  };
  return (
    <div className="favhis-bg">
      <div className="favhis-card">
        <div className="favhis-header-row">
          <button className="favhis-back-btn" onClick={onBack}>
            <svg width="28" height="28" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#f5f5f5" /><path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
          <span className="favhis-title">Favorite</span>
          <button onClick={clearFavs} style={{ background: 'none', border: 'none', color: '#ff7a00', fontSize: 18, marginLeft: 'auto', cursor: 'pointer' }} title="Clear all favorites">🗑️</button>
        </div>
        <div className="favhis-list">
          {favs.length === 0 ? <div style={{ color: '#aaa', textAlign: 'center', width: '100%' }}>No favorites yet.</div> :
            favs.map(rec => {
              const isFav = true; // Siempre es favorito si está en la lista
              return (
                <div className="favhis-item" key={rec.idMeal} style={{ position: 'relative', background: '#fff7f0', borderRadius: 16, boxShadow: '0 2px 8px rgba(255,122,0,0.07)', padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => {
                    if (rec.idMeal) {
                      fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${rec.idMeal}`)
                        .then(res => res.json())
                        .then(data => {
                          if (data.meals && data.meals[0]) {
                            const meal = data.meals[0];
                            const ingredients = [];
                            for (let i = 1; i <= 20; i++) {
                              const ing = meal[`strIngredient${i}`];
                              const measure = meal[`strMeasure${i}`];
                              if (ing && ing.trim() && ing.trim().toLowerCase() !== 'null' && ing.trim().toLowerCase() !== 'undefined') {
                                ingredients.push((measure && measure.trim() ? measure.trim() + ' ' : '') + ing.trim());
                              }
                            }
                            setSelectedRecipe({
                              ...meal,
                              name: meal.strMeal,
                              img: meal.strMealThumb,
                              fullDesc: meal.strInstructions,
                              time: rec.time || meal.strTags || '',
                              rating: rec.rating,
                              level: rec.level,
                              ingredients,
                            });
                            setPage('home');
                            setFromFavorite(true);
                            setShowRecipeDetail(true);
                          }
                        });
                    } else {
                      setSelectedRecipe(rec);
                      setPage('home');
                      setFromFavorite(true);
                      setShowRecipeDetail(true);
                    }
                  }}
                >
                  <img src={rec.img || rec.strMealThumb} alt={rec.name || rec.strMeal} className="favhis-img" />
                  <div className="favhis-info" style={{ flex: 1 }}>
                    <div className="favhis-name" style={{ fontWeight: 700, fontSize: '1.08rem', marginBottom: 2 }}>{rec.name || rec.strMeal}</div>
                    <div className="favhis-desc" style={{ color: '#888', fontSize: '0.97rem' }}>{rec.desc || rec.strInstructions?.slice(0, 60) || ''}</div>
                    <div className="home-recommend-meta" style={{ fontSize: '0.95rem', color: '#ff7a00', marginTop: 2, display: 'flex', gap: 10 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: '1.1em' }}>⭐</span> {rec.rating}
                      </span>
                      <span>{rec.level}</span>
                      {rec.realTime ? (
                        <span><span role="img" aria-label="time">⏱️</span> {rec.realTime}</span>
                      ) : (
                        <span>{rec.time}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeFav(rec.idMeal); }} style={{ background: 'none', border: 'none', color: isFav ? '#ff7a00' : '#ccc', fontSize: 22, cursor: 'pointer', marginLeft: 8 }} title={isFav ? 'Remove from favorites' : 'Add to favorites'}>
                    <span>{isFav ? '❤️' : '🤍'}</span>
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

const History = ({ onBack, setSelectedRecipe, setShowRecipeDetail, setPage, setFromHistory }) => {
  const [hist, setHist] = useState(getHistory());
  const removeHist = id => {
    const newHist = hist.filter(r => r.idMeal !== id);
    setHist(newHist);
    setHistory(newHist);
  };
  const clearHist = () => {
    setHist([]);
    setHistory([]);
  };
  return (
    <div className="favhis-bg">
      <div className="favhis-card">
        <div className="favhis-header-row">
          <button className="favhis-back-btn" onClick={onBack}>
            <svg width="28" height="28" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#f5f5f5" /><path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
          <span className="favhis-title">History</span>
          <button onClick={clearHist} style={{ background: 'none', border: 'none', color: '#ff7a00', fontSize: 18, marginLeft: 'auto', cursor: 'pointer' }} title="Clear all history">🗑️</button>
        </div>
        <div className="favhis-list">
          {hist.length === 0 ? <div style={{ color: '#aaa', textAlign: 'center', width: '100%' }}>No history yet.</div> :
            hist.map(rec => (
              <div className="favhis-item" key={rec.idMeal} style={{ position: 'relative', background: '#fff7f0', borderRadius: 16, boxShadow: '0 2px 8px rgba(255,122,0,0.07)', padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => {
                  if (rec.idMeal) {
                    fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${rec.idMeal}`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.meals && data.meals[0]) {
                          const meal = data.meals[0];
                          const ingredients = [];
                          for (let i = 1; i <= 20; i++) {
                            const ing = meal[`strIngredient${i}`];
                            const measure = meal[`strMeasure${i}`];
                            if (ing && ing.trim() && ing.trim().toLowerCase() !== 'null' && ing.trim().toLowerCase() !== 'undefined') {
                              ingredients.push((measure && measure.trim() ? measure.trim() + ' ' : '') + ing.trim());
                            }
                          }
                          setSelectedRecipe({
                            ...meal,
                            name: meal.strMeal,
                            img: meal.strMealThumb,
                            fullDesc: meal.strInstructions,
                            time: meal.strTags || '',
                            ingredients,
                          });
                          setPage('home');
                          setFromHistory(true);
                          setShowRecipeDetail(true);
                        }
                      });
                  } else {
                    setSelectedRecipe(rec);
                    setPage('home');
                    setFromHistory(true);
                    setShowRecipeDetail(true);
                  }
                }}
              >
                <img src={rec.img || rec.strMealThumb} alt={rec.name || rec.strMeal} className="favhis-img" />
                <div className="favhis-info" style={{ flex: 1 }}>
                  <div className="favhis-name" style={{ fontWeight: 700, fontSize: '1.08rem', marginBottom: 2 }}>{rec.name || rec.strMeal}</div>
                  <div className="favhis-desc" style={{ color: '#888', fontSize: '0.97rem' }}>{rec.desc || rec.strInstructions?.slice(0, 60) || ''}</div>
                  {rec.realTime && (
                    <div style={{ color: '#ff7a00', fontSize: '0.97rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span role="img" aria-label="time">⏱️</span> {rec.realTime}
                    </div>
                  )}
                </div>
                <button onClick={e => { e.stopPropagation(); removeHist(rec.idMeal); }} style={{ background: 'none', border: 'none', color: '#ff7a00', fontSize: 22, cursor: 'pointer', marginLeft: 8 }} title="Remove from history">🗑️</button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const PersonalInfo = ({ onBack, onEdit }) => {
  const user = getCurrentUser();
  return (
    <div className="profile-bg">
      <div className="profile-card">
        <div className="profile-header-row">
          <button className="profile-back-btn" onClick={onBack}>
            <svg width="28" height="28" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#f5f5f5" /><path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
          <span className="profile-title">Personal Info</span>
          <button className="profile-edit-btn" style={{ position: 'absolute', right: 24, top: 18 }} onClick={onEdit}>EDIT</button>
        </div>
        <div className="profile-avatar-big" />
        <div className="profile-username">{user?.user?.name || 'Usuario'}</div>
        <div className="profile-desc">¡Bienvenido a GastroBot!</div>
        <div className="profile-info-list" style={{ marginTop: 18 }}>
          <div className="profile-info-item">
            <span className="profile-info-icon">👤</span>
            <div>
              <div className="profile-info-label">FULL NAME</div>
              <div className="profile-info-value">{user?.user?.name || 'Usuario'}</div>
            </div>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-icon">📧</span>
            <div>
              <div className="profile-info-label">EMAIL</div>
              <div className="profile-info-value">{user?.user?.email || '-'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditProfile = ({ onBack }) => {
  const user = getCurrentUser();
  const [name, setName] = React.useState(user?.user?.name || '');
  const [bio, setBio] = React.useState(user?.user?.bio || '');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await updateUser(user.user.id, { name, bio });
      setSuccess('¡Perfil actualizado correctamente!');
      setTimeout(() => {
        setSuccess('');
        onBack();
      }, 1800);
    } catch (err) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-bg">
      <div className="profile-card">
        <div className="profile-header-row">
          <button className="profile-back-btn" onClick={onBack}>
            <svg width="28" height="28" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#f5f5f5" /><path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
          <span className="profile-title">Edit Profile</span>
        </div>
        <div className="profile-avatar-big" style={{ marginTop: 24, position: 'relative' }}>
          <span className="profile-avatar-edit" style={{ position: 'absolute', right: -10, bottom: -10, background: '#fff', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 2 }}>
            <svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="#ff7a00" /><path d="M9 19l7.5-7.5a1 1 0 0 1 1.4 0l1.1 1.1a1 1 0 0 1 0 1.4L11.5 21H9v-2z" fill="#fff" /></svg>
          </span>
        </div>
        <form className="profile-edit-form" onSubmit={handleSubmit}>
          <label>FULL NAME
            <input type="text" value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
          </label>
          <label>EMAIL
            <input type="email" value={user?.user?.email || ''} disabled readOnly />
          </label>
          <label>BIO
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} disabled={loading} />
          </label>
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          {success && <div style={{ color: 'green', marginBottom: 8, fontWeight: 'bold', fontSize: '1.05rem', background: '#e6ffe6', borderRadius: 8, padding: '8px 0', textAlign: 'center' }}>{success}</div>}
          <button className="profile-save-btn" type="submit" disabled={loading}>{loading ? 'Guardando...' : 'SAVE'}</button>
        </form>
      </div>
    </div>
  );
};

const getRandomDifficulty = () => {
  const difficulties = ['Easy', 'Medium', 'Hard'];
  return difficulties[Math.floor(Math.random() * difficulties.length)];
};

const getRandomRating = () => (4 + Math.random()).toFixed(1);

const getRandomTime = () => `${20 + Math.floor(Math.random() * 30)}min`;

const CategoryRecipes = ({ category, onBack, onShowRecipe }) => {
  const [meals, setMeals] = useState([]);
  const storageKey = `categoryMeals_${category}`;
  useEffect(() => {
    // Intenta cargar desde localStorage
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setMeals(JSON.parse(stored));
    } else {
      fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`)
        .then(res => res.json())
        .then(data => {
          if (data.meals) {
            const levels = ['Easy', 'Medium', 'Hard'];
            const mealsWithMeta = data.meals.map(meal => ({
              ...meal,
              rating: (4 + Math.random()).toFixed(1),
              level: levels[Math.floor(Math.random() * levels.length)],
              time: `${20 + Math.floor(Math.random() * 30)}min`,
            }));
            setMeals(mealsWithMeta);
            localStorage.setItem(storageKey, JSON.stringify(mealsWithMeta));
          }
        });
    }
  }, [category]);
  return (
    <div className="category-bg">
      <div className="category-card">
        <div className="category-header-row">
          <button className="category-back-btn" onClick={onBack}>
            <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#f5f5f5" /><path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
          <span className="category-title">{category}</span>
        </div>
        <div className="category-list">
          {meals.length === 0 ? (
            <div className="category-empty" style={{ color: '#aaa', textAlign: 'center', width: '100%', padding: '2rem' }}>No recipes found.</div>
          ) : (
            meals.map(meal => {
              const favs = getFavorites();
              const isFav = !!favs.find(r => r.idMeal === meal.idMeal);
              const toggleFav = e => {
                e.stopPropagation();
                let favs = getFavorites();
                if (isFav) {
                  favs = favs.filter(r => r.idMeal !== meal.idMeal);
                } else {
                  favs.unshift({ ...meal, idMeal: meal.idMeal });
                }
                setFavorites(favs);
                setMeals(m => {
                  localStorage.setItem(storageKey, JSON.stringify(m));
                  return [...m];
                });
              };
              return (
                <div className="category-item" key={meal.idMeal} onClick={() => {
                  fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`)
                    .then(res => res.json())
                    .then(data => {
                      if (data.meals && data.meals[0]) {
                        const mealDetail = data.meals[0];
                        const ingredients = [];
                        for (let i = 1; i <= 20; i++) {
                          const ing = mealDetail[`strIngredient${i}`];
                          const measure = mealDetail[`strMeasure${i}`];
                          if (ing && ing.trim() && ing.trim().toLowerCase() !== 'null' && ing.trim().toLowerCase() !== 'undefined') {
                            ingredients.push((measure && measure.trim() ? measure.trim() + ' ' : '') + ing.trim());
                          }
                        }
                        onShowRecipe({
                          ...mealDetail,
                          name: mealDetail.strMeal,
                          img: mealDetail.strMealThumb,
                          fullDesc: mealDetail.strInstructions,
                          time: meal.time,
                          rating: meal.rating,
                          level: meal.level,
                          ingredients,
                        });
                      }
                    });
                }}>
                  <img src={meal.strMealThumb} alt={meal.strMeal} className="category-item-img" />
                  <div className="category-item-info">
                    <div className="category-item-title">{meal.strMeal}</div>
                    <div className="category-item-meta">
                      <span>⭐ {meal.rating}</span>
                      <span>{meal.level}</span>
                      <span>{meal.time}</span>
                    </div>
                    <button 
                      onClick={e => { e.stopPropagation(); toggleFav(e); }} 
                      className="category-fav-btn"
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <span style={{ color: isFav ? '#ff7a00' : '#ccc', fontSize: '1.2rem' }}>{isFav ? '❤️' : '🤍'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// 1. Crear función para obtener recetas aleatorias de la API
function getRandomLetter() {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  return letters[Math.floor(Math.random() * letters.length)];
}
async function fetchRandomMeals(count = 5) {
  let allMeals = [];
  let tries = 0;
  while (allMeals.length < count && tries < 10) {
    const letter = getRandomLetter();
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`);
    const data = await res.json();
    if (data.meals) {
      allMeals = allMeals.concat(data.meals);
    }
    tries++;
  }
  // Mezclar y tomar 'count' recetas
  allMeals = allMeals.sort(() => 0.5 - Math.random());
  return allMeals.slice(0, count);
}

const Home = ({ onSignOut }) => {
  const [page, setPage] = useState('home');
  const [showChat, setShowChat] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showRecipeDetail, setShowRecipeDetail] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showCategoryRecipes, setShowCategoryRecipes] = useState(false);
  const [categorySelected, setCategorySelected] = useState('');
  const [fromHistory, setFromHistory] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showMealType, setShowMealType] = useState(false);
  const [showMealTypeList, setShowMealTypeList] = useState(false);
  const [showFoodDetails, setShowFoodDetails] = useState(false);
  const [recommendedRecipes, setRecommendedRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [showCategories, setShowCategories] = useState(false);
  const [categoriesApi, setCategoriesApi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recipeResults, setRecipeResults] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [cards, setCards] = useState([]);
  const [newCard, setNewCard] = useState({ name: '', number: '', exp: '', cvc: '' });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mastercard');
  const [fromFavorite, setFromFavorite] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { from: 'bot', text: 'Hi! How can I help you today?' }
  ]);

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const handleAuthChange = () => {
      // Recargar los datos cuando cambie el estado de autenticación
      loadData();
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  // Cargar recetas y categorías al montar el componente
  const loadData = async () => {
    try {
      setLoadingRecipes(true);
      // Cargar recetas
      const recipes = await recipeService.getAllRecipes();
      setRecommendedRecipes(recipes);
      
      // Cargar categorías
      const response = await fetch('https://www.themealdb.com/api/json/v1/1/categories.php');
      const data = await response.json();
      if (data.categories) {
        setCategoriesApi(data.categories);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingRecipes(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Función de búsqueda de recetas
  const handleSearch = async (query) => {
    try {
      setLoading(true);
      const results = await recipeService.searchRecipes(query);
      setRecipeResults(results);
    } catch (error) {
      console.error('Error searching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener recetas por categoría
  const handleCategorySelect = async (category) => {
    try {
      setLoading(true);
      const results = await recipeService.getRecipesByCategory(category);
      setRecipeResults(results);
    } catch (error) {
      console.error('Error getting recipes by category:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Renderizado condicional de pantallas ---
  let mainContent = null;
  // 1. Prioridad a pantallas de pago
  if (showAddCard) mainContent = (
    <div className="profile-bg">
      <div className="profile-card" style={{ maxWidth: 340, margin: '32px auto', minHeight: 540, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div className="profile-header-row">
          <button className="profile-back-btn" onClick={() => setShowAddCard(false)}>
            <svg width="28" height="28" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#f5f5f5" /><path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
          <span className="profile-title">Add Card</span>
        </div>
        <form style={{ width: '100%', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={e => { e.preventDefault(); setCards([{ ...newCard }]); setShowAddCard(false); }}>
          <label style={{ fontWeight: 600, color: '#888' }}>CARD HOLDER NAME
            <input type="text" className="profile-edit-form" value={newCard.name} onChange={e => setNewCard({ ...newCard, name: e.target.value })} required style={{ width: '100%', marginTop: 6 }} />
          </label>
          <label style={{ fontWeight: 600, color: '#888' }}>CARD NUMBER
            <input type="text" className="profile-edit-form" value={newCard.number} onChange={e => setNewCard({ ...newCard, number: e.target.value })} required maxLength={16} style={{ width: '100%', marginTop: 6 }} placeholder="1234 5678 9012 3456" />
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ fontWeight: 600, color: '#888', flex: 1 }}>EXPIRE DATE
              <input type="text" className="profile-edit-form" value={newCard.exp} onChange={e => setNewCard({ ...newCard, exp: e.target.value })} required maxLength={5} style={{ width: '100%', marginTop: 6 }} placeholder="mm/yy" />
            </label>
            <label style={{ fontWeight: 600, color: '#888', flex: 1 }}>CVC
              <input type="text" className="profile-edit-form" value={newCard.cvc} onChange={e => setNewCard({ ...newCard, cvc: e.target.value })} required maxLength={3} style={{ width: '100%', marginTop: 6 }} placeholder="123" />
            </label>
          </div>
          <button className="profile-save-btn" style={{ width: '100%', marginTop: 18 }} type="submit">ADD & MAKE PAYMENT</button>
        </form>
      </div>
    </div>
  );
  else if (showPaymentSuccess) mainContent = (
    <div className="profile-bg">
      <div className="profile-card" style={{ maxWidth: 340, margin: '32px auto', minHeight: 540, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', justifyContent: 'center' }}>
        <img src={process.env.PUBLIC_URL + '/gastrobot2.png'} alt="success" style={{ width: 120, margin: '32px auto 18px auto', display: 'block' }} />
        <h2 style={{ textAlign: 'center', color: '#222', fontWeight: 700, marginBottom: 12 }}>Congratulations!</h2>
        <div style={{ color: '#888', fontSize: '1.08rem', textAlign: 'center', marginBottom: 24 }}>You successfully made a payment, enjoy our service!</div>
        <button className="profile-save-btn" style={{ width: '100%' }} onClick={() => { setShowPaymentSuccess(false); setShowPayment(false); }}>Enjoy</button>
      </div>
    </div>
  );
  else if (showPayment) mainContent = (
    <div className="profile-bg">
      <div className="profile-card" style={{ maxWidth: 340, margin: '32px auto', minHeight: 540, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div className="profile-header-row">
          <button className="profile-back-btn" onClick={() => setShowPayment(false)}>
            <svg width="28" height="28" viewBox="0 0 22 22"><circle cx="11" cy="11" r="11" fill="#f5f5f5" /><path d="M14 18l-6-7 6-7" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          </button>
          <span className="profile-title">Payment</span>
        </div>
        <div style={{ width: '100%', marginTop: 18 }}>
          {/* Métodos de pago seleccionables */}
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 18, gap: 8 }}>
            <button
              className={`profile-menu-icon-2 payment-method-btn${selectedPaymentMethod === 'visa' ? ' selected' : ''}`}
              style={{ background: selectedPaymentMethod === 'visa' ? '#fff' : '#f7f7fa', border: selectedPaymentMethod === 'visa' ? '2px solid #ff7a00' : '2px solid #eee', borderRadius: 14, padding: '10px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontWeight: 600, fontSize: 15, color: selectedPaymentMethod === 'visa' ? '#ff7a00' : '#1976d2', position: 'relative', cursor: 'pointer' }}
              onClick={() => setSelectedPaymentMethod('visa')}
            >
              <img src="https://img.icons8.com/color/48/000000/visa.png" alt="Visa" style={{ width: 32, marginBottom: 2 }} />
              Visa
              {selectedPaymentMethod === 'visa' && (
                <span style={{ position: 'absolute', top: 6, right: 6, background: '#ff7a00', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✓</span>
              )}
            </button>
            <button
              className={`profile-menu-icon-2 payment-method-btn${selectedPaymentMethod === 'mastercard' ? ' selected' : ''}`}
              style={{ background: selectedPaymentMethod === 'mastercard' ? '#fff' : '#f7f7fa', border: selectedPaymentMethod === 'mastercard' ? '2px solid #ff7a00' : '2px solid #eee', borderRadius: 14, padding: '10px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontWeight: 600, fontSize: 15, color: selectedPaymentMethod === 'mastercard' ? '#ff7a00' : '#1976d2', position: 'relative', cursor: 'pointer' }}
              onClick={() => setSelectedPaymentMethod('mastercard')}
            >
              <img src="https://img.icons8.com/color/48/000000/mastercard-logo.png" alt="Mastercard" style={{ width: 32, marginBottom: 2 }} />
              Mastercard
              {selectedPaymentMethod === 'mastercard' && (
                <span style={{ position: 'absolute', top: 6, right: 6, background: '#ff7a00', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✓</span>
              )}
            </button>
            <button
              className={`profile-menu-icon-2 payment-method-btn${selectedPaymentMethod === 'paypal' ? ' selected' : ''}`}
              style={{ background: selectedPaymentMethod === 'paypal' ? '#fff' : '#f7f7fa', border: selectedPaymentMethod === 'paypal' ? '2px solid #ff7a00' : '2px solid #eee', borderRadius: 14, padding: '10px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontWeight: 600, fontSize: 15, color: selectedPaymentMethod === 'paypal' ? '#ff7a00' : '#1976d2', position: 'relative', cursor: 'pointer' }}
              onClick={() => setSelectedPaymentMethod('paypal')}
            >
              <img src="https://img.icons8.com/color/48/000000/paypal.png" alt="PayPal" style={{ width: 32, marginBottom: 2 }} />
              PayPal
              {selectedPaymentMethod === 'paypal' && (
                <span style={{ position: 'absolute', top: 6, right: 6, background: '#ff7a00', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✓</span>
              )}
            </button>
          </div>
          {/* Card info dinámico según método de pago */}
          {selectedPaymentMethod === 'paypal' ? (
            <div style={{ background: '#f7f7fa', borderRadius: 18, padding: 24, textAlign: 'center', margin: '18px 0', border: '1.5px solid #eee' }}>
              <img src="https://img.icons8.com/color/96/000000/paypal.png" alt="PayPal" style={{ width: 90, marginBottom: 10 }} />
              <div style={{ fontWeight: 700, fontSize: '1.08rem', marginBottom: 6, color: '#222' }}>Connect your PayPal account</div>
              <div style={{ color: '#888', fontSize: '0.97rem', marginBottom: 10 }}>You will be redirected to PayPal to complete your payment.</div>
              <button className="profile-save-btn" style={{ width: '100%', background: '#fff', color: '#1976d2', border: '1.5px solid #1976d2', borderRadius: 12, fontWeight: 700, fontSize: 16, marginTop: 10, marginBottom: 0, padding: '10px 0' }} onClick={() => alert('Simulación: conectar PayPal')}>Connect PayPal</button>
            </div>
          ) : (
            cards.length === 0 ? (
              <div style={{ background: '#f7f7fa', borderRadius: 18, padding: 24, textAlign: 'center', margin: '18px 0', border: '1.5px solid #eee' }}>
                <img src="https://img.icons8.com/color/96/000000/bank-card-back-side.png" alt="No card" style={{ width: 90, marginBottom: 10 }} />
                <div style={{ fontWeight: 700, fontSize: '1.08rem', marginBottom: 6, color: '#222' }}>No {selectedPaymentMethod === 'visa' ? 'visa' : 'master'} card added</div>
                <div style={{ color: '#888', fontSize: '0.97rem', marginBottom: 10 }}>You can add a {selectedPaymentMethod === 'visa' ? 'visa' : 'mastercard'} and save it for later</div>
                <button className="profile-save-btn" style={{ width: '100%', background: '#fff', color: '#ff7a00', border: '1.5px solid #ff7a00', borderRadius: 12, fontWeight: 700, fontSize: 16, marginTop: 10, marginBottom: 0, padding: '10px 0' }} onClick={() => setShowAddCard(true)}>+ ADD NEW</button>
              </div>
            ) : (
              <div style={{ background: '#fff7f0', borderRadius: 18, padding: 18, margin: '18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={selectedPaymentMethod === 'visa' ? "https://img.icons8.com/color/48/000000/visa.png" : "https://img.icons8.com/color/48/000000/mastercard-logo.png"} alt={selectedPaymentMethod} style={{ width: 48 }} />
                  <span style={{ fontWeight: 600 }}>{selectedPaymentMethod === 'visa' ? 'Visa Card' : 'Master Card'}</span>
                  <span style={{ color: '#888', fontSize: '1.1rem', marginLeft: 8 }}>{'**** ' + cards[0].number.slice(-4)}</span>
                </div>
                <button className="profile-save-btn" style={{ fontSize: 14, padding: '6px 14px', marginLeft: 10 }} onClick={() => setShowAddCard(true)}>+ ADD NEW</button>
              </div>
            )
          )}
          <div style={{ margin: '18px 0 0 0', fontWeight: 700, fontSize: '1.1rem', color: '#888', textAlign: 'left' }}>TOTAL: <span style={{ color: '#222', fontWeight: 700, fontSize: 22, marginLeft: 8 }}>$20</span></div>
          <button className="profile-save-btn" style={{ width: '100%', marginTop: 18, background: '#ff7a00', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 16, padding: '16px 0', letterSpacing: 1 }} onClick={() => setShowPaymentSuccess(true)}>PAY & CONFIRM</button>
        </div>
      </div>
    </div>
  );
  // 2. Si no, renderiza el flujo normal de navegación
  else if (page === 'profile') mainContent = <ProfilePage onBack={() => setPage('home')} onMenu={key => {
    if (key === 'payment') setShowPayment(true);
    else setPage(key);
  }} onSignOut={() => {
    localStorage.setItem('rememberMe', 'false');
    logout();
    if (onSignOut) onSignOut();
  }} />;
  else if (page === 'personal') mainContent = <PersonalInfo onBack={() => setPage('profile')} onEdit={() => setPage('editProfile')} />;
  else if (page === 'editProfile') mainContent = <EditProfile onBack={() => setPage('personal')} />;
  else if (page === 'favorite') mainContent = <Favorite onBack={() => setPage('profile')} setSelectedRecipe={setSelectedRecipe} setShowRecipeDetail={setShowRecipeDetail} setPage={setPage} setFromFavorite={setFromFavorite} />;
  else if (page === 'history') mainContent = <History onBack={() => setPage('profile')} setSelectedRecipe={setSelectedRecipe} setShowRecipeDetail={setShowRecipeDetail} setPage={setPage} setFromHistory={setFromHistory} />;
  else if (showSearch) mainContent = <Search onBack={() => setShowSearch(false)} />;
  else if (showCategories) mainContent = <Categories onBack={() => setShowCategories(false)} onCategory={cat => { setCategorySelected(cat); setShowCategoryRecipes(true); setShowCategories(false); }} />;
  else if (showMealType) mainContent = <MealType onBack={() => setShowMealType(false)} onSelect={() => { setShowMealType(false); setShowMealTypeList(true); }} />;
  else if (showMealTypeList) mainContent = <MealTypeList onBack={() => setShowMealTypeList(false)} />;
  else if (showFoodDetails) mainContent = <RecipeDetail onBack={() => setShowFoodDetails(false)} recipe={milanesaData} />;
  else if (showRecipeDetail && selectedRecipe) {
    if (fromHistory) mainContent = <RecipeDetail recipe={selectedRecipe} onBack={() => { setShowRecipeDetail(false); setPage('history'); setFromHistory(false); }} />;
    else mainContent = <RecipeDetail recipe={selectedRecipe} onBack={() => setShowRecipeDetail(false)} />;
  } else if (showCategoryRecipes) mainContent = <CategoryRecipes category={categorySelected} onBack={() => setShowCategoryRecipes(false)} onShowRecipe={recipeObj => {
    setSelectedRecipe(recipeObj);
    setShowRecipeDetail(true);
  }} />;
  else mainContent = (
    <>
      <div className="home-topbar">
        <div className="home-greet-bar">
          <button className="home-perfil" onClick={() => setPage('profile')} style={{ background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '50%', width: 44, height: 44, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginRight: 8, cursor: 'pointer' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="14" fill="#f5f5f5" />
              <rect x="8" y="11" width="12" height="2" rx="1" fill="#111" />
              <rect x="8" y="15" width="12" height="2" rx="1" fill="#111" />
              <rect x="8" y="7" width="12" height="2" rx="1" fill="#111" />
            </svg>
          </button>
          <span className="home-greet-text">Explore. Cook. Enjoy.</span>
          <img src={process.env.PUBLIC_URL + '/gastrobot2.png'} alt="logo" className="home-greet-logo" />
        </div>
      </div>
      <div className="home-bg">
        <div className="home-main-card">
          <div className="home-main-scroll">
            <input className="home-search" placeholder="Explore recipes" onFocus={() => setShowSearch(true)} readOnly />
            <div className="home-section">
              <div className="home-section-title">All Categories <span className="home-see-all" onClick={() => setShowCategories(true)}>See All</span></div>
              <div className="home-categories" style={{ overflowX: 'auto', whiteSpace: 'nowrap', width: '100%', paddingBottom: 2 }}>
                {categoriesApi.length === 0 ? (
                  <span style={{ color: '#aaa' }}>Loading...</span>
                ) : (
                  categoriesApi.slice(0, 8).map(cat => (
                    <div className="home-category" key={cat.idCategory} style={{ display: 'inline-flex', verticalAlign: 'top' }} onClick={() => { setCategorySelected(cat.strCategory); setShowCategoryRecipes(true); setShowCategories(false); }}>
                      <img src={cat.strCategoryThumb} alt={cat.strCategory} style={{ width: 54, height: 54, borderRadius: 12, objectFit: 'cover', marginRight: 8 }} />
                      <span style={{ fontWeight: 600, fontSize: '0.98rem', color: '#222', marginTop: 8 }}>{cat.strCategory}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="home-section">
              <div className="home-section-title">Recommended Recipes</div>
              <div className="home-recommend-list">
                {loadingRecipes ? (
                  <div style={{ textAlign: 'center', width: '100%', color: '#aaa', padding: '24px 0' }}>Loading...</div>
                ) : recommendedRecipes.length > 0 ? (
                  recommendedRecipes.map((rec, idx) => (
                    <div className="home-recommend" key={rec.id + idx} style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (rec.id) {
                          fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${rec.id}`)
                            .then(res => res.json())
                            .then(data => {
                              if (data.meals && data.meals[0]) {
                                const meal = data.meals[0];
                                const ingredients = [];
                                for (let i = 1; i <= 20; i++) {
                                  const ing = meal[`strIngredient${i}`];
                                  const measure = meal[`strMeasure${i}`];
                                  if (ing && ing.trim() && ing.trim().toLowerCase() !== 'null' && ing.trim().toLowerCase() !== 'undefined') {
                                    ingredients.push((measure && measure.trim() ? measure.trim() + ' ' : '') + ing.trim());
                                  }
                                }
                                setSelectedRecipe({
                                  ...meal,
                                  name: meal.strMeal,
                                  img: meal.strMealThumb,
                                  fullDesc: meal.strInstructions,
                                  time: rec.time,
                                  rating: rec.rating,
                                  level: rec.level,
                                  ingredients,
                                });
                                setShowRecipeDetail(true);
                              }
                            });
                        } else if (rec.ingredients) {
                          const ingredients = [];
                          for (let i = 0; i < rec.ingredients.length; i++) {
                            if (rec.ingredients[i] && rec.ingredients[i].trim()) ingredients.push(rec.ingredients[i]);
                          }
                          setSelectedRecipe({
                            ...rec,
                            name: rec.name,
                            img: rec.img,
                            fullDesc: rec.fullDesc || rec.desc || '',
                            time: rec.time || rec.cook || '',
                            rating: rec.rating,
                            level: rec.level,
                            ingredients,
                          });
                          setShowRecipeDetail(true);
                        }
                      }}>
                      <img src={rec.img} alt={rec.name} className="home-recommend-img" />
                      <div className="home-recommend-info">
                        <div className="home-recommend-title">{rec.name}</div>
                        <div className="home-recommend-desc">{rec.desc}</div>
                        <div className="home-recommend-meta" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: '0.8rem', color: '#ff7a00', fontWeight: 500, justifyContent: 'flex-start', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><span role="img" aria-label="star">⭐</span> {rec.rating}</span>
                          <span style={{ color: '#ff7a00', fontWeight: 500 }}>{rec.level}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><span role="img" aria-label="time">⏱️</span> {rec.time}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', width: '100%', color: '#aaa', padding: '24px 0' }}>No recipes found.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {mainContent}
      <button className="chatbox-btn" onClick={() => setShowChat(v => !v)}>
        <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Chatbot" />
      </button>
      {showChat && (
        <>
          <div
            className="chatbox-overlay"
            onClick={() => setShowChat(false)}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.12)',
              zIndex: 1199
            }}
          />
          <Chatbox
            setSelectedRecipe={setSelectedRecipe}
            setShowRecipeDetail={setShowRecipeDetail}
            messages={chatMessages}
            setMessages={setChatMessages}
          />
        </>
      )}
    </>
  );
};

export default Home; 