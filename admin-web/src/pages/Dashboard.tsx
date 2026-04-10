import React, { useEffect, useState } from 'react';
import { fetchOrderStats, fetchOrders, fetchItems, fetchUsers } from '../api/services';
import { OrderStats, Order } from '../types';
import styles from './Dashboard.module.css';

const statuses = ['placed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'] as const;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchOrderStats(),
      fetchOrders(),
      fetchItems(),
      fetchUsers(),
    ])
      .then(([statsRes, ordersRes, itemsRes, usersRes]) => {
        setStats(statsRes.data.data);
        setRecentOrders(ordersRes.data.data.slice(0, 6));
        setItemCount(itemsRes.data.data.length);
        setUserCount(usersRes.data.data.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={`card ${styles.kpiCard}`}>
          <div className={styles.kpiIcon} style={{ background: '#fff7ed' }}>📦</div>
          <div className={styles.kpiValue}>{stats?.total ?? 0}</div>
          <div className={styles.kpiLabel}>Total Orders</div>
        </div>
        <div className={`card ${styles.kpiCard}`}>
          <div className={styles.kpiIcon} style={{ background: '#dcfce7' }}>💰</div>
          <div className={styles.kpiValue}>₹{stats?.totalRevenue?.toFixed(0) ?? 0}</div>
          <div className={styles.kpiLabel}>Total Revenue</div>
        </div>
        <div className={`card ${styles.kpiCard}`}>
          <div className={styles.kpiIcon} style={{ background: '#dbeafe' }}>🍛</div>
          <div className={styles.kpiValue}>{itemCount}</div>
          <div className={styles.kpiLabel}>Menu Items</div>
        </div>
        <div className={`card ${styles.kpiCard}`}>
          <div className={styles.kpiIcon} style={{ background: '#ede9fe' }}>👥</div>
          <div className={styles.kpiValue}>{userCount}</div>
          <div className={styles.kpiLabel}>Registered Users</div>
        </div>
      </div>

      {/* Order Status Summary */}
      <div className={`card ${styles.statusCard}`}>
        <h2 className={styles.sectionTitle}>Order Status Breakdown</h2>
        <div className={styles.statusGrid}>
          {statuses.map((s) => (
            <div key={s} className={styles.statusBox}>
              <span className={`badge badge-${s}`}>{s}</span>
              <span className={styles.statusCount}>{stats?.[s] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card" style={{ marginTop: 24 }}>
        <h2 className={styles.sectionTitle} style={{ marginBottom: 16 }}>
          Recent Orders
        </h2>
        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            No orders yet
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      #{o.id.slice(0, 8)}
                    </span>
                  </td>
                  <td>{o.users?.name ?? 'Guest'}</td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>
                    {o.items.slice(0, 2).map((i) => i.name).join(', ')}
                    {o.items.length > 2 ? ` +${o.items.length - 2} more` : ''}
                  </td>
                  <td><strong>₹{o.total_amount}</strong></td>
                  <td>
                    <span className={`badge badge-${o.status}`}>{o.status}</span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
