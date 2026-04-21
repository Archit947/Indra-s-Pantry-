import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api/services';
import { Category } from '../types';

interface CategoryFormState {
  name: string;
  description: string;
  is_active: boolean;
  image_url: string;
}

const initialFormState: CategoryFormState = {
  name: '',
  description: '',
  is_active: true,
  image_url: '',
};

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(initialFormState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetchCategories();
      setCategories(res.data.data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialFormState);
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description ?? '',
      is_active: cat.is_active,
      image_url: cat.image_url ?? '',
    });
    setImageFile(null);
    setImagePreview(cat.image_url ?? '');
    setShowModal(true);
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(previewUrl);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = new FormData();
    payload.append('name', form.name);
    payload.append('description', form.description);
    payload.append('is_active', String(form.is_active));
    if (imageFile) {
      payload.append('image', imageFile);
    } else {
      payload.append('image_url', form.image_url.trim());
    }

    try {
      if (editing) {
        await updateCategory(editing.id, payload);
        toast.success('Category updated');
      } else {
        await createCategory(payload);
        toast.success('Category created');
      }
      setShowModal(false);
      setImageFile(null);
      setImagePreview('');
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Items in this category will become uncategorized.')) return;
    try {
      await deleteCategory(id);
      toast.success('Category deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) return (<div className="loading-container"><div className="spinner" /></div>);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">{categories.length} categories total</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Category</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {categories.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            No categories yet - add one above
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td style={{ width: 86 }}>
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 8,
                          objectFit: 'cover',
                          border: '1px solid #e2e8f0',
                        }}
                      />
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>No image</span>
                    )}
                  </td>
                  <td><strong>{cat.name}</strong></td>
                  <td style={{ color: '#64748b' }}>{cat.description ?? '-'}</td>
                  <td>
                    <span className={`badge ${cat.is_active ? 'badge-available' : 'badge-outofstock'}`}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ color: '#64748b', fontSize: 13 }}>
                    {new Date(cat.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(cat)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cat.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Category' : 'New Category'}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>x</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Breakfast"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Short description..."
                  />
                </div>
                <div className="form-group">
                  <label>Category Thumbnail</label>
                  <input type="file" accept="image/*" onChange={handleThumbnailUpload} />
                </div>
                <div className="form-group">
                  <label>Or use image URL</label>
                  <input
                    type="url"
                    placeholder="https://.../thumbnail.png"
                    value={form.image_url}
                    onChange={(e) => {
                      setForm({ ...form, image_url: e.target.value });
                      if (!imageFile) setImagePreview(e.target.value);
                    }}
                  />
                </div>
                {imagePreview ? (
                  <div className="form-group">
                    <label>Preview</label>
                    <img
                      src={imagePreview}
                      alt="Thumbnail preview"
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                      }}
                    />
                  </div>
                ) : null}
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={form.is_active ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
