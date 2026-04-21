import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import { createSupabaseUploadMiddleware, upload } from '../middleware/upload';

const router = Router();
const uploadCategoryImage = createSupabaseUploadMiddleware({
  folder: 'categories',
  bodyField: 'image_url',
});

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', authenticate, requireAdmin, upload.single('image'), uploadCategoryImage, createCategory);
router.put('/:id', authenticate, requireAdmin, upload.single('image'), uploadCategoryImage, updateCategory);
router.delete('/:id', authenticate, requireAdmin, deleteCategory);

export default router;
