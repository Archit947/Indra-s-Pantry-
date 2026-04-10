import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateProfile,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';

const router = Router();

// /profile must come before /:id
router.put('/profile', authenticate, updateProfile);
router.get('/', authenticate, requireAdmin, getAllUsers);
router.get('/:id', authenticate, requireAdmin, getUserById);
router.patch('/:id/status', authenticate, requireAdmin, updateUserStatus);

export default router;
