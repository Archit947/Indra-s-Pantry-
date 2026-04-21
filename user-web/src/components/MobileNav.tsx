import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import styles from './MobileNav.module.css';

const MobileNav: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { cartCount } = useCart();

  return (
    <nav className={styles.mobileNav}>
      <NavLink to="/" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} end>
        <span className={styles.icon}>🏠</span>
        <span className={styles.label}>Home</span>
      </NavLink>
      <NavLink to="/menu" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
        <span className={styles.icon}>🔍</span>
        <span className={styles.label}>Search</span>
      </NavLink>
      <NavLink to="/cart" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
        <div style={{ position: 'relative' }}>
          <span className={styles.icon}>🛒</span>
          {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
        </div>
        <span className={styles.label}>Cart</span>
      </NavLink>
      <NavLink to={isAuthenticated ? "/profile" : "/login"} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
        <span className={styles.icon}>👤</span>
        <span className={styles.label}>{isAuthenticated ? "Profile" : "Login"}</span>
      </NavLink>
    </nav>
  );
};

export default MobileNav;