import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';
import { sendError, sendSuccess } from '../utils/response';

interface UpiQrSettings {
  qr_image_url: string;
  upi_id?: string;
  merchant_name?: string;
}

interface SiteBrandingSettings {
  site_name: string;
  logo_url?: string;
}

interface ChangePasswordBody {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const UPI_QR_SETTING_KEY = 'upi_qr';
const SITE_BRANDING_SETTING_KEY = 'site_branding';
const DEFAULT_SITE_NAME = "Indra's Pantry";

const normalizeBrandingSettings = (value: unknown): SiteBrandingSettings => {
  const raw = (value && typeof value === 'object' ? value : {}) as Partial<SiteBrandingSettings>;
  const siteName =
    typeof raw.site_name === 'string' && raw.site_name.trim()
      ? raw.site_name.trim()
      : DEFAULT_SITE_NAME;
  const logoUrl =
    typeof raw.logo_url === 'string' && raw.logo_url.trim() ? raw.logo_url.trim() : undefined;

  return {
    site_name: siteName,
    ...(logoUrl ? { logo_url: logoUrl } : {}),
  };
};

// GET /api/settings/public/upi-qr
export const getPublicUpiQrSettings = async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', UPI_QR_SETTING_KEY)
    .maybeSingle();

  if (error) {
    sendError(res, 'Failed to fetch UPI QR settings', 500);
    return;
  }

  const settings = (data?.setting_value ?? null) as UpiQrSettings | null;
  sendSuccess(res, settings);
};

// PUT /api/settings/upi-qr [admin]
export const upsertUpiQrSettings = async (req: Request, res: Response): Promise<void> => {
  const { qr_image_url, upi_id, merchant_name } = req.body as UpiQrSettings;

  if (!qr_image_url || typeof qr_image_url !== 'string') {
    sendError(res, 'qr_image_url is required', 400);
    return;
  }

  const payload: UpiQrSettings = {
    qr_image_url: qr_image_url.trim(),
    upi_id: upi_id?.trim() || undefined,
    merchant_name: merchant_name?.trim() || undefined,
  };

  const { data, error } = await supabase
    .from('app_settings')
    .upsert(
      {
        setting_key: UPI_QR_SETTING_KEY,
        setting_value: payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'setting_key' }
    )
    .select('setting_value')
    .single();

  if (error) {
    sendError(res, 'Failed to save UPI QR settings', 500);
    return;
  }

  sendSuccess(res, data.setting_value, 'UPI QR settings saved');
};

// GET /api/settings/public/branding
export const getPublicSiteBranding = async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', SITE_BRANDING_SETTING_KEY)
    .maybeSingle();

  if (error) {
    sendError(res, 'Failed to fetch site branding settings', 500);
    return;
  }

  const normalized = normalizeBrandingSettings(data?.setting_value);
  sendSuccess(res, normalized);
};

// PUT /api/settings/branding [admin]
export const upsertSiteBranding = async (req: Request, res: Response): Promise<void> => {
  const { site_name, logo_url } = req.body as Partial<SiteBrandingSettings>;

  if (!site_name || typeof site_name !== 'string' || !site_name.trim()) {
    sendError(res, 'site_name is required', 400);
    return;
  }

  let nextLogoUrl: string | undefined;
  const hasExplicitLogoValue = Object.prototype.hasOwnProperty.call(req.body, 'logo_url');

  if (hasExplicitLogoValue) {
    nextLogoUrl = typeof logo_url === 'string' && logo_url.trim() ? logo_url.trim() : undefined;
  } else {
    const { data: existingSettings, error: existingError } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', SITE_BRANDING_SETTING_KEY)
      .maybeSingle();

    if (existingError) {
      sendError(res, 'Failed to load existing branding settings', 500);
      return;
    }

    nextLogoUrl = normalizeBrandingSettings(existingSettings?.setting_value).logo_url;
  }

  const payload: SiteBrandingSettings = {
    site_name: site_name.trim(),
    ...(nextLogoUrl ? { logo_url: nextLogoUrl } : {}),
  };

  const { data, error } = await supabase
    .from('app_settings')
    .upsert(
      {
        setting_key: SITE_BRANDING_SETTING_KEY,
        setting_value: payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'setting_key' }
    )
    .select('setting_value')
    .single();

  if (error) {
    sendError(res, 'Failed to save site branding settings', 500);
    return;
  }

  sendSuccess(res, normalizeBrandingSettings(data.setting_value), 'Site branding saved');
};

// PUT /api/settings/change-password [admin]
export const changeAdminPassword = async (req: Request, res: Response): Promise<void> => {
  const { current_password, new_password, confirm_password } = req.body as ChangePasswordBody;

  if (!current_password || !new_password || !confirm_password) {
    sendError(res, 'current_password, new_password and confirm_password are required', 400);
    return;
  }

  if (new_password.length < 6) {
    sendError(res, 'New password must be at least 6 characters', 400);
    return;
  }

  if (new_password !== confirm_password) {
    sendError(res, 'New password and confirm password do not match', 400);
    return;
  }

  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('id, role, password_hash')
    .eq('id', req.user!.id)
    .maybeSingle();

  if (userError || !currentUser) {
    sendError(res, 'Admin account not found', 404);
    return;
  }

  if (currentUser.role !== 'admin') {
    sendError(res, 'Only admins can change this password', 403);
    return;
  }

  const isCurrentPasswordValid = await bcrypt.compare(current_password, currentUser.password_hash);
  if (!isCurrentPasswordValid) {
    sendError(res, 'Current password is incorrect', 400);
    return;
  }

  const isSamePassword = await bcrypt.compare(new_password, currentUser.password_hash);
  if (isSamePassword) {
    sendError(res, 'New password must be different from current password', 400);
    return;
  }

  const passwordHash = await bcrypt.hash(new_password, 12);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', req.user!.id);

  if (updateError) {
    sendError(res, 'Failed to update password', 500);
    return;
  }

  sendSuccess(res, null, 'Password updated successfully');
};
