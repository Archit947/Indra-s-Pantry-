import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { placeOrder } from '../api/services';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import styles from './CheckoutPage.module.css';

const CheckoutPage: React.FC = () => {
  const { cartItems, cartTotal, clearCart, loading } = useCart();
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [notes, setNotes]   = useState('');
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash_at_pickup'>('upi');

  useEffect(() => {
    if (!loading && cartItems.length === 0) {
      navigate('/cart');
    }
  }, [loading, cartItems.length, navigate]);

  if (loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  if (cartItems.length === 0) {
    return null;
  }

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'upi') {
      navigate('/checkout/upi', { state: { notes } });
      return;
    }

    setPlacing(true);
    try {
      const res = await placeOrder({ payment_method: 'cash_at_pickup', notes });
      const order = res.data.data;
      await clearCart();
      toast.success('Order placed successfully! 🎉');
      navigate(`/orders/${order.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not place order';
      toast.error(msg);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="page-section">
      <div className="page-wrap">
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 28 }}>✅ Checkout</h1>

        <div className={styles.layout}>
          {/* Left: review items */}
          <div>
            <div className={`card ${styles.section}`}>
              <h2 className={styles.sectionTitle}>📋 Order Review</h2>
              {cartItems.map((ci) => (
                <div key={ci.id} className={styles.lineItem}>
                  {ci.items?.image_url && (
                    <img src={ci.items.image_url} alt={ci.items.name} className={styles.lineImg} />
                  )}
                  <div className={styles.lineInfo}>
                    <span className={styles.lineName}>{ci.items?.name}</span>
                    <span className={styles.lineQty}>× {ci.quantity}</span>
                  </div>
                  <span className={styles.lineAmt}>₹{(ci.items?.price ?? 0) * ci.quantity}</span>
                </div>
              ))}
            </div>

            <div className={`card ${styles.section}`} style={{ marginTop: 16 }}>
              <h2 className={styles.sectionTitle}>📝 Special Instructions (optional)</h2>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Any special requests? e.g. 'Less spicy', 'No onions'…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Right: summary */}
          <div className={`card ${styles.summary}`}>
            <h2 className={styles.sectionTitle}>🧾 Bill Summary</h2>

            <div className={styles.infoRow}>
              <span>Customer</span>
              <span>{user?.name}</span>
            </div>
            <div className={styles.infoRow}>
              <span>Phone</span>
              <span>{user?.phone ?? 'Not set'}</span>
            </div>

            <div className="divider" />

            {cartItems.map((ci) => (
              <div key={ci.id} className={styles.summaryItem}>
                <span className={styles.summaryItemName}>{ci.items?.name} × {ci.quantity}</span>
                <span>₹{(ci.items?.price ?? 0) * ci.quantity}</span>
              </div>
            ))}

            <div className="divider" />

            <div className={styles.totalRow}>
              <span>Total Amount</span>
              <span className={styles.totalAmt}>₹{cartTotal}</span>
            </div>

            <div className={styles.paymentSection}>
              <div className={styles.paymentTitle}>Select Payment Method</div>

              <label className={styles.paymentOption}>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                />
                <div>
                  <div className={styles.payTitle}>UPI (Recommended)</div>
                  <div className={styles.payDesc}>Go to next page and scan big QR</div>
                </div>
              </label>

              <label className={styles.paymentOption}>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'cash_at_pickup'}
                  onChange={() => setPaymentMethod('cash_at_pickup')}
                />
                <div>
                  <div className={styles.payTitle}>Cash at Counter</div>
                  <div className={styles.payDesc}>Pay when you pick up your order</div>
                </div>
              </label>
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: 20, borderRadius: 12 }}
              onClick={handlePlaceOrder}
              disabled={placing}
            >
              {placing ? 'Placing Order…' : paymentMethod === 'upi' ? `Continue to UPI — ₹${cartTotal}` : `Place Order — ₹${cartTotal}`}
            </button>

            <p className={styles.disclaimer}>
              By placing the order you agree to pay at the counter on pickup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
