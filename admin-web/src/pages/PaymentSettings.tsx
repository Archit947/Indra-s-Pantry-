import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  changeAdminPassword,
  fetchPublicSiteBranding,
  fetchShopStatus,
  fetchUpiQrSettings,
  saveSiteBranding,
  saveShopStatus,
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

  // Shop status
  const [shopOpen, setShopOpen] = useState(true);
  const [tentativeReopenDate, setTentativeReopenDate] = useState('');
  const [closeMessage, setCloseMessage] = useState('');
  const [savingShopStatus, setSavingShopStatus] = useState(false);

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
        const [upiRes, brandingRes, shopRes] = await Promise.all([
          fetchUpiQrSettings(),
          fetchPublicSiteBranding(),
          fetchShopStatus(),
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

        const shopData = shopRes.data.data;
        setShopOpen(shopData.is_open);
        setTentativeReopenDate(shopData.tentative_reopen_date || '');
        setCloseMessage(shopData.close_message || '');
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

  const handleSaveShopStatus = async () => {
    setSavingShopStatus(true);
    try {
      const res = await saveShopStatus({
        is_open: shopOpen,
        tentative_reopen_date: shopOpen ? null : (tentativeReopenDate || null),
        close_message: shopOpen ? null : (closeMessage || null),
      });
      const updated = res.data.data;
      setShopOpen(updated.is_open);
      setTentativeReopenDate(updated.tentative_reopen_date || '');
      setCloseMessage(updated.close_message || '');
      toast.success(updated.is_open ? 'Shop is now open' : 'Shop closed successfully');
    } catch {
      toast.error('Failed to update shop status');
    } finally {
      setSavingShopStatus(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {    e.preventDefault();

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
        {/* ── Shop Status ─────────────────────────────────────── */}
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 6 }}>Shop Status</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 18 }}>
            Control whether customers can place orders. When closed, you can set a tentative reopen date.
          </p>

          {/* Toggle row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setShopOpen(true)}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: '2px solid',
                borderColor: shopOpen ? '#16a34a' : '#e2e8f0',
                background: shopOpen ? '#dcfce7' : '#f8fafc',
                color: shopOpen ? '#15803d' : '#64748b',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 15,
                transition: 'all 0.15s',
              }}
            >
              ✅ Open
            </button>
            <button
              type="button"
              onClick={() => setShopOpen(false)}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: '2px solid',
                borderColor: !shopOpen ? '#dc2626' : '#e2e8f0',
                background: !shopOpen ? '#fee2e2' : '#f8fafc',
                color: !shopOpen ? '#b91c1c' : '#64748b',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 15,
                transition: 'all 0.15s',
              }}
            >
              🔴 Closed
            </button>
            <span
              style={{
                marginLeft: 'auto',
                padding: '4px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                background: shopOpen ? '#dcfce7' : '#fee2e2',
                color: shopOpen ? '#15803d' : '#b91c1c',
              }}
            >
              Currently: {shopOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>

          {/* Extra fields shown only when closing */}
          {!shopOpen && (
            <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Tentative Reopen Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={tentativeReopenDate}
                  onChange={(e) => setTentativeReopenDate(e.target.value)}
                  style={{ maxWidth: 300 }}
                />
                <small style={{ color: '#64748b', display: 'block', marginTop: 4 }}>
                  This date will be shown to customers on the site.
                </small>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Message to customers (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Closed for maintenance. See you soon!"
                  value={closeMessage}
                  onChange={(e) => setCloseMessage(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            className={`btn ${shopOpen ? 'btn-primary' : 'btn-danger'}`}
            type="button"
            onClick={handleSaveShopStatus}
            disabled={savingShopStatus}
            style={!shopOpen ? { background: '#dc2626', color: '#fff', border: 'none' } : {}}
          >
            {savingShopStatus ? 'Saving...' : shopOpen ? 'Save (Keep Open)' : 'Close the Shop'}
          </button>
        </div>

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
