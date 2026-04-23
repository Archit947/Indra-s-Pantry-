import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import styles from './CheckoutBar.module.css';

const CheckoutBar: React.FC = () => {
  const { cartCount } = useCart();
  const { pathname } = useLocation();

  if (cartCount === 0) return null;
  if (pathname === '/cart' || pathname.startsWith('/checkout')) return null;

  return (
    <div className={styles.wrap}>
      <Link to="/checkout" className={`btn btn-primary ${styles.checkoutBtn}`}>
        Checkout
      </Link>
    </div>
  );
};

export default CheckoutBar;
