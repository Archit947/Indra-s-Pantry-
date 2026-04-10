import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className={styles.navbar}>
      <div className={`page-wrap ${styles.inner}`}>
        {/* Brand */}
        <Link to="/" className={styles.brand}>
          <span className={styles.brandIcon}>🍽️</span>
          <span className={styles.brandName}>Indra's Pantry</span>
        </Link>

        {/* Desktop nav links */}
        <nav className={styles.links}>
          <NavLink to="/"      className={({ isActive }) => `${styles.link} ${isActive ? styles.activeLink : ''}`} end>Home</NavLink>
          <NavLink to="/menu"  className={({ isActive }) => `${styles.link} ${isActive ? styles.activeLink : ''}`}>Menu</NavLink>
          {isAuthenticated && (
            <NavLink to="/orders" className={({ isActive }) => `${styles.link} ${isActive ? styles.activeLink : ''}`}>My Orders</NavLink>
          )}
        </nav>

        {/* Right actions */}
        <div className={styles.actions}>
          {/* Cart */}
          {isAuthenticated && (
            <Link to="/cart" className={styles.cartBtn}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
            </Link>
          )}

          {/* User dropdown / login */}
          {isAuthenticated ? (
            <div className={styles.userMenu} ref={menuRef}>
              <button className={styles.avatarBtn} onClick={() => setMenuOpen(!menuOpen)}>
                <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
                <span className={styles.userName}>{user?.name}</span>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className={styles.dropdown}>
                  <Link to="/profile" className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                    👤 Profile
                  </Link>
                  <Link to="/orders" className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                    📦 My Orders
                  </Link>
                  <div className={styles.dropDivider} />
                  <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login"    className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
