"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertUpiQrSettings = exports.getPublicUpiQrSettings = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
// GET /api/settings/public/upi-qr
const getPublicUpiQrSettings = async (_req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'upi_qr')
        .maybeSingle();
    if (error) {
        (0, response_1.sendError)(res, 'Failed to fetch UPI QR settings', 500);
        return;
    }
    const settings = (data?.setting_value ?? null);
    (0, response_1.sendSuccess)(res, settings);
};
exports.getPublicUpiQrSettings = getPublicUpiQrSettings;
// PUT /api/settings/upi-qr [admin]
const upsertUpiQrSettings = async (req, res) => {
    const { qr_image_url, upi_id, merchant_name } = req.body;
    if (!qr_image_url || typeof qr_image_url !== 'string') {
        (0, response_1.sendError)(res, 'qr_image_url is required', 400);
        return;
    }
    const payload = {
        qr_image_url: qr_image_url.trim(),
        upi_id: upi_id?.trim() || undefined,
        merchant_name: merchant_name?.trim() || undefined,
    };
    const { data, error } = await supabase_1.supabase
        .from('app_settings')
        .upsert({
        setting_key: 'upi_qr',
        setting_value: payload,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'setting_key' })
        .select('setting_value')
        .single();
    if (error) {
        (0, response_1.sendError)(res, 'Failed to save UPI QR settings', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data.setting_value, 'UPI QR settings saved');
};
exports.upsertUpiQrSettings = upsertUpiQrSettings;
