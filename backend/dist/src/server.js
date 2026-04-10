"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/env"); // Must be first — loads and validates .env
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
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
// ─── Security ────────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        env_1.env.clientUrl,
        'http://localhost:8081', // Expo web
        'exp://localhost:8081', // Expo Go tunnel
        'http://localhost:19006', // Expo web (alternate)
    ],
    credentials: true,
}));
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
    console.log(`🚀 Canteen Hub API running on http://localhost:${env_1.env.port}`);
    console.log(`   Environment : ${env_1.env.nodeEnv}`);
    console.log(`   Supabase    : ${env_1.env.supabaseUrl}`);
});
exports.default = app;
