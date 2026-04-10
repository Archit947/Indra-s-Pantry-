import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import styles from './CartPage.module.css';

const CartPage: React.FC = () => {
  const { cartItems, cartTotal, cartCount, updateQuantity, removeItem, loading } = useCart();
  const [removing, setRemoving] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRemove = async (id: string, name: string) => {
    setRemoving(id);
    try {
      await removeItem(id);
      toast.success(`${name} removed`);
    } catch {
      toast.error('Could not remove item');
    } finally {
      setRemoving(null);
    }
  };

  const handleQtyChange = async (id: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      await updateQuantity(id, newQty);
    } catch {
      toast.error('Could not update quantity');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  if (cartCount === 0) {
    return (
      <div className="empty-state" style={{ minHeight: '70vh' }}>
        <div className="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Looks like you haven't added anything yet.</p>
        <Link to="/menu" className="btn btn-primary" style={{ marginTop: 8 }}>
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="page-wrap">
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
          🛒 Your Cart <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 500 }}>({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
        </h1>

        {/* DEBUG: show raw cart JSON to help troubleshoot empty UI */}
        <div style={{ marginBottom: 12 }}>
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--gray-500)' }}>Show cart JSON (debug)</summary>
            <pre style={{ maxHeight: 220, overflow: 'auto', background: '#f8fafc', padding: 12, borderRadius: 8 }}>
              {JSON.stringify(cartItems, null, 2)}
            </pre>
          </details>
        </div>

        <div className={styles.layout}>
          {/* Cart items */}
          <div className={styles.itemsList}>
            {cartItems.map((ci) => (
              <div key={ci.id} className={`card ${styles.cartItem}`}>
                {/* Thumbnail */}
                {ci.items?.image_url ? (
                  <img src={ci.items.image_url} alt={ci.items.name} className={styles.thumb} />
                ) : (
                  <div className={styles.thumbPlaceholder}>🍛</div>
                )}

                {/* Info */}
                <div className={styles.info}>
                  <div className={styles.itemName}>{ci.items?.name}</div>
                  {ci.items?.categories?.name && (
                    <div className={styles.itemCat}>{ci.items.categories.name}</div>
                  )}
                  <div className={styles.unitPrice}>₹{ci.items?.price} each</div>
                </div>

                {/* Qty controls */}
                <div className={styles.qtyControls}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => handleQtyChange(ci.id, ci.quantity - 1)}
                    disabled={ci.quantity <= 1}
                  >−</button>
                  <span className={styles.qtyVal}>{ci.quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => handleQtyChange(ci.id, ci.quantity + 1)}
                  >+</button>
                </div>

                {/* Line total */}
                <div className={styles.lineTotal}>
                  ₹{(ci.items?.price ?? 0) * ci.quantity}
                </div>

                {/* Remove */}
                <button
                  className={styles.removeBtn}
                  onClick={() => handleRemove(ci.id, ci.items?.name ?? 'Item')}
                  disabled={removing === ci.id}
                  title="Remove"
                >
                  {removing === ci.id ? '…' : '✕'}
                </button>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className={`card ${styles.summary}`}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.summaryRows}>
              {cartItems.map((ci) => (
                <div key={ci.id} className={styles.summaryRow}>
                  <span>{ci.items?.name} × {ci.quantity}</span>
                  <span>₹{(ci.items?.price ?? 0) * ci.quantity}</span>
                </div>
              ))}
            </div>

            <div className="divider" />

            <div className={styles.totalRow}>
              <span>Total</span>
              <span className={styles.totalAmt}>₹{cartTotal}</span>
            </div>

            <div className={styles.payNote}>
              💵 Payment: Cash at Counter
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: 16, borderRadius: 12 }}
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout →
            </button>

            <Link to="/menu" className={styles.continueShopping}>
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
