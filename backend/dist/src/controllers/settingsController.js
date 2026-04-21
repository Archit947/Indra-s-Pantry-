"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeAdminPassword = exports.upsertSiteBranding = exports.getPublicSiteBranding = exports.upsertUpiQrSettings = exports.getPublicUpiQrSettings = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
const UPI_QR_SETTING_KEY = 'upi_qr';
const SITE_BRANDING_SETTING_KEY = 'site_branding';
const DEFAULT_SITE_NAME = "Indra's Pantry";
const normalizeBrandingSettings = (value) => {
    const raw = (value && typeof value === 'object' ? value : {});
    const siteName = typeof raw.site_name === 'string' && raw.site_name.trim()
        ? raw.site_name.trim()
        : DEFAULT_SITE_NAME;
    const logoUrl = typeof raw.logo_url === 'string' && raw.logo_url.trim() ? raw.logo_url.trim() : undefined;
    return {
        site_name: siteName,
        ...(logoUrl ? { logo_url: logoUrl } : {}),
    };
};
// GET /api/settings/public/upi-qr
const getPublicUpiQrSettings = async (_req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', UPI_QR_SETTING_KEY)
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
        setting_key: UPI_QR_SETTING_KEY,
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
// GET /api/settings/public/branding
const getPublicSiteBranding = async (_req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', SITE_BRANDING_SETTING_KEY)
        .maybeSingle();
    if (error) {
        (0, response_1.sendError)(res, 'Failed to fetch site branding settings', 500);
        return;
    }
    const normalized = normalizeBrandingSettings(data?.setting_value);
    (0, response_1.sendSuccess)(res, normalized);
};
exports.getPublicSiteBranding = getPublicSiteBranding;
// PUT /api/settings/branding [admin]
const upsertSiteBranding = async (req, res) => {
    const { site_name, logo_url } = req.body;
    if (!site_name || typeof site_name !== 'string' || !site_name.trim()) {
        (0, response_1.sendError)(res, 'site_name is required', 400);
        return;
    }
    let nextLogoUrl;
    const hasExplicitLogoValue = Object.prototype.hasOwnProperty.call(req.body, 'logo_url');
    if (hasExplicitLogoValue) {
        nextLogoUrl = typeof logo_url === 'string' && logo_url.trim() ? logo_url.trim() : undefined;
    }
    else {
        const { data: existingSettings, error: existingError } = await supabase_1.supabase
            .from('app_settings')
            .select('setting_value')
            .eq('setting_key', SITE_BRANDING_SETTING_KEY)
            .maybeSingle();
        if (existingError) {
            (0, response_1.sendError)(res, 'Failed to load existing branding settings', 500);
            return;
        }
        nextLogoUrl = normalizeBrandingSettings(existingSettings?.setting_value).logo_url;
    }
    const payload = {
        site_name: site_name.trim(),
        ...(nextLogoUrl ? { logo_url: nextLogoUrl } : {}),
    };
    const { data, error } = await supabase_1.supabase
        .from('app_settings')
        .upsert({
        setting_key: SITE_BRANDING_SETTING_KEY,
        setting_value: payload,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'setting_key' })
        .select('setting_value')
        .single();
    if (error) {
        (0, response_1.sendError)(res, 'Failed to save site branding settings', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, normalizeBrandingSettings(data.setting_value), 'Site branding saved');
};
exports.upsertSiteBranding = upsertSiteBranding;
// PUT /api/settings/change-password [admin]
const changeAdminPassword = async (req, res) => {
    const { current_password, new_password, confirm_password } = req.body;
    if (!current_password || !new_password || !confirm_password) {
        (0, response_1.sendError)(res, 'current_password, new_password and confirm_password are required', 400);
        return;
    }
    if (new_password.length < 6) {
        (0, response_1.sendError)(res, 'New password must be at least 6 characters', 400);
        return;
    }
    if (new_password !== confirm_password) {
        (0, response_1.sendError)(res, 'New password and confirm password do not match', 400);
        return;
    }
    const { data: currentUser, error: userError } = await supabase_1.supabase
        .from('users')
        .select('id, role, password_hash')
        .eq('id', req.user.id)
        .maybeSingle();
    if (userError || !currentUser) {
        (0, response_1.sendError)(res, 'Admin account not found', 404);
        return;
    }
    if (currentUser.role !== 'admin') {
        (0, response_1.sendError)(res, 'Only admins can change this password', 403);
        return;
    }
    const isCurrentPasswordValid = await bcryptjs_1.default.compare(current_password, currentUser.password_hash);
    if (!isCurrentPasswordValid) {
        (0, response_1.sendError)(res, 'Current password is incorrect', 400);
        return;
    }
    const isSamePassword = await bcryptjs_1.default.compare(new_password, currentUser.password_hash);
    if (isSamePassword) {
        (0, response_1.sendError)(res, 'New password must be different from current password', 400);
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(new_password, 12);
    const { error: updateError } = await supabase_1.supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', req.user.id);
    if (updateError) {
        (0, response_1.sendError)(res, 'Failed to update password', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, null, 'Password updated successfully');
};
exports.changeAdminPassword = changeAdminPassword;
