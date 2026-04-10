import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Sidebar.module.css';

const links = [
  { to: '/dashboard', label: 'Dashboard',   icon: '📊' },
  { to: '/categories', label: 'Categories', icon: '🗂️' },
  { to: '/items',      label: 'Items',      icon: '🍛' },
  { to: '/orders',     label: 'Orders',     icon: '📦' },
  { to: '/users',      label: 'Users',      icon: '👥' },
  { to: '/settings',   label: 'Payment',    icon: '💳' },
];

const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <span className={styles.brandIcon}>🍽️</span>
        <div>
          <span className={styles.brandName}>Indra's Pantry</span>
          <span className={styles.brandRole}>Admin Panel</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className={styles.nav}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            <span>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div className={styles.userName}>{user?.name}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
