import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { fetchItems, fetchCategories, createItem, updateItem, deleteItem } from '../api/services';
import { Item, Category } from '../types';
import styles from './ItemManager.module.css';

const ItemManager: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', price: '', category_id: '', is_available: true,
  });

  const load = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetchItems({ category_id: filterCat || undefined, search: search || undefined }),
        fetchCategories(),
      ]);
      setItems(itemsRes.data.data);
      setCategories(catsRes.data.data);
    } catch {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterCat, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', category_id: '', is_available: true });
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
    setShowModal(true);
  };

  const openEdit = (item: Item) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      category_id: item.category_id ?? '',
      is_available: item.is_available,
    });
    setImagePreview(item.image_url ?? null);
    if (fileRef.current) fileRef.current.value = '';
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('price', form.price);
    fd.append('category_id', form.category_id);
    fd.append('is_available', String(form.is_available));
    if (fileRef.current?.files?.[0]) {
      fd.append('image', fileRef.current.files[0]);
    }

    try {
      if (editing) {
        await updateItem(editing.id, fd);
        toast.success('Item updated');
      } else {
        await createItem(fd);
        toast.success('Item created');
      }
      setShowModal(false);
      load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await deleteItem(id);
      toast.success('Item deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) return (<div className="loading-container"><div className="spinner" /></div>);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Menu Items</h1>
          <p className="page-subtitle">{items.length} items shown</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Item</button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="🔍  Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.select}
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 12 }}>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 11H5m7-7v14" />
          </svg>
          No items found
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item.id} className={`card ${styles.itemCard}`}>
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className={styles.itemImg} />
              ) : (
                <div className={styles.itemImgPlaceholder}>🍛</div>
              )}
              <div className={styles.itemBody}>
                <div className={styles.itemName}>{item.name}</div>
                {item.categories && (
                  <div className={styles.itemCategory}>{item.categories.name}</div>
                )}
                <div className={styles.itemPrice}>₹{item.price}</div>
                <span className={`badge ${item.is_available ? 'badge-available' : 'badge-outofstock'}`}>
                  {item.is_available ? 'Available' : 'Out of Stock'}
                </span>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openEdit(item)}>Edit</button>
                  <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleDelete(item.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Item' : 'Add Item'}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {/* Image preview */}
                {imagePreview && (
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <img
                      src={imagePreview}
                      alt="preview"
                      style={{ height: 140, borderRadius: 10, objectFit: 'cover', maxWidth: '100%' }}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Masala Dosa"
                    required
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    >
                      <option value="">No Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the item…"
                  />
                </div>

                <div className="form-group">
                  <label>Availability</label>
                  <select
                    value={form.is_available ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, is_available: e.target.value === 'true' })}
                  >
                    <option value="true">Available</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Item Image</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    ref={fileRef}
                    onChange={handleImageChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemManager;
