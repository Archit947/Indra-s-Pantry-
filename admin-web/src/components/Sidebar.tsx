import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchPublicSiteBranding } from '../api/services';
import styles from './Sidebar.module.css';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/categories', label: 'Categories', icon: '🗂️' },
  { to: '/items', label: 'Items', icon: '🍛' },
  { to: '/orders', label: 'Orders', icon: '📦' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [siteName, setSiteName] = useState("Indra's Pantry");
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    fetchPublicSiteBranding()
      .then((res) => {
        setSiteName(res.data.data.site_name || "Indra's Pantry");
        setLogoUrl(res.data.data.logo_url || '');
      })
      .catch(() => {
        // Keep defaults when branding is not configured.
      });
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        {logoUrl ? (
          <img src={logoUrl} alt={`${siteName} logo`} className={styles.brandLogo} />
        ) : (
          <span className={styles.brandIcon}>🍽️</span>
        )}
        <div>
          <span className={styles.brandName}>{siteName}</span>
          <span className={styles.brandRole}>Admin Panel</span>
        </div>
      </div>

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
