import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchItemById } from '../api/services';
import { Item } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import styles from './ItemDetailPage.module.css';

const ItemDetailPage: React.FC = () => {
  const { id }    = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty]         = useState(1);
  const [adding, setAdding]   = useState(false);

  const { addItem }        = useCart();
  const { isAuthenticated } = useAuth();
  const navigate            = useNavigate();

  useEffect(() => {
    if (!id) return;
    fetchItemById(id)
      .then((r) => setItem(r.data.data))
      .catch(() => toast.error('Item not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setAdding(true);
    try {
      await addItem(item!.id, qty);
      toast.success(`${item!.name} × ${qty} added to cart!`);
    } catch {
      toast.error('Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!item)   return (
    <div className="empty-state" style={{ minHeight: '60vh' }}>
      <div className="empty-icon">😕</div>
      <h3>Item not found</h3>
      <Link to="/menu" className="btn btn-primary" style={{ marginTop: 8 }}>Back to Menu</Link>
    </div>
  );

  return (
    <div className="page-section">
      <div className="page-wrap">
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <span>›</span>
          <Link to="/menu">Menu</Link>
          <span>›</span>
          <span>{item.name}</span>
        </div>

        <div className={styles.layout}>
          {/* Left — image */}
          <div className={styles.imageWrap}>
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className={styles.image} />
            ) : (
              <div className={styles.imagePlaceholder}>🍛</div>
            )}
          </div>

          {/* Right — details */}
          <div className={styles.details}>
            {item.categories && (
              <Link
                to={`/menu?category=${item.category_id}`}
                className={styles.catTag}
              >
                {item.categories.name}
              </Link>
            )}

            <h1 className={styles.name}>{item.name}</h1>

            <div className={styles.price}>₹{item.price}</div>

            {item.description && (
              <p className={styles.description}>{item.description}</p>
            )}

            <div className={`${styles.availabilityBadge} ${item.is_available ? styles.avail : styles.unavail}`}>
              {item.is_available ? '✅ Available' : '❌ Out of Stock'}
            </div>

            {item.is_available && (
              <div className={styles.cartSection}>
                {/* Quantity selector */}
                <div className={styles.qtyRow}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                  >−</button>
                  <span className={styles.qtyVal}>{qty}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty((q) => q + 1)}
                  >+</button>
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1 }}
                  onClick={handleAddToCart}
                  disabled={adding}
                >
                  {adding ? 'Adding…' : `Add ${qty} to Cart — ₹${item.price * qty}`}
                </button>
              </div>
            )}

            <Link to="/menu" className={styles.backLink}>← Back to Menu</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;
