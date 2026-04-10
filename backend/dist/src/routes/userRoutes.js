"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const router = (0, express_1.Router)();
// /profile must come before /:id
router.put('/profile', auth_1.authenticate, userController_1.updateProfile);
router.get('/', auth_1.authenticate, roleCheck_1.requireAdmin, userController_1.getAllUsers);
router.get('/:id', auth_1.authenticate, roleCheck_1.requireAdmin, userController_1.getUserById);
router.patch('/:id/status', auth_1.authenticate, roleCheck_1.requireAdmin, userController_1.updateUserStatus);
exports.default = router;
