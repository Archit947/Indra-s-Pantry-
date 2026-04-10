import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../api/services';
import { Order } from '../types';
import styles from './OrderDetailPage.module.css';

const STEPS = ['pending', 'accepted', 'preparing', 'ready', 'completed'] as const;
const STEP_LABELS: Record<string, string> = {
  pending:   '🕐 Placed',
  accepted:  '✅ Accepted',
  preparing: '👨‍🍳 Preparing',
  ready:     '🔔 Ready',
  completed: '🎉 Completed',
};
const STEP_DESC: Record<string, string> = {
  pending:   'Your order was received',
  accepted:  'Canteen confirmed your order',
  preparing: 'Your food is being cooked',
  ready:     'Pick up at the counter',
  completed: 'Enjoy your meal!',
};

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pending',
  accepted:  'Accepted',
  preparing: 'Preparing',
  ready:     'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order,   setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!id) return;
    getOrderById(id)
      .then((res) => setOrder(res.data.data))
      .catch(() => setError('Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />;
  if (error || !order)
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <div className="empty-icon">⚠️</div>
        <h3>{error || 'Order not found'}</h3>
        <Link to="/orders" className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Orders
        </Link>
      </div>
    );

  const currentStepIdx = STEPS.indexOf(order.status as typeof STEPS[number]);
  const isCancelled    = order.status === 'cancelled';

  const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
  const timeStr = new Date(order.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="page-section">
      <div className="page-wrap" style={{ maxWidth: 720 }}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <Link to="/orders" className={styles.back}>← My Orders</Link>
            <h1 className={styles.title}>
              Order #{order.id.slice(-8).toUpperCase()}
            </h1>
            <p className={styles.date}>{dateStr} at {timeStr}</p>
          </div>
          <span className={`badge badge-${order.status}`} style={{ fontSize: 14, padding: '6px 14px' }}>
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>

        {/* Progress tracker */}
        {!isCancelled && (
          <div className={`card ${styles.tracker}`}>
            <h2 className={styles.sectionTitle}>Order Progress</h2>
            <div className={styles.steps}>
              {STEPS.map((step, idx) => {
                const done    = idx <  currentStepIdx;
                const active  = idx === currentStepIdx;
                return (
                  <React.Fragment key={step}>
                    <div className={`${styles.step} ${done ? styles.done : ''} ${active ? styles.active : ''}`}>
                      <div className={styles.stepDot} />
                      <div className={styles.stepLabel}>{STEP_LABELS[step]}</div>
                      {active && <div className={styles.stepDesc}>{STEP_DESC[step]}</div>}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`${styles.line} ${done ? styles.lineDone : ''}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className={`card ${styles.cancelBox}`}>
            <span style={{ fontSize: 28 }}>❌</span>
            <div>
              <div style={{ fontWeight: 700, color: '#dc2626' }}>Order Cancelled</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                This order has been cancelled. Please place a new order.
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        <div className={`card ${styles.section}`}>
          <h2 className={styles.sectionTitle}>Items Ordered</h2>
          {Array.isArray(order.items) && order.items.map((item, idx) => (
            <div key={idx} className={styles.item}>
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className={styles.itemImg} />
              )}
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                {item.category_name && (
                  <span className={styles.itemCat}>{item.category_name}</span>
                )}
              </div>
              <div className={styles.itemRight}>
                <span className={styles.itemQty}>× {item.quantity}</span>
                <span className={styles.itemPrice}>₹{item.price * item.quantity}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bill + Info */}
        <div className={`card ${styles.section}`} style={{ marginTop: 16 }}>
          <h2 className={styles.sectionTitle}>Bill Details</h2>

          {Array.isArray(order.items) && order.items.map((item, idx) => (
            <div key={idx} className={styles.billRow}>
              <span>{item.name} × {item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}

          <div className={styles.billDivider} />

          <div className={styles.billTotal}>
            <span>Total</span>
            <span className={styles.billTotalAmt}>₹{order.total_amount}</span>
          </div>

          <div className={styles.billDivider} />

          <div className={styles.billRow}>
            <span>Payment Method</span>
            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
              {order.payment_method?.replace(/_/g, ' ')}
            </span>
          </div>

          {order.notes && (
            <div className={styles.notes}>
              <span style={{ fontWeight: 600 }}>📝 Notes:</span> {order.notes}
            </div>
          )}
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <Link to="/orders" className="btn btn-outline">← All Orders</Link>
          <Link to="/menu"   className="btn btn-primary">Order Again</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
