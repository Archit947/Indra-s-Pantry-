import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchPublicSiteBranding, loginAdmin } from '../api/services';
import { useAuth } from '../context/AuthContext';
import styles from './LoginPage.module.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteName, setSiteName] = useState("Indra's Pantry");
  const [logoUrl, setLogoUrl] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublicSiteBranding()
      .then((res) => {
        setSiteName(res.data.data.site_name || "Indra's Pantry");
        setLogoUrl(res.data.data.logo_url || '');
      })
      .catch(() => {
        // Keep defaults when settings are not yet configured.
      });
  }, []);

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginAdmin({ email, password });
      const { user, token } = res.data.data;

      if (user.role !== 'admin') {
        toast.error('Access denied: admin accounts only');
        return;
      }

      login(user, token);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Login failed';
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
              style={{ width: 58, height: 58, objectFit: 'cover', borderRadius: 12 }}
            />
          ) : (
            <div className={styles.logo}>🍽️</div>
          )}
          <h1 className={styles.title}>{siteName}</h1>
          <p className={styles.subtitle}>Admin Dashboard - Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              placeholder="admin@canteenhub.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.hint}>
          Test credentials: <strong>admin@canteenhub.com</strong> / <strong>admin123</strong>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
