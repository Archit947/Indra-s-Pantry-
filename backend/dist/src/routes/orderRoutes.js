"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, orderController_1.placeOrder);
// Specific named routes BEFORE /:id
router.get('/my', auth_1.authenticate, orderController_1.getMyOrders);
router.get('/stats', auth_1.authenticate, roleCheck_1.requireAdmin, orderController_1.getOrderStats);
router.get('/', auth_1.authenticate, roleCheck_1.requireAdmin, orderController_1.getAllOrders);
router.get('/:id', auth_1.authenticate, orderController_1.getOrderById);
router.patch('/:id/status', auth_1.authenticate, roleCheck_1.requireAdmin, orderController_1.updateOrderStatus);
exports.default = router;
