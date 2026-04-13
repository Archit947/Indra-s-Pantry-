import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPublicUpiQrSettings, placeOrder } from '../api/services';
import { useCart } from '../context/CartContext';
import styles from './UpiPaymentPage.module.css';

interface UpiState {
  notes?: string;
}

const DEFAULT_UPI_ID = 'architkore72-1@okicici';
const DEFAULT_CONTACT_NUMBER = '7507776361';
const DEFAULT_MERCHANT_NAME = "Indra's Pantry";

const isValidUpiVpa = (value: string): boolean =>
  /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(value.trim());

const UpiPaymentPage: React.FC = () => {
  const { cartItems, cartTotal, clearCart, loading: cartLoading } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as UpiState | null) ?? null;

  const [upiQr, setUpiQr] = useState<{ qr_image_url: string; upi_id?: string; merchant_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const configuredUpiId = (upiQr?.upi_id || '').trim();
  const resolvedUpiId = isValidUpiVpa(configuredUpiId) ? configuredUpiId : DEFAULT_UPI_ID;
  const resolvedMerchantName = upiQr?.merchant_name || DEFAULT_MERCHANT_NAME;
  const upiAmount = cartTotal.toFixed(2);
  const transactionRef = `indrapantry-${Date.now()}`;
  const upiQuery = `pa=${encodeURIComponent(resolvedUpiId)}&pn=${encodeURIComponent(
    resolvedMerchantName
  )}&am=${encodeURIComponent(upiAmount)}&cu=INR&tn=${encodeURIComponent(
    `Order payment - ${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}`
  )}&tr=${encodeURIComponent(transactionRef)}`;
  const upiPayUrl = `upi://pay?${upiQuery}`;

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
                <div className={styles.meta}>Merchant: {resolvedMerchantName}</div>
                <div className={styles.meta}>UPI ID: {resolvedUpiId}</div>
                {configuredUpiId && !isValidUpiVpa(configuredUpiId) && (
                  <div className={styles.meta}>
                    Configured UPI ID is invalid. Using default UPI ID for payment links.
                  </div>
                )}
                <div className={styles.meta}>Contact: {DEFAULT_CONTACT_NUMBER}</div>
                <div className={styles.payAppsWrap}>
                  <a className={`btn btn-outline ${styles.payAppBtn}`} href={upiPayUrl}>
                    Pay with GPay
                  </a>
                  <a className={`btn btn-outline ${styles.payAppBtn}`} href={upiPayUrl}>
                    Pay with PhonePe
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className={styles.missingQr}>UPI QR is not configured by admin yet.</div>
                <div className={styles.meta}>UPI ID: {resolvedUpiId}</div>
                <div className={styles.meta}>Contact: {DEFAULT_CONTACT_NUMBER}</div>
                <div className={styles.payAppsWrap}>
                  <a className={`btn btn-outline ${styles.payAppBtn}`} href={upiPayUrl}>
                    Pay with GPay
                  </a>
                  <a className={`btn btn-outline ${styles.payAppBtn}`} href={upiPayUrl}>
                    Pay with PhonePe
                  </a>
                </div>
              </>
            )}
          </div>

          <div className={`card ${styles.summaryCard}`}>
            <h2 className={styles.summaryTitle}>Order Total</h2>
            <div className={styles.amount}>₹{cartTotal}</div>
            <div className={styles.itemCount}>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</div>
            <div className={styles.inlineHint}>Tap GPay/PhonePe and pay ₹{upiAmount}</div>

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
