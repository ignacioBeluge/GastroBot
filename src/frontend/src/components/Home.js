import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import Chatbox from './Chatbox';
import ProfilePage from './ProfilePage';
import PersonalInfo from './PersonalInfo';
import EditProfile from './EditProfile';
import RecipeDetail from './RecipeDetail';
import CategoryRecipes from './CategoryRecipes';
import Search from './Search';
import Categories from './Categories';
import MealType from './MealType';
import MealTypeList from './MealTypeList';
import Favorite from './Favorite';
import History from './History';
import MealPlanner from './MealPlanner';
import PaymentScreen from './PaymentScreen';
import './Home.css';

// Utility functions
function useResponsive() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

const Home = ({ onSignOut }) => {
  const [page, setPage] = useState('home');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showRecipeDetail, setShowRecipeDetail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [fromFavorite, setFromFavorite] = useState(false);
  const [fromHistory, setFromHistory] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatMinimized, setIsChatMinimized] = useState(true);
  const isMobile = useResponsive();

  const user = getCurrentUser();
  const name = user?.user?.name || '';
  const plan = user?.user?.plan || 'free';

  useEffect(() => {
    const handleAuthChange = () => {
      if (!getCurrentUser()) {
        onSignOut();
      }
    };

    window.addEventListener('storage', handleAuthChange);
    return () => window.removeEventListener('storage', handleAuthChange);
  }, [onSignOut]);

  const loadData = async () => {
    try {
      const [categoriesRes, randomMealsRes] = await Promise.all([
        fetch('https://www.themealdb.com/api/json/v1/1/categories.php'),
        fetch('https://www.themealdb.com/api/json/v1/1/random.php')
      ]);

      const categoriesData = await categoriesRes.json();
      const randomMealsData = await randomMealsRes.json();

      // Process data as needed
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = async (query) => {
    setPage('search');
    // Search functionality will be handled in Search component
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setPage('category');
  };

  const handleMenuSelect = (menuItem) => {
    switch (menuItem) {
      case 'personal':
        setPage('personal');
        break;
      case 'favorite':
        setPage('favorite');
        break;
      case 'history':
        setPage('history');
        break;
      case 'payment':
        setPage('payment');
        break;
      default:
        break;
    }
  };

  const handleBack = () => {
    if (showRecipeDetail) {
      setShowRecipeDetail(false);
      setSelectedRecipe(null);
      setFromFavorite(false);
      setFromHistory(false);
    } else {
      setPage('home');
      setSelectedCategory(null);
    }
  };

  const handleShowRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeDetail(true);
  };

  const handleEditProfile = () => {
    setPage('edit');
  };

  const handleBackToProfile = () => {
    setPage('profile');
  };

  const handleBackToPersonal = () => {
    setPage('personal');
  };

  const handleToggleChatMinimize = () => {
    setIsChatMinimized(!isChatMinimized);
  };

  // Render different pages
  if (showRecipeDetail && selectedRecipe) {
    return <RecipeDetail recipe={selectedRecipe} onBack={handleBack} />;
  }

  if (page === 'category' && selectedCategory) {
    return <CategoryRecipes category={selectedCategory} onBack={handleBack} onShowRecipe={handleShowRecipe} />;
  }

  if (page === 'profile') {
    return <ProfilePage onBack={handleBack} onMenu={handleMenuSelect} onSignOut={onSignOut} />;
  }

  if (page === 'personal') {
    return <PersonalInfo onBack={handleBackToProfile} onEdit={handleEditProfile} />;
  }

  if (page === 'edit') {
    return <EditProfile onBack={handleBackToPersonal} />;
  }

  if (page === 'favorite') {
    return (
      <Favorite
        onBack={handleBack}
        setSelectedRecipe={setSelectedRecipe}
        setShowRecipeDetail={setShowRecipeDetail}
        setPage={setPage}
        setFromFavorite={setFromFavorite}
      />
    );
  }

  if (page === 'history') {
    return (
      <History
        onBack={handleBack}
        setSelectedRecipe={setSelectedRecipe}
        setShowRecipeDetail={setShowRecipeDetail}
        setPage={setPage}
        setFromHistory={setFromHistory}
      />
    );
  }

  if (page === 'search') {
    return <Search onBack={handleBack} onRecipeSelect={handleShowRecipe} />;
  }

  if (page === 'categories') {
    return <Categories onBack={handleBack} onCategory={handleCategorySelect} />;
  }

  if (page === 'mealtype') {
    return <MealType onBack={handleBack} onSelect={(mealType) => {
      setSelectedMealType(mealType);
      setPage('mealtypelist');
    }} />;
  }

  if (page === 'mealtypelist') {
    return <MealTypeList onBack={() => setPage('mealtype')} selectedMealType={selectedMealType} onRecipeSelect={handleShowRecipe} />;
  }

  if (page === 'payment') {
    return <PaymentScreen onBack={() => setPage('profile')} />;
  }

  // Main home page
  return (
    <div className="home-bg">
      <div className="home-container">
        <div className="home-header">
          <div className="home-welcome">
            <h1 className="home-title">Welcome back, {name}!</h1>
            <p className="home-subtitle">What would you like to cook today?</p>
          </div>
          <div className="home-avatar-badge-stack">
            <div className="home-avatar" onClick={() => setPage('profile')} />
            {plan === 'pro' && (
              <div className="home-pro-badge">PRO</div>
            )}
          </div>
        </div>

        <MealPlanner />

        <div className="home-menu-grid">
          <div className="home-menu-item" onClick={() => setPage('search')}>
            <div className="home-menu-icon">🔍</div>
            <span className="home-menu-text">Search</span>
          </div>
          <div className="home-menu-item" onClick={() => setPage('categories')}>
            <div className="home-menu-icon">📂</div>
            <span className="home-menu-text">Categories</span>
          </div>
          <div className="home-menu-item" onClick={() => setPage('mealtype')}>
            <div className="home-menu-icon">🍽️</div>
            <span className="home-menu-text">Meal Types</span>
          </div>
          <div className="home-menu-item" onClick={() => setPage('favorite')}>
            <div className="home-menu-icon">❤️</div>
            <span className="home-menu-text">Favorites</span>
          </div>
          <div className="home-menu-item" onClick={() => setPage('history')}>
            <div className="home-menu-icon">🕓</div>
            <span className="home-menu-text">History</span>
          </div>
        </div>
      </div>

      {/* Always show chat as floating icon */}
      <Chatbox
        setSelectedRecipe={setSelectedRecipe}
        setShowRecipeDetail={setShowRecipeDetail}
        messages={chatMessages}
        setMessages={setChatMessages}
        isMinimized={isChatMinimized}
        onToggleMinimize={handleToggleChatMinimize}
      />
    </div>
  );
};

export default Home; 