"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = exports.requireAdmin = void 0;
const response_1 = require("../utils/response");
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        (0, response_1.sendError)(res, 'Unauthorized', 401);
        return;
    }
    if (req.user.role !== 'admin') {
        (0, response_1.sendError)(res, 'Forbidden: Admin access required', 403);
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireUser = (req, res, next) => {
    if (!req.user) {
        (0, response_1.sendError)(res, 'Unauthorized', 401);
        return;
    }
    next();
};
exports.requireUser = requireUser;
