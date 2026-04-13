"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/env"); // Must be first — loads and validates .env
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const itemRoutes_1 = __importDefault(require("./routes/itemRoutes"));
const cartRoutes_1 = __importDefault(require("./routes/cartRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const app = (0, express_1.default)();
const allowedOrigins = new Set([
    env_1.env.clientUrl,
    ...env_1.env.clientUrls,
    'http://localhost:8081',
    'exp://localhost:8081',
    'http://localhost:19006',
]);
const isAllowedOrigin = (origin) => {
    const normalized = origin.trim().replace(/\/+$/, '');
    if (allowedOrigins.has(normalized))
        return true;
    // Allow Vercel preview deployments for this project family.
    if (/^https:\/\/indra-s-pantry(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(normalized))
        return true;
    return false;
};
const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, '');
// ─── Security ────────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isAllowedOrigin(origin)) {
        res.header('Access-Control-Allow-Origin', normalizeOrigin(origin));
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization');
        res.header('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
        if (origin && !isAllowedOrigin(origin)) {
            return res.status(403).json({ success: false, message: `CORS blocked for origin: ${origin}` });
        }
        return res.sendStatus(204);
    }
    return next();
});
// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);
// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes_1.default);
app.use('/api/categories', categoryRoutes_1.default);
app.use('/api/items', itemRoutes_1.default);
app.use('/api/cart', cartRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/settings', settingsRoutes_1.default);
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Root info endpoints for hosted environments
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: "Indra's Pantry API is running",
        health: '/health',
        apiBase: '/api',
    });
});
app.get('/api', (_req, res) => {
    res.json({
        success: true,
        message: 'API base route',
        routes: [
            '/api/auth',
            '/api/categories',
            '/api/items',
            '/api/cart',
            '/api/orders',
            '/api/users',
            '/api/settings',
        ],
    });
});
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});
// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
});
// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(env_1.env.port, () => {
    console.log(`🚀 Indra's Pantry API running on http://localhost:${env_1.env.port}`);
    console.log(`   Environment : ${env_1.env.nodeEnv}`);
    console.log(`   Supabase    : ${env_1.env.supabaseUrl}`);
});
exports.default = app;
