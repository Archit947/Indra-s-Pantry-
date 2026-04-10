import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPublicUpiQrSettings, placeOrder } from '../api/services';
import { useCart } from '../context/CartContext';
import styles from './UpiPaymentPage.module.css';

interface UpiState {
  notes?: string;
}

const UpiPaymentPage: React.FC = () => {
  const { cartItems, cartTotal, clearCart, loading: cartLoading } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as UpiState | null) ?? null;

  const [upiQr, setUpiQr] = useState<{ qr_image_url: string; upi_id?: string; merchant_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!cartLoading && cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    if (cartLoading) return;

    getPublicUpiQrSettings()
      .then((res) => setUpiQr(res.data.data))
      .catch(() => setUpiQr(null))
      .finally(() => setLoading(false));
  }, [cartLoading, cartItems.length, navigate]);

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const res = await placeOrder({ payment_method: 'upi', notes: state?.notes });
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

  if (cartLoading || loading) {
    return <div className="loading-center"><div className="spinner" /></div>;
  }

  return (
    <div className="page-section">
      <div className="page-wrap">
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>UPI Payment</h1>
            <p className={styles.subtitle}>Scan this QR with any UPI app and then place your order.</p>
          </div>
          <Link to="/checkout" className="btn btn-outline btn-sm">Back to Checkout</Link>
        </div>

        <div className={styles.layout}>
          <div className={`card ${styles.qrCard}`}>
            {upiQr?.qr_image_url ? (
              <>
                <img src={upiQr.qr_image_url} alt="UPI QR" className={styles.bigQr} />
                {upiQr.merchant_name && <div className={styles.meta}>Merchant: {upiQr.merchant_name}</div>}
                {upiQr.upi_id && <div className={styles.meta}>UPI ID: {upiQr.upi_id}</div>}
              </>
            ) : (
              <div className={styles.missingQr}>UPI QR is not configured by admin yet.</div>
            )}
          </div>

          <div className={`card ${styles.summaryCard}`}>
            <h2 className={styles.summaryTitle}>Order Total</h2>
            <div className={styles.amount}>₹{cartTotal}</div>
            <div className={styles.itemCount}>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</div>

            <button
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: 18, borderRadius: 12 }}
              onClick={handlePlaceOrder}
              disabled={placing || !upiQr?.qr_image_url}
            >
              {placing ? 'Placing Order…' : `I Have Paid, Place Order — ₹${cartTotal}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpiPaymentPage;
