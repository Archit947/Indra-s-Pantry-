import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  changeAdminPassword,
  fetchPublicSiteBranding,
  fetchUpiQrSettings,
  saveSiteBranding,
  saveUpiQrSettings,
} from '../api/services';

const PaymentSettings: React.FC = () => {
  const [siteName, setSiteName] = useState("Indra's Pantry");
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  const [qrImageUrl, setQrImageUrl] = useState('');
  const [upiId, setUpiId] = useState('');
  const [merchantName, setMerchantName] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [savingBranding, setSavingBranding] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleQrFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setLogoFile(file);
    setLogoPreview(previewUrl);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [upiRes, brandingRes] = await Promise.all([
          fetchUpiQrSettings(),
          fetchPublicSiteBranding(),
        ]);

        const upiData = upiRes.data.data;
        if (upiData) {
          setQrImageUrl(upiData.qr_image_url || '');
          setUpiId(upiData.upi_id || '');
          setMerchantName(upiData.merchant_name || '');
        }

        const brandingData = brandingRes.data.data;
        setSiteName(brandingData.site_name || "Indra's Pantry");
        setLogoUrl(brandingData.logo_url || '');
        setLogoPreview(brandingData.logo_url || '');
      } catch {
        toast.error('Could not load settings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) {
      toast.error('Website name is required');
      return;
    }

    setSavingBranding(true);
    try {
      const body = new FormData();
      body.append('site_name', siteName.trim());
      if (logoFile) {
        body.append('logo', logoFile);
      } else {
        body.append('logo_url', logoUrl.trim());
      }

      const res = await saveSiteBranding(body);
      const updated = res.data.data;

      setSiteName(updated.site_name);
      setLogoUrl(updated.logo_url || '');
      setLogoPreview(updated.logo_url || '');
      setLogoFile(null);
      toast.success('Website branding updated');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to save website branding';
      toast.error(msg);
    } finally {
      setSavingBranding(false);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrImageUrl.trim()) {
      toast.error('QR image URL is required');
      return;
    }

    setSavingPayment(true);
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
      setSavingPayment(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await changeAdminPassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to change password';
      toast.error(msg);
    } finally {
      setSavingPassword(false);
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
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage website branding, admin security, and payment details.</p>
      </div>

      <div style={{ display: 'grid', gap: 20, maxWidth: 860 }}>
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>Website Branding</h2>
          <form onSubmit={handleSaveBranding}>
            <div className="form-group">
              <label>Website Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Website name"
                required
              />
            </div>

            <div className="form-group">
              <label>Upload Logo</label>
              <input type="file" accept="image/*" onChange={handleLogoFileSelect} />
            </div>

            <div className="form-group">
              <label>Or Logo URL</label>
              <input
                type="url"
                placeholder="https://.../logo.png"
                value={logoUrl}
                onChange={(e) => {
                  setLogoUrl(e.target.value);
                  setLogoFile(null);
                  setLogoPreview(e.target.value);
                }}
              />
            </div>

            {logoPreview ? (
              <div className="form-group">
                <label>Logo Preview</label>
                <img
                  src={logoPreview}
                  alt="Website logo preview"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 10,
                    objectFit: 'cover',
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    padding: 4,
                  }}
                />
              </div>
            ) : null}

            <button className="btn btn-primary" type="submit" disabled={savingBranding}>
              {savingBranding ? 'Saving...' : 'Save Branding'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>Admin Security</h2>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={savingPassword}>
              {savingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>Payment Settings</h2>
          <form onSubmit={handleSavePayment}>
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
              <input type="file" accept="image/*" onChange={handleQrFileSelect} />
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
                  placeholder={siteName}
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                />
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={savingPayment}>
              {savingPayment ? 'Saving...' : 'Save UPI QR'}
            </button>
          </form>

          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Preview</h3>
            {qrImageUrl ? (
              <img
                src={qrImageUrl}
                alt="UPI QR Preview"
                style={{
                  width: 220,
                  height: 220,
                  objectFit: 'contain',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: 8,
                  background: '#fff',
                }}
              />
            ) : (
              <p style={{ color: '#64748b' }}>Add a QR image URL to preview it here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettings;
