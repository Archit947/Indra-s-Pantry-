"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const itemController_1 = require("../controllers/itemController");
const auth_1 = require("../middleware/auth");
const roleCheck_1 = require("../middleware/roleCheck");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.get('/', itemController_1.getItems);
router.get('/:id', itemController_1.getItemById);
// image is optional — multer runs, then uploadToSupabase injects image_url into body if file present
router.post('/', auth_1.authenticate, roleCheck_1.requireAdmin, upload_1.upload.single('image'), upload_1.uploadToSupabase, itemController_1.createItem);
router.put('/:id', auth_1.authenticate, roleCheck_1.requireAdmin, upload_1.upload.single('image'), upload_1.uploadToSupabase, itemController_1.updateItem);
router.delete('/:id', auth_1.authenticate, roleCheck_1.requireAdmin, itemController_1.deleteItem);
exports.default = router;
