"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToSupabase = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const supabase_1 = require("../config/supabase");
const env_1 = require("../config/env");
const response_1 = require("../utils/response");
// Store files in memory so we can stream them to Supabase Storage
const storage = multer_1.default.memoryStorage();
const fileFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
});
/**
 * After multer parses the file, upload it to Supabase Storage
 * and inject the public URL as req.body.image_url for the controller.
 */
const uploadToSupabase = async (req, res, next) => {
    if (!req.file) {
        next();
        return;
    }
    const file = req.file;
    const safeName = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
    const filePath = `items/${Date.now()}-${safeName}`;
    const { error } = await supabase_1.supabase.storage
        .from(env_1.env.supabaseStorageBucket)
        .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
    });
    if (error) {
        (0, response_1.sendError)(res, 'Image upload failed: ' + error.message, 500);
        return;
    }
    const { data } = supabase_1.supabase.storage
        .from(env_1.env.supabaseStorageBucket)
        .getPublicUrl(filePath);
    req.body.image_url = data.publicUrl;
    next();
};
exports.uploadToSupabase = uploadToSupabase;
