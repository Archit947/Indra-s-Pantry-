import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getPublicSiteBranding, registerUser } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import styles from './AuthPage.module.css';

const RegisterPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [siteName, setSiteName] = useState("Indra's Pantry");
  const [logoUrl, setLogoUrl] = useState('');
  const { login } = useAuth();
  const { loadCart } = useCart();
  const navigate = useNavigate();

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

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      const { user, token } = res.data.data;
      login(user, token);
      await loadCart();
      toast.success(`Account created! Welcome, ${user.name}`);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Registration failed';
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
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join {siteName} and order your favourite food</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label>Full Name *</label>
            <input className="form-control" placeholder="Your name" value={form.name} onChange={set('name')} required />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input className="form-control" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>

          <div className="form-group">
            <label>Phone (optional)</label>
            <input className="form-control" type="tel" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Password *</label>
              <input className="form-control" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <input className="form-control" type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} required minLength={6} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ padding: '12px', fontSize: '15px', borderRadius: '10px' }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.switchLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
