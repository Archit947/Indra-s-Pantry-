"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const settingsController_1 = require("../controllers/settingsController");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
const uploadBrandLogo = (0, upload_1.createSupabaseUploadMiddleware)({
    folder: 'branding',
    bodyField: 'logo_url',
});
router.get('/public/upi-qr', settingsController_1.getPublicUpiQrSettings);
router.get('/public/branding', settingsController_1.getPublicSiteBranding);
router.put('/upi-qr', auth_1.authenticate, roleCheck_1.requireAdmin, settingsController_1.upsertUpiQrSettings);
router.put('/branding', auth_1.authenticate, roleCheck_1.requireAdmin, upload_1.upload.single('logo'), uploadBrandLogo, settingsController_1.upsertSiteBranding);
router.put('/change-password', auth_1.authenticate, roleCheck_1.requireAdmin, settingsController_1.changeAdminPassword);
exports.default = router;
