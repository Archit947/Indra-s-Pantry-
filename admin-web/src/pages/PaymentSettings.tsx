import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchUpiQrSettings, saveUpiQrSettings } from '../api/services';

const PaymentSettings: React.FC = () => {
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [upiId, setUpiId] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setQrImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchUpiQrSettings();
        const data = res.data.data;
        if (data) {
          setQrImageUrl(data.qr_image_url || '');
          setUpiId(data.upi_id || '');
          setMerchantName(data.merchant_name || '');
        }
      } catch {
        toast.error('Could not load UPI QR settings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrImageUrl.trim()) {
      toast.error('QR image URL is required');
      return;
    }

    setSaving(true);
    try {
      await saveUpiQrSettings({
        qr_image_url: qrImageUrl.trim(),
        upi_id: upiId.trim() || undefined,
        merchant_name: merchantName.trim() || undefined,
      });
      toast.success('UPI QR updated');
    } catch {
      toast.error('Failed to save UPI QR');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Payment Settings</h1>
        <p className="page-subtitle">Configure UPI QR shown on checkout page.</p>
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>UPI QR Image URL</label>
            <input
              type="url"
              placeholder="https://.../upi-qr.png"
              value={qrImageUrl}
              onChange={(e) => setQrImageUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Or Upload QR Image</label>
            <input type="file" accept="image/*" onChange={handleFileSelect} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>UPI ID (optional)</label>
              <input
                type="text"
                placeholder="canteen@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Merchant Name (optional)</label>
              <input
                type="text"
                placeholder="Indra's Pantry"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save UPI QR'}
          </button>
        </form>

        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Preview</h3>
          {qrImageUrl ? (
            <img
              src={qrImageUrl}
              alt="UPI QR Preview"
              style={{ width: 220, height: 220, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 10, padding: 8, background: '#fff' }}
            />
          ) : (
            <p style={{ color: '#64748b' }}>Add a QR image URL to preview it here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSettings;
