import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchOrders, updateOrderStatus } from '../api/services';
import { Order, OrderStatus } from '../types';
import styles from './OrderManager.module.css';

const ALL_STATUSES: OrderStatus[] = [
  'placed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled',
];
const FINAL_STATUSES: OrderStatus[] = ['completed', 'cancelled'];

const OrderManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchOrders(filter || undefined);
      setOrders(res.data.data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    if (selected && FINAL_STATUSES.includes(selected.status)) {
      toast.error('Finalized orders cannot be updated');
      return;
    }

    setUpdating(true);
    try {
      await updateOrderStatus(orderId, status);
      toast.success('Status updated');
      setSelected((prev) => (prev ? { ...prev, status } : null));
      load();
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (<div className="loading-container"><div className="spinner" /></div>);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{orders.length} orders</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${filter === '' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('')}
          >All</button>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(s)}
              style={{ textTransform: 'capitalize' }}
            >{s}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {orders.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            No orders found
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>#{o.id.slice(0, 8)}</span>
                  </td>
                  <td>
                    <div>{o.users?.name ?? 'Guest'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{o.users?.phone}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, color: '#334155', maxWidth: 250 }}>
                      {o.items.slice(0, 2).map((i) => i.name).join(', ')}
                      {o.items.length > 2 ? ` +${o.items.length - 2} more` : ''}
                    </div>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      {o.items.length} item{o.items.length !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td><strong>₹{o.total_amount}</strong></td>
                  <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => setSelected(o)}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Detail / Status Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order #{selected.id.slice(0, 8)}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Customer info */}
              <div className={styles.infoSection}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Customer</span>
                  <span>{selected.users?.name ?? 'Guest'} — {selected.users?.email}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Phone</span>
                  <span>{selected.users?.phone ?? '—'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Payment</span>
                  <span style={{ textTransform: 'capitalize' }}>{selected.payment_method.replace('_', ' ')}</span>
                </div>
                {selected.notes && (
                  <div className={styles.infoRow}>
                    <span className={styles.label}>Notes</span>
                    <span>{selected.notes}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <h3 style={{ fontWeight: 700, marginBottom: 10, marginTop: 16 }}>Items</h3>
              {selected.items.map((item) => (
                <div key={item.item_id} className={styles.orderItemRow}>
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className={styles.orderItemImg} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>Qty: {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 700 }}>₹{item.price * item.quantity}</div>
                </div>
              ))}

              <div className={styles.total}>
                Total: <strong>₹{selected.total_amount}</strong>
              </div>

              {/* Status updater */}
              <h3 style={{ fontWeight: 700, marginTop: 20, marginBottom: 10 }}>Update Status</h3>
              {FINAL_STATUSES.includes(selected.status) && (
                <p style={{ color: '#b91c1c', marginBottom: 10, fontSize: 13 }}>
                  This order is finalized, so its status can no longer be changed.
                </p>
              )}
              <div className={styles.statusBtns}>
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    className={`btn btn-sm ${selected.status === s ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handleStatusChange(selected.id, s)}
                    disabled={
                      updating
                      || selected.status === s
                      || FINAL_STATUSES.includes(selected.status)
                    }
                    style={{ textTransform: 'capitalize' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
