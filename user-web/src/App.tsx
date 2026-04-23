import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import CheckoutBar from './components/CheckoutBar';

const HomePage       = lazy(() => import('./pages/HomePage'));
const MenuPage       = lazy(() => import('./pages/MenuPage'));
const ItemDetailPage = lazy(() => import('./pages/ItemDetailPage'));
const CartPage       = lazy(() => import('./pages/CartPage'));
const CheckoutPage   = lazy(() => import('./pages/CheckoutPage'));
const UpiPaymentPage = lazy(() => import('./pages/UpiPaymentPage'));
const OrdersPage     = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage= lazy(() => import('./pages/OrderDetailPage'));
const ProfilePage    = lazy(() => import('./pages/ProfilePage'));
const LoginPage      = lazy(() => import('./pages/LoginPage'));
const RegisterPage   = lazy(() => import('./pages/RegisterPage'));

const Spinner: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
    <div className="spinner" />
  </div>
);

const App: React.FC = () => {
  return (
    <>
      <Navbar />
      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* Public routes */}
          <Route path="/"          element={<HomePage />} />
          <Route path="/menu"      element={<MenuPage />} />
          <Route path="/item/:id"  element={<ItemDetailPage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/register"  element={<RegisterPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/cart"            element={<CartPage />} />
            <Route path="/checkout"        element={<CheckoutPage />} />
            <Route path="/checkout/upi"    element={<UpiPaymentPage />} />
            <Route path="/orders"          element={<OrdersPage />} />
            <Route path="/orders/:id"      element={<OrderDetailPage />} />
            <Route path="/profile"         element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <CheckoutBar />
      <MobileNav />
    </>
  );
};

export default App;
