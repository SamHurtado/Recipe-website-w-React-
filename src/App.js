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

  return (
    <div className="App dark">
      <nav className="TopBar">
        <div className="Brand">🍲 Home</div>
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
        </div>
      </nav>

      <header className="Header dark">
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

      <main className="Grid dark">
        {shownMeals.map((m) => (
          <article className="Card dark" key={m.id}>
            <div className="ImageWrap">
              <img src={m.image} alt={m.title} />
            </div>
            <div className="CardBody">
              <h3>{m.title}</h3>
              <p>{m.category}</p>
              <div className="Actions">
                <button className="btn" onClick={() => window.alert(m.title)}>View</button>
                <button className={`icon ${isFavorite(m.id)?'active':''}`} onClick={() => toggleFavorite(m.id)} aria-label="Toggle favorite">❤</button>
              </div>
            </div>
          </article>
        ))}
      </main>

      <footer className="Footer dark">
        <small>© {new Date().getFullYear()} Meal Search</small>
      </footer>
    </div>
  );
}

export default App;
