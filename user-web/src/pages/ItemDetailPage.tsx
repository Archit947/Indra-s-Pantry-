import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchItemById } from '../api/services';
import { Item } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import styles from './ItemDetailPage.module.css';

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const { addItem, cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    fetchItemById(id)
      .then((r) => setItem(r.data.data))
      .catch(() => toast.error('Item not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const cartQuantity = item
    ? cartItems.find((ci) => ci.item_id === item.id)?.quantity ?? 0
    : 0;

  const canOrder = Boolean(item?.is_available) && (item?.stock ?? 0) > 0;
  const remainingToAdd = Math.max(0, (item?.stock ?? 0) - cartQuantity);

  useEffect(() => {
    if (remainingToAdd === 0) {
      setQty(1);
      return;
    }

    setQty((current) => Math.min(Math.max(current, 1), remainingToAdd));
  }, [remainingToAdd]);

  const handleAddToCart = async () => {
    if (!item || !canOrder || remainingToAdd < 1) return;
    if (!isAuthenticated) { navigate('/login'); return; }

    setAdding(true);
    try {
      await addItem(item.id, qty);
      toast.success(`${item.name} x ${qty} added to cart`);
    } catch {
      toast.error('Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!item) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-icon">?</div>
        <h3>Item not found</h3>
        <Link to="/menu" className="btn btn-primary" style={{ marginTop: 8 }}>Back to Menu</Link>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="page-wrap">
        <div className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <span>&gt;</span>
          <Link to="/menu">Menu</Link>
          <span>&gt;</span>
          <span>{item.name}</span>
        </div>

        <div className={styles.layout}>
          <div className={styles.imageWrap}>
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className={styles.image} />
            ) : (
              <div className={styles.imagePlaceholder}>Item</div>
            )}
          </div>

          <div className={styles.details}>
            {item.categories && (
              <Link to={`/menu?category=${item.category_id}`} className={styles.catTag}>
                {item.categories.name}
              </Link>
            )}

            <h1 className={styles.name}>{item.name}</h1>
            <div className={styles.price}>Rs {item.price}</div>

            {item.description && (
              <p className={styles.description}>{item.description}</p>
            )}

            <div className={`${styles.availabilityBadge} ${canOrder ? styles.avail : styles.unavail}`}>
              {canOrder ? 'Available' : 'Out of Stock'}
            </div>

            <div className={styles.stockInfo}>
              <span>Stock available: {item.stock}</span>
              {cartQuantity > 0 && <span>Already in your cart: {cartQuantity}</span>}
            </div>

            {canOrder && remainingToAdd > 0 ? (
              <div className={styles.cartSection}>
                <div className={styles.qtyRow}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty((current) => Math.max(1, current - 1))}
                    disabled={qty <= 1}
                  >
                    -
                  </button>
                  <span className={styles.qtyVal}>{qty}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty((current) => Math.min(remainingToAdd, current + 1))}
                    disabled={qty >= remainingToAdd}
                  >
                    +
                  </button>
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1 }}
                  onClick={handleAddToCart}
                  disabled={adding}
                >
                  {adding ? 'Adding...' : `Add ${qty} to Cart - Rs ${item.price * qty}`}
                </button>
              </div>
            ) : (
              <p className={styles.stockMessage}>
                {canOrder
                  ? 'You already have the maximum available stock in your cart.'
                  : 'This item cannot be ordered right now.'}
              </p>
            )}

            <Link to="/menu" className={styles.backLink}>Back to Menu</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;
