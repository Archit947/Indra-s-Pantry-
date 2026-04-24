import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import styles from './CartPage.module.css';

const CartPage: React.FC = () => {
  const { cartItems, cartTotal, cartCount, updateQuantity, removeItem, loading } = useCart();
  const [removing, setRemoving] = useState<string | null>(null);
  const navigate = useNavigate();

  const cartIssues = cartItems
    .map((ci) => {
      const item = ci.items;
      if (!item) {
        return { id: ci.id, message: 'This item is no longer available.' };
      }
      if (!item.is_available) {
        return { id: ci.id, message: `${item.name} is not available right now.` };
      }
      if (item.stock <= 0) {
        return { id: ci.id, message: `${item.name} is out of stock.` };
      }
      if (ci.quantity > item.stock) {
        return { id: ci.id, message: `Only ${item.stock} left for ${item.name}.` };
      }
      return null;
    })
    .filter((issue): issue is { id: string; message: string } => issue !== null);

  const hasCartIssues = cartIssues.length > 0;

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
        <div className="empty-icon">Cart</div>
        <h3>Your cart is empty</h3>
        <p>Looks like you have not added anything yet.</p>
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
          Your Cart <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 500 }}>({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
        </h1>

        <div className={styles.layout}>
          <div className={styles.itemsList}>
            {cartItems.map((ci) => {
              const item = ci.items;
              const canOrder = Boolean(item?.is_available) && (item?.stock ?? 0) > 0;
              const limitReached = canOrder && ci.quantity >= (item?.stock ?? 0);
              const lineIssue = cartIssues.find((issue) => issue.id === ci.id)?.message;

              return (
                <div key={ci.id} className={`card ${styles.cartItem}`}>
                  {item?.image_url ? (
                    <img src={item.image_url} alt={item.name} className={styles.thumb} />
                  ) : (
                    <div className={styles.thumbPlaceholder}>Item</div>
                  )}

                  <div className={styles.info}>
                    <div className={styles.itemName}>{item?.name}</div>
                    {item?.categories?.name && (
                      <div className={styles.itemCat}>{item.categories.name}</div>
                    )}
                    <div className={styles.unitPrice}>Rs {item?.price} each</div>
                    {item && <div className={styles.itemCat}>Stock: {item.stock}</div>}
                    {lineIssue && (
                      <div style={{ color: '#b91c1c', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                        {lineIssue}
                      </div>
                    )}
                  </div>

                  <div className={styles.qtyControls}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => handleQtyChange(ci.id, ci.quantity - 1)}
                      disabled={ci.quantity <= 1}
                    >
                      -
                    </button>
                    <span className={styles.qtyVal}>{ci.quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => handleQtyChange(ci.id, ci.quantity + 1)}
                      disabled={!canOrder || limitReached}
                    >
                      +
                    </button>
                  </div>

                  <div className={styles.lineTotal}>
                    Rs {(item?.price ?? 0) * ci.quantity}
                  </div>

                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemove(ci.id, item?.name ?? 'Item')}
                    disabled={removing === ci.id}
                    title="Remove"
                  >
                    {removing === ci.id ? '...' : 'X'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className={`card ${styles.summary}`}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.summaryRows}>
              {cartItems.map((ci) => (
                <div key={ci.id} className={styles.summaryRow}>
                  <span>{ci.items?.name} x {ci.quantity}</span>
                  <span>Rs {(ci.items?.price ?? 0) * ci.quantity}</span>
                </div>
              ))}
            </div>

            <div className="divider" />

            <div className={styles.totalRow}>
              <span>Total</span>
              <span className={styles.totalAmt}>Rs {cartTotal}</span>
            </div>

            <div className={styles.payNote}>
              Payment: Cash at Counter
            </div>

            {hasCartIssues && (
              <div style={{ marginTop: 12, color: '#b91c1c', fontSize: 13, lineHeight: 1.5 }}>
                Please fix the stock issues in your cart before checkout.
              </div>
            )}

            <button
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: 16, borderRadius: 12 }}
              onClick={() => navigate('/checkout')}
              disabled={hasCartIssues}
            >
              Proceed to Checkout
            </button>

            <Link to="/menu" className={styles.continueShopping}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
