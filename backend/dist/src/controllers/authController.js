"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = require("../config/supabase");
const env_1 = require("../config/env");
const response_1 = require("../utils/response");
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, env_1.env.jwtSecret, { expiresIn: env_1.env.jwtExpiresIn });
};
// POST /api/auth/register
const register = async (req, res) => {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) {
        (0, response_1.sendError)(res, 'Email, password, and name are required', 400);
        return;
    }
    if (password.length < 6) {
        (0, response_1.sendError)(res, 'Password must be at least 6 characters', 400);
        return;
    }
    // Check duplicate email
    const { data: existing } = await supabase_1.supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
    if (existing) {
        (0, response_1.sendError)(res, 'Email is already registered', 409);
        return;
    }
    const password_hash = await bcryptjs_1.default.hash(password, 12);
    const { data: user, error } = await supabase_1.supabase
        .from('users')
        .insert({
        email: email.toLowerCase().trim(),
        password_hash,
        name: name.trim(),
        phone: phone?.trim() || null,
        role: 'user',
    })
        .select('id, email, name, phone, role, created_at')
        .single();
    if (error || !user) {
        (0, response_1.sendError)(res, 'Registration failed', 500);
        return;
    }
    const token = generateToken(user);
    (0, response_1.sendSuccess)(res, { user, token }, 'Registration successful', 201);
};
exports.register = register;
// POST /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        (0, response_1.sendError)(res, 'Email and password are required', 400);
        return;
    }
    const { data: user, error } = await supabase_1.supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('is_active', true)
        .maybeSingle();
    if (error || !user) {
        (0, response_1.sendError)(res, 'Invalid credentials', 401);
        return;
    }
    const valid = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!valid) {
        (0, response_1.sendError)(res, 'Invalid credentials', 401);
        return;
    }
    const token = generateToken(user);
    // Never return the password hash
    const { password_hash: _ph, ...safeUser } = user;
    (0, response_1.sendSuccess)(res, { user: safeUser, token }, 'Login successful');
};
exports.login = login;
// GET /api/auth/me
const getMe = async (req, res) => {
    const { data: user, error } = await supabase_1.supabase
        .from('users')
        .select('id, email, name, phone, role, created_at')
        .eq('id', req.user.id)
        .single();
    if (error || !user) {
        (0, response_1.sendError)(res, 'User not found', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, user);
};
exports.getMe = getMe;
