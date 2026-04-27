import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import {
  changeAdminPassword,
  getPublicSiteBranding,
  getPublicUpiQrSettings,
  getPublicShopStatus,
  upsertSiteBranding,
  upsertUpiQrSettings,
  upsertShopStatus,
} from '../controllers/settingsController';
import { createSupabaseUploadMiddleware, upload } from '../middleware/upload';

const router = Router();
const uploadBrandLogo = createSupabaseUploadMiddleware({
  folder: 'branding',
  bodyField: 'logo_url',
});

router.get('/public/upi-qr', getPublicUpiQrSettings);
router.get('/public/branding', getPublicSiteBranding);
router.get('/public/shop-status', getPublicShopStatus);
router.put('/upi-qr', authenticate, requireAdmin, upsertUpiQrSettings);
router.put('/branding', authenticate, requireAdmin, upload.single('logo'), uploadBrandLogo, upsertSiteBranding);
router.put('/change-password', authenticate, requireAdmin, changeAdminPassword);
router.put('/shop-status', authenticate, requireAdmin, upsertShopStatus);

export default router;
