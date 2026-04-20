import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchItems, fetchCategories } from '../api/services';
import { Item, Category } from '../types';
import ItemCard from '../components/ItemCard';
import styles from './MenuPage.module.css';

const MenuPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems]           = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [inputVal, setInputVal]     = useState('');

  const activeCat = searchParams.get('category') ?? '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchItems({
        category_id: activeCat || undefined,
        search: search || undefined,
      });
      setItems(res.data.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeCat, search]);

  // Load categories once on mount
  useEffect(() => {
    fetchCategories()
      .then((r) => setCategories(r.data.data))
      .catch(console.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(inputVal), 380);
    return () => clearTimeout(t);
  }, [inputVal]);

  const selectCategory = (id: string) => {
    if (id) setSearchParams({ category: id });
    else setSearchParams({});
  };

  const showCategoryDescription = (cat: Pick<Category, 'name' | 'description'>) => {
    const desc = (cat.description ?? '').trim();
    window.alert(desc ? `${cat.name}\n\n${desc}` : `${cat.name}\n\nNo description provided.`);
  };

  const handleCategorySelect = (cat: Category) => {
    selectCategory(cat.id);
    showCategoryDescription(cat);
  };

  const handleItemCategoryClick = (cat: { id: string; name: string; description?: string }) => {
    const fallback = categories.find((c) => c.id === cat.id);
    showCategoryDescription({
      name: cat.name,
      description: cat.description ?? fallback?.description,
    });
  };

  return (
    <div className="page-section">
      <div className="page-wrap">
        {/* Header */}
        <div className={styles.header}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>🍛 Our Menu</h1>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search dishes…"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
          </div>
        </div>

        {/* Category filter bar */}
        <div className={styles.catBar}>
          <button
            className={`${styles.catBtn} ${activeCat === '' ? styles.catActive : ''}`}
            onClick={() => selectCategory('')}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`${styles.catBtn} ${activeCat === c.id ? styles.catActive : ''}`}
              onClick={() => handleCategorySelect(c)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No items found</h3>
            <p>Try a different search or category.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              {items.length} item{items.length !== 1 ? 's' : ''} found
            </p>
            <div className={styles.grid}>
              {items.map((item) => (
                <ItemCard key={item.id} item={item} onCategoryClick={handleItemCategoryClick} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
