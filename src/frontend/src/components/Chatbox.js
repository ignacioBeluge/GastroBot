import React, { useState, useRef, useEffect } from 'react';
import './Chatbox.css';

const Chatbox = ({ setSelectedRecipe, setShowRecipeDetail, messages: propMessages, setMessages: propSetMessages, isMinimized, onToggleMinimize }) => {
  const [internalMessages, setInternalMessages] = useState([
    { from: 'bot', text: 'Hi! How can I help you today?' }
  ]);
  const messages = propMessages || internalMessages;
  const setMessages = propSetMessages || setInternalMessages;
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipeResults, setRecipeResults] = useState([]);
  const fileInputRef = useRef();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  // Detect if message is a recipe query
  function isRecipeQuery(text) {
    const foodKeywords = ['receta', 'cómo hacer', 'como hacer', 'preparar', 'ingredientes', 'cocinar', 'hacer', 'cómo preparo', 'como preparo'];
    return foodKeywords.some(k => text.toLowerCase().includes(k)) ||
      (/^[a-zA-Z\s]+$/.test(text) && text.trim().split(' ').length <= 3 && !text.includes('?'));
  }

  // Detect if it's a general question
  function isGeneralQuestion(text) {
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
    
    const userMessage = input.trim();
    setMessages(msgs => [...msgs, { from: 'user', text: userMessage }]);
    setInput('');
    
    if (isGeneralQuestion(userMessage)) {
      fetchAIResponse(userMessage);
    } else if (isRecipeQuery(userMessage)) {
      fetchRecipeFromAPI(userMessage);
    } else {
      fetchAIResponse(userMessage);
    }
  };

  const handleImage = e => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMessages(msgs => [...msgs, { from: 'user', image: url }]);
      setTimeout(() => {
        setMessages(msgs => [...msgs, { from: 'bot', text: 'Nice image!' }]);
      }, 600);
    }
  };

  const handleVoice = () => {
    setMessages(msgs => [...msgs, { from: 'user', text: '[Voice message]' }]);
    setTimeout(() => {
      setMessages(msgs => [...msgs, { from: 'bot', text: 'Voice received!' }]);
    }, 600);
  };

  const handleNewChat = () => {
    setMessages([{ from: 'bot', text: 'Hi! How can I help you today?' }]);
    setInput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // If minimized, show only the floating chat button
  if (isMinimized) {
    return (
      <div className="chatbox-floating-btn" onClick={onToggleMinimize}>
        <div className="chatbox-floating-icon">💬</div>
        {messages.length > 1 && (
          <div className="chatbox-notification-badge">{messages.length - 1}</div>
        )}
      </div>
    );
  }

  return (
    <div className="chatbox-window">
      <div className="chatbox-header">
        <button onClick={handleNewChat} className="chatbox-new-btn" title="New chat">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M4 17v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
            <rect x="7" y="7" width="6" height="6" rx="1" />
            <path d="M10 9v2M9 10h2" />
          </svg>
          <span>New chat</span>
        </button>
        <span className="chatbox-title">GastroBot Chat</span>
        <button onClick={onToggleMinimize} className="chatbox-minimize-btn" title="Minimize">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </button>
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
            <div key={i} className={msg.from === 'bot' ? 'chat-msg bot' : 'chat-msg user'}>
              {msg.text}
            </div>
          )
        ))}
        {loading && <div className="chat-msg bot">...</div>}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chatbox-input" onSubmit={handleSend}>
        <button type="button" className="chatbox-icon-btn" onClick={() => fileInputRef.current.click()} title="Upload image">
          <svg width="22" height="22" viewBox="0 0 22 22">
            <path d="M4 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="#ff7a00" strokeWidth="2" fill="none" />
            <rect x="7" y="10" width="8" height="6" rx="1" stroke="#ff7a00" strokeWidth="2" fill="none" />
            <circle cx="11" cy="13" r="1.5" fill="#ff7a00" />
          </svg>
        </button>
        
        <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImage} />
        
        <button type="button" className="chatbox-icon-btn" onClick={handleVoice} title="Send voice">
          <svg width="22" height="22" viewBox="0 0 22 22">
            <rect x="8" y="4" width="6" height="10" rx="3" stroke="#ff7a00" strokeWidth="2" fill="none" />
            <path d="M11 18v-2" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 14a4 4 0 0 0 8 0" stroke="#ff7a00" strokeWidth="2" fill="none" />
          </svg>
        </button>
        
        <input 
          ref={inputRef}
          className="chatbox-input-field" 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Type your message..." 
          type="text"
          autoComplete="off"
        />
        
        <button className="chatbox-send" type="submit" disabled={!input.trim()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22,2 15,22 11,13 2,9"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default Chatbox; 