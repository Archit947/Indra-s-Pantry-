import { Router } from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/itemController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import { upload, uploadToSupabase } from '../middleware/upload';

const router = Router();

router.get('/', getItems);
router.get('/:id', getItemById);
// image is optional — multer runs, then uploadToSupabase injects image_url into body if file present
router.post('/', authenticate, requireAdmin, upload.single('image'), uploadToSupabase, createItem);
router.put('/:id', authenticate, requireAdmin, upload.single('image'), uploadToSupabase, updateItem);
router.delete('/:id', authenticate, requireAdmin, deleteItem);

export default router;
