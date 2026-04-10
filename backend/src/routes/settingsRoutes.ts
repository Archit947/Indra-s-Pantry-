import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import { getPublicUpiQrSettings, upsertUpiQrSettings } from '../controllers/settingsController';

const router = Router();

router.get('/public/upi-qr', getPublicUpiQrSettings);
router.put('/upi-qr', authenticate, requireAdmin, upsertUpiQrSettings);

export default router;
