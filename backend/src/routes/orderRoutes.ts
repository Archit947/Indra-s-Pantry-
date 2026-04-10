import { Router } from 'express';
import {
  placeOrder,
  getMyOrders,
  getOrderStats,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/orderController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';

const router = Router();

router.post('/', authenticate, placeOrder);
// Specific named routes BEFORE /:id
router.get('/my', authenticate, getMyOrders);
router.get('/stats', authenticate, requireAdmin, getOrderStats);
router.get('/', authenticate, requireAdmin, getAllOrders);
router.get('/:id', authenticate, getOrderById);
router.patch('/:id/status', authenticate, requireAdmin, updateOrderStatus);

export default router;
