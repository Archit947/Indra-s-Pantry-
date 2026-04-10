import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchUsers, toggleUserStatus } from '../api/services';
import { User } from '../types';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const res = await fetchUsers();
      setUsers(res.data.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleUserStatus(id, !current);
      toast.success(current ? 'User deactivated' : 'User activated');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (<div className="loading-container"><div className="spinner" /></div>);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{users.length} registered users</p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          style={{
            padding: '10px 14px',
            border: '1.5px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 14,
            fontFamily: 'inherit',
            width: '100%',
            maxWidth: 360,
          }}
          placeholder="🔍  Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">No users found</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: '#fff7ed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 14, color: '#f97316',
                        }}
                      >
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <strong>{u.name}</strong>
                    </div>
                  </td>
                  <td style={{ color: '#64748b' }}>{u.email}</td>
                  <td style={{ color: '#64748b' }}>{u.phone ?? '—'}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-available' : 'badge-outofstock'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-outline'}`}
                      onClick={() => handleToggle(u.id, u.is_active)}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserList;
