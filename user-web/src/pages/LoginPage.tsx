import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPublicSiteBranding, loginUser } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import styles from './AuthPage.module.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteName, setSiteName] = useState("Indra's Pantry");
  const [logoUrl, setLogoUrl] = useState('');
  const { login } = useAuth();
  const { loadCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  useEffect(() => {
    getPublicSiteBranding()
      .then((res) => {
        setSiteName(res.data.data.site_name || "Indra's Pantry");
        setLogoUrl(res.data.data.logo_url || '');
      })
      .catch(() => {
        // Keep defaults when branding is not configured.
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      const { user, token } = res.data.data;
      login(user, token);
      await loadCart();
      toast.success(`Welcome back, ${user.name}!`);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${siteName} logo`}
              className={styles.logo}
              style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }}
            />
          ) : (
            <div className={styles.logo}>🍽️</div>
          )}
          <h1 className={styles.title}>Welcome Back!</h1>
          <p className={styles.subtitle}>Sign in to your {siteName} account</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label>Email address</label>
            <input
              className="form-control"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              className="form-control"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ padding: '12px', fontSize: '15px', borderRadius: '10px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.switchText}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.switchLink}>Create one</Link>
        </p>

        <div className={styles.hint}>
          <p>Test: <strong>user@canteenhub.com</strong> / <strong>user123</strong></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
