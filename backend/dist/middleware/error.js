"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFound = notFound;
const logger_1 = __importDefault(require("../utils/logger"));
function errorHandler(err, req, res, next) {
    logger_1.default.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
        stack: err.stack,
        body: req.body,
    });
    res.status(500).json({
        success: false,
        message: 'حدث خطأ في الخادم',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
}
function notFound(req, res) {
    logger_1.default.warn(`404 — ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'المسار غير موجود',
    });
}
//# sourceMappingURL=error.js.map