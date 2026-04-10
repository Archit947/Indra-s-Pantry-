import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { updateProfile } from '../api/services';
import { useAuth } from '../context/AuthContext';
import styles from './ProfilePage.module.css';

const ProfilePage: React.FC = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [name,    setName]    = useState(user?.name    ?? '');
  const [phone,   setPhone]   = useState(user?.phone   ?? '');
  const [saving,  setSaving]  = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const res = await updateProfile({ name: name.trim(), phone: phone.trim() || undefined });
      setUser(res.data.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="page-section">
      <div className="page-wrap" style={{ maxWidth: 640 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 28 }}>👤 My Profile</h1>

        {/* Avatar + name header */}
        <div className={`card ${styles.profileCard}`}>
          <div className={styles.avatar}>{initials}</div>
          <div>
            <div className={styles.profileName}>{user?.name}</div>
            <div className={styles.profileEmail}>{user?.email}</div>
            <div className={styles.joinedBadge}>Member since {joinedDate}</div>
          </div>
        </div>

        {/* Info / Edit form */}
        <div className={`card ${styles.section}`} style={{ marginTop: 16 }}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Personal Information</h2>
            {!editing && (
              <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={() => setEditing(true)}>
                ✏️ Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+91 XXXXX XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={user?.email ?? ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4, display: 'block' }}>
                  Email cannot be changed
                </span>
              </div>
              <div className={styles.editActions}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setEditing(false);
                    setName(user?.name ?? '');
                    setPhone(user?.phone ?? '');
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Full Name</span>
                <span className={styles.infoValue}>{user?.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{user?.email}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>{user?.phone || <em style={{ color: 'var(--gray-400)' }}>Not set</em>}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Account Status</span>
                <span className={`badge ${user?.is_active ? 'badge-completed' : 'badge-cancelled'}`}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className={`card ${styles.section}`} style={{ marginTop: 16 }}>
          <h2 className={styles.sectionTitle}>Quick Links</h2>
          <div className={styles.linkList}>
            <Link to="/orders" className={styles.linkItem}>
              <span>📦</span>
              <span>My Orders</span>
              <span className={styles.linkArrow}>→</span>
            </Link>
            <Link to="/menu" className={styles.linkItem}>
              <span>🍽️</span>
              <span>Browse Menu</span>
              <span className={styles.linkArrow}>→</span>
            </Link>
            <Link to="/cart" className={styles.linkItem}>
              <span>🛒</span>
              <span>View Cart</span>
              <span className={styles.linkArrow}>→</span>
            </Link>
          </div>
        </div>

        {/* Logout */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            className="btn"
            style={{
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: 10,
              padding: '10px 24px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={handleLogout}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
