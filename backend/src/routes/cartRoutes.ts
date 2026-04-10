import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  clearCart,
  removeFromCart,
} from '../controllers/cartController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getCart);
router.post('/', authenticate, addToCart);
router.put('/:id', authenticate, updateCartItem);
// /clear must come before /:id so Express doesn't match 'clear' as an id
router.delete('/clear', authenticate, clearCart);
router.delete('/:id', authenticate, removeFromCart);

export default router;
