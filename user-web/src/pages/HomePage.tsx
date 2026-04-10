import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchItems, fetchCategories } from '../api/services';
import { Item, Category } from '../types';
import ItemCard from '../components/ItemCard';
import styles from './HomePage.module.css';

const HomePage: React.FC = () => {
  const [items, setItems]           = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([fetchItems(), fetchCategories()])
      .then(([itemsRes, catsRes]) => {
        setItems(itemsRes.data.data.slice(0, 8)); // show first 8 on home
        setCategories(catsRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={`page-wrap ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <span className={styles.heroPill}>🎉 Fresh &amp; Delicious Daily</span>
            <h1 className={styles.heroTitle}>
              Order your favourite <span className={styles.highlight}>canteen food</span> in minutes
            </h1>
            <p className={styles.heroSub}>
              Browse the full menu, add to cart, and pick up hot at the counter. No queues!
            </p>
            <div className={styles.heroCta}>
              <Link to="/menu" className="btn btn-primary btn-lg">Explore Menu 🍛</Link>
              <Link to="/register" className="btn btn-outline btn-lg">Create Account</Link>
            </div>
          </div>
          <div className={styles.heroIllustration}>🍽️</div>
        </div>
      </section>

      {/* ─── Category chips ────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="page-section">
          <div className="page-wrap">
            <h2 className="section-heading">🗂️ Browse by Category</h2>
            <div className={styles.catGrid}>
              {categories.map((cat) => (
                <Link key={cat.id} to={`/menu?category=${cat.id}`} className={styles.catChip}>
                  <div className={styles.catEmoji}>
                    {getCatEmoji(cat.name)}
                  </div>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Featured items ────────────────────────────────────── */}
      <section className="page-section" style={{ paddingTop: 0 }}>
        <div className="page-wrap">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 className="section-heading" style={{ marginBottom: 0 }}>🌟 Popular Items</h2>
            <Link to="/menu" className={styles.viewAll}>View all →</Link>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <h3>Menu coming soon!</h3>
              <p>The canteen is setting up. Check back shortly.</p>
            </div>
          ) : (
            <div className={styles.itemGrid}>
              {items.map((item) => <ItemCard key={item.id} item={item} />)}
            </div>
          )}
        </div>
      </section>

      {/* ─── How it works ──────────────────────────────────────── */}
      <section className={styles.howSection}>
        <div className="page-wrap">
          <h2 className="section-heading" style={{ justifyContent: 'center' }}>How it works</h2>
          <div className={styles.steps}>
            {[
              { icon: '🔍', title: 'Browse the Menu', desc: 'Explore dishes by category or search for what you crave.' },
              { icon: '🛒', title: 'Add to Cart', desc: 'Pick your favourites and adjust quantities freely.' },
              { icon: '✅', title: 'Place Order', desc: 'Checkout in one tap — pay cash at the counter.' },
              { icon: '🍛', title: 'Pick Up & Enjoy', desc: 'Get notified when your order is ready to collect!' },
            ].map((step) => (
              <div key={step.title} className={styles.step}>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Small helper to pick an emoji for well-known category names
function getCatEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('breakfast')) return '🌅';
  if (n.includes('lunch'))     return '🍱';
  if (n.includes('snack'))     return '🧆';
  if (n.includes('beverage') || n.includes('drink')) return '☕';
  if (n.includes('dessert') || n.includes('sweet'))  return '🍮';
  return '🍽️';
}

export default HomePage;
