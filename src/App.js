import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API = 'https://www.themealdb.com/api/json/v1/1';

function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [meals, setMeals] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch {
      return [];
    }
  });
  const [user, setUser] = useState(() => localStorage.getItem('user') || '');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [page, setPage] = useState('home');
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load categories
  useEffect(() => {
    fetch(`${API}/list.php?c=list`)
      .then((r) => r.json())
      .then((d) => setCategories(d?.meals?.map((m) => m.strCategory) || []))
      .catch(() => setCategories([]));
  }, []);

  // Load meals by category or search
  useEffect(() => {
    const load = async () => {
      try {
        let data;
        if (category) {
          const r = await fetch(`${API}/filter.php?c=${encodeURIComponent(category)}`);
          data = await r.json();
          // filter endpoint returns limited info; map into a uniform shape
          setMeals((data.meals || []).map((m) => ({
            id: m.idMeal,
            title: m.strMeal,
            image: m.strMealThumb,
            category
          })));
          return;
        }
        if (query.trim()) {
          const r = await fetch(`${API}/search.php?s=${encodeURIComponent(query.trim())}`);
          data = await r.json();
          setMeals((data.meals || []).map((m) => ({
            id: m.idMeal,
            title: m.strMeal,
            image: m.strMealThumb,
            category: m.strCategory || ''
          })));
          return;
        }
        // default: show popular categories (fallback)
        const r = await fetch(`${API}/filter.php?c=Seafood`);
        data = await r.json();
        setMeals((data.meals || []).slice(0, 12).map((m) => ({
          id: m.idMeal,
          title: m.strMeal,
          image: m.strMealThumb,
          category: 'Seafood'
        })));
      } catch {
        setMeals([]);
      }
    };
    load();
  }, [query, category]);

  const isFavorite = (id) => favorites.includes(id);
  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem('favorites', JSON.stringify(next));
      return next;
    });
  };

  const favoriteCount = favorites.length;
  const shownMeals = useMemo(() => {
    return meals.filter((m) => (category ? m.category === category : true));
  }, [meals, category]);

  const shuffle = () => {
    setMeals((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const signOut = () => {
    setUser('');
    localStorage.removeItem('user');
  };
  const signIn = () => {
    const name = prompt('Enter your name');
    if (name) {
      setUser(name);
      localStorage.setItem('user', name);
    }
  };

  const viewRecipe = async (id) => {
    try {
      setSelectedId(id);
      setLoadingDetail(true);
      setDetail(null);
      const r = await fetch(`${API}/lookup.php?i=${encodeURIComponent(id)}`);
      const d = await r.json();
      const meal = (d.meals || [])[0] || null;
      setDetail(meal);
    } catch {
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeRecipe = () => {
    setSelectedId('');
    setDetail(null);
    setLoadingDetail(false);
  };

  const ingredients = (meal) => {
    if (!meal) return [];
    const list = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const mea = meal[`strMeasure${i}`];
      if (ing && ing.trim()) {
        list.push({ ingredient: ing.trim(), measure: (mea || '').trim() });
      }
    }
    return list;
  };

  const goHome = () => {
    setCategory('');
    setQuery('');
    closeRecipe();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setPage('home');
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  return (
    <div className={`App ${theme}`}>
      <nav className={`TopBar ${theme}`}>
        <button className="Brand" onClick={goHome} aria-label="Go to home">🍲 Home</button>
        <div className="Title">Meal Search</div>
        <div className="User">
          {user ? (
            <>
              <span>Welcome, {user}!</span>
              <button className="btn" onClick={signOut}>Sign Out</button>
            </>
          ) : (
            <button className="btn" onClick={signIn}>Sign In</button>
          )}
          <button className="btn" onClick={toggleTheme}>{theme === 'dark' ? 'Light' : 'Dark'} Mode</button>
        </div>
      </nav>

      {page === 'home' ? (
        <header className={`Header ${theme}`}>
          <div className="Hero">
            <h1>Tasty recipes at your fingertips</h1>
            <p className="muted">Discover meals, filter by category, and save favorites.</p>
            <div className="HeroActions">
              <button className="btn primary" onClick={() => setPage('search')}>Browse Recipes</button>
              <button className="btn" onClick={() => { setPage('search'); setCategory('Seafood'); }}>Seafood Picks</button>
            </div>
          </div>
        </header>
      ) : (
        <>
          <header className={`Header ${theme}`}>
            <form className="Search" onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                placeholder="Search for a meal..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="button" className="btn primary" onClick={shuffle}>Shuffle Recipes</button>
            </form>

            <div className="Filters">
              <span>Filter by Category</span>
              <div className="Chips">
                {['Breakfast','Lunch','Dinner','Dessert','Beef','Pork','Chicken','Seafood','Vegetarian'].map((c) => (
                  <button
                    key={c}
                    className={`chip ${category===c ? 'active':''}`}
                    onClick={() => setCategory(category===c ? '' : c)}
                  >{c}</button>
                ))}
                <button className="chip fav" onClick={() => setMeals(meals.filter(m=>favorites.includes(m.id)))}>
                  ❤ Favorites ({favoriteCount})
                </button>
              </div>
            </div>
          </header>

          <main className={`Grid ${theme}`}>
            {shownMeals.map((m) => (
              <article className={`Card ${theme}`} key={m.id}>
                <div className="ImageWrap">
                  <img src={m.image} alt={m.title} />
                </div>
                <div className="CardBody">
                  <h3>{m.title}</h3>
                  <p>{m.category}</p>
                  <div className="Actions">
                    <button className="btn" onClick={() => viewRecipe(m.id)}>View</button>
                    <button className={`icon ${isFavorite(m.id)?'active':''}`} onClick={() => toggleFavorite(m.id)} aria-label="Toggle favorite">❤</button>
                  </div>
                </div>
              </article>
            ))}
          </main>
        </>
      )}

      <footer className={`Footer ${theme}`}>
        <small>© {new Date().getFullYear()} Meal Search</small>
      </footer>

      {selectedId && (
        <div className="ModalOverlay" onClick={closeRecipe}>
          <div className="ModalCard" onClick={(e) => e.stopPropagation()}>
            {loadingDetail && <div className="ModalBody">Loading…</div>}
            {!loadingDetail && detail && (
              <>
                <div className="ModalHeader">
                  <img src={detail.strMealThumb} alt={detail.strMeal} />
                  <div>
                    <h2>{detail.strMeal}</h2>
                    <p className="muted">{detail.strCategory} {detail.strArea ? `• ${detail.strArea}` : ''}</p>
                  </div>
                  <button className="btn" onClick={closeRecipe}>Close</button>
                </div>
                <div className="ModalBody">
                  <h3>Ingredients</h3>
                  <ul className="Ingredients">
                    {ingredients(detail).map((it, idx) => (
                      <li key={idx}><span>{it.ingredient}</span><span className="muted">{it.measure}</span></li>
                    ))}
                  </ul>
                  {detail.strInstructions && (
                    <>
                      <h3>Instructions</h3>
                      <p className="instructions">{detail.strInstructions}</p>
                    </>
                  )}
                  {detail.strYoutube && (
                    <a className="btn primary" target="_blank" rel="noreferrer" href={detail.strYoutube}>Watch on YouTube</a>
                  )}
                </div>
              </>
            )}
            {!loadingDetail && !detail && (
              <div className="ModalBody">Recipe not found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
