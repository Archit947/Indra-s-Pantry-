"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({ success: true, message, data });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors) => {
    const payload = {
        success: false,
        message,
    };
    if (typeof errors !== 'undefined') {
        payload.errors = errors;
    }
    return res.status(statusCode).json({
        ...payload,
    });
};
exports.sendError = sendError;
