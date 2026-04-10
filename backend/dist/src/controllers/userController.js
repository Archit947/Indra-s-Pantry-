"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.updateUserStatus = exports.getUserById = exports.getAllUsers = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
// GET /api/users  [admin]
const getAllUsers = async (_req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('users')
        .select('id, email, name, phone, role, is_active, created_at')
        .order('created_at', { ascending: false });
    if (error) {
        (0, response_1.sendError)(res, 'Failed to fetch users', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.getAllUsers = getAllUsers;
// GET /api/users/:id  [admin]
const getUserById = async (req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('users')
        .select('id, email, name, phone, role, is_active, created_at')
        .eq('id', req.params.id)
        .single();
    if (error || !data) {
        (0, response_1.sendError)(res, 'User not found', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.getUserById = getUserById;
// PATCH /api/users/:id/status  [admin] — activate / deactivate account
const updateUserStatus = async (req, res) => {
    const { is_active } = req.body;
    if (is_active === undefined) {
        (0, response_1.sendError)(res, 'is_active field is required', 400);
        return;
    }
    const { data, error } = await supabase_1.supabase
        .from('users')
        .update({ is_active: Boolean(is_active) })
        .eq('id', req.params.id)
        .select('id, email, name, role, is_active')
        .single();
    if (error || !data) {
        (0, response_1.sendError)(res, 'Failed to update user', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 'User status updated');
};
exports.updateUserStatus = updateUserStatus;
// PUT /api/users/profile  — update own profile
const updateProfile = async (req, res) => {
    const { name, phone } = req.body;
    const updates = {};
    if (name !== undefined)
        updates.name = name.trim();
    if (phone !== undefined)
        updates.phone = phone.trim() || null;
    const { data, error } = await supabase_1.supabase
        .from('users')
        .update(updates)
        .eq('id', req.user.id)
        .select('id, email, name, phone, role, created_at')
        .single();
    if (error || !data) {
        (0, response_1.sendError)(res, 'Failed to update profile', 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 'Profile updated');
};
exports.updateProfile = updateProfile;
