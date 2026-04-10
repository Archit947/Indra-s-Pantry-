"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cartController_1 = require("../controllers/cartController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, cartController_1.getCart);
router.post('/', auth_1.authenticate, cartController_1.addToCart);
router.put('/:id', auth_1.authenticate, cartController_1.updateCartItem);
// /clear must come before /:id so Express doesn't match 'clear' as an id
router.delete('/clear', auth_1.authenticate, cartController_1.clearCart);
router.delete('/:id', auth_1.authenticate, cartController_1.removeFromCart);
exports.default = router;
