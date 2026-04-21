import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import {
  changeAdminPassword,
  getPublicSiteBranding,
  getPublicUpiQrSettings,
  upsertSiteBranding,
  upsertUpiQrSettings,
} from '../controllers/settingsController';
import { createSupabaseUploadMiddleware, upload } from '../middleware/upload';

const router = Router();
const uploadBrandLogo = createSupabaseUploadMiddleware({
  folder: 'branding',
  bodyField: 'logo_url',
});

router.get('/public/upi-qr', getPublicUpiQrSettings);
router.get('/public/branding', getPublicSiteBranding);
router.put('/upi-qr', authenticate, requireAdmin, upsertUpiQrSettings);
router.put('/branding', authenticate, requireAdmin, upload.single('logo'), uploadBrandLogo, upsertSiteBranding);
router.put('/change-password', authenticate, requireAdmin, changeAdminPassword);

export default router;
