import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const LoginPage       = lazy(() => import('./pages/LoginPage'));
const Dashboard       = lazy(() => import('./pages/Dashboard'));
const CategoryManager = lazy(() => import('./pages/CategoryManager'));
const ItemManager     = lazy(() => import('./pages/ItemManager'));
const OrderManager    = lazy(() => import('./pages/OrderManager'));
const UserList        = lazy(() => import('./pages/UserList'));
const PaymentSettings = lazy(() => import('./pages/PaymentSettings'));

const App: React.FC = () => (
  <Suspense fallback={<div className="loading-container"><div className="spinner" /></div>}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <Layout><CategoryManager /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/items"
        element={
          <ProtectedRoute>
            <Layout><ItemManager /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Layout><OrderManager /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout><UserList /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout><PaymentSettings /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
);

export default App;
