import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Chatbox.css';

const Chatbox = ({ setSelectedRecipe, setShowRecipeDetail, messages: propMessages, setMessages: propSetMessages, isMinimized, onToggleMinimize }) => {
  const [internalMessages, setInternalMessages] = useState([
    { from: 'bot', text: 'Hi! How can I help you today?' }
  ]);
  const messages = propMessages || internalMessages;
  const setMessages = propSetMessages || setInternalMessages;
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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
    const foodKeywords = ['receta', 'cómo hacer', 'como hacer', 'preparar', 'ingredientes', 'cocinar', 'hacer', 'cómo preparo', 'como preparo', 'recipe', 'cook', 'cooking', 'meal', 'dish', 'food', 'plato', 'comida', 'how to make', 'how to cook', 'how to prepare', 'how to recipe', 'how to dish', 'how to food'];
    return foodKeywords.some(k => text.toLowerCase().includes(k)) ||
      (/^[a-zA-Z\s]+$/.test(text) && text.trim().split(' ').length <= 3 && !text.includes('?'));
  }

  // Detect if it's a general question
  function isGeneralQuestion(text) {
    const generalWords = ['how are you', 'who are you', 'what can you do', 'hello', 'hi', 'help', 'thanks', 'thank you', 'goodbye', 'bye'];
    const lower = text.toLowerCase();
    return text.trim().endsWith('?') || generalWords.some(w => lower.includes(w));
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { from: 'user', text: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const backendMessages = newMessages
        .filter(m => m.from !== 'image' && m.text)
        .map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));

      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: backendMessages }),
      });

      if (!res.ok) throw new Error('Backend responded with an error');

      const data = await res.json();
      
      if (data.type === 'recipe_list' && data.content.length > 0) {
        setMessages(current => [...current, { from: 'bot', recipes: data.content }]);
      } else {
        setMessages(current => [...current, { from: 'bot', text: data.content || 'Sorry, I ran into a problem.' }]);
      }

    } catch (err) {
      setMessages(current => [...current, { from: 'bot', text: 'Error connecting to GastroBot. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = (recipe) => {
    if (recipe.source === 'AI') {
      // It's a fully detailed AI recipe, just show it
      setSelectedRecipe(recipe);
      setShowRecipeDetail(true);
    } else {
      // It's a DB recipe stub, fetch the full details
      fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.idMeal}`)
        .then(res => res.json())
        .then(data => {
          if (data.meals && data.meals[0]) {
            const meal = data.meals[0];
            const ingredients = [];
            for (let i = 1; i <= 20; i++) {
              const ing = meal[`strIngredient${i}`];
              const measure = meal[`strMeasure${i}`];
              if (ing && ing.trim()) {
                ingredients.push(`${measure || ''} ${ing}`.trim());
              }
            }
            setSelectedRecipe({
              ...meal,
              name: meal.strMeal,
              img: meal.strMealThumb,
              fullDesc: meal.strInstructions,
              time: meal.strTags || '30 min',
              ingredients,
              difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
              rating: (4 + Math.random()).toFixed(1),
            });
            setShowRecipeDetail(true);
          }
        });
    }
  };

  const handleNewChat = () => {
    setMessages([{ from: 'bot', text: 'Hi! How can I help you today?' }]);
    setInput('');
    inputRef.current?.focus();
  };

  // If minimized, show only the floating chat button
  if (isMinimized) {
    return (
      <div className="chatbox-floating-btn" onClick={onToggleMinimize}>
        <img src="/logo.png" alt="GastroBot" className="chatbox-floating-icon" />
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
          <div key={i} className={`chat-msg ${msg.from}`}>
            {msg.text && (
              <ReactMarkdown className="markdown-content" remarkPlugins={[remarkGfm]}>
                {msg.text}
              </ReactMarkdown>
            )}
            {msg.recipes && (
              <div className="chat-recipes-list">
                <p>I found these recipes for you:</p>
                {msg.recipes.map((rec) => (
                  <div key={rec.idMeal} className="chat-recipe-item" onClick={() => handleRecipeClick(rec)}>
                    {rec.strMealThumb && <img src={rec.strMealThumb} alt={rec.strMeal} className="chat-recipe-img" />}
                    <div className="chat-recipe-name">{rec.strMeal}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="chat-msg bot">...</div>}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chatbox-input" onSubmit={handleSendMessage}>
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