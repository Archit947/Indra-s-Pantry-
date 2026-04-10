import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../api/services';
import { Order } from '../types';
import styles from './OrdersPage.module.css';

const STATUS_LABEL: Record<string, string> = {
  pending:    'Pending',
  accepted:   'Accepted',
  preparing:  'Preparing',
  ready:      'Ready',
  completed:  'Completed',
  cancelled:  'Cancelled',
};

const OrdersPage: React.FC = () => {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders()
      .then((res) => setOrders(res.data.data ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-section">
      <div className="page-wrap">
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 28 }}>📦 My Orders</h1>

        {loading ? (
          <div className="spinner" />
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No orders yet</h3>
            <p>Head to the menu and place your first order!</p>
            <Link to="/menu" className="btn btn-primary" style={{ marginTop: 16 }}>
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className={styles.list}>
            {orders.map((order) => {
              const itemCount = Array.isArray(order.items) ? order.items.length : 0;
              const dateStr   = new Date(order.created_at).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
              });
              const timeStr = new Date(order.created_at).toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit',
              });

              return (
                <div key={order.id} className={`card ${styles.card}`}>
                  <div className={styles.cardTop}>
                    <div>
                      <div className={styles.orderId}>
                        Order #{order.id.slice(-8).toUpperCase()}
                      </div>
                      <div className={styles.dateTime}>
                        {dateStr} · {timeStr}
                      </div>
                    </div>
                    <span className={`badge badge-${order.status}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>

                  <div className={styles.cardMid}>
                    {Array.isArray(order.items) && order.items.slice(0, 3).map((item, idx) => (
                      <span key={idx} className={styles.itemChip}>
                        {item.name} × {item.quantity}
                      </span>
                    ))}
                    {itemCount > 3 && (
                      <span className={styles.itemChipMore}>+{itemCount - 3} more</span>
                    )}
                  </div>

                  <div className={styles.cardBottom}>
                    <span className={styles.total}>₹{order.total_amount}</span>
                    <Link to={`/orders/${order.id}`} className="btn btn-outline" style={{ fontSize: 13 }}>
                      View Details →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
