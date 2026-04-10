import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendError, sendSuccess } from '../utils/response';

interface UpiQrSettings {
  qr_image_url: string;
  upi_id?: string;
  merchant_name?: string;
}

// GET /api/settings/public/upi-qr
export const getPublicUpiQrSettings = async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', 'upi_qr')
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
        setting_key: 'upi_qr',
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
