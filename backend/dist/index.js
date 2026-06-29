"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_cron_1 = __importDefault(require("node-cron"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const subject_routes_1 = __importDefault(require("./routes/subject.routes"));
const exam_routes_1 = __importDefault(require("./routes/exam.routes"));
const session_routes_1 = __importDefault(require("./routes/session.routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const error_1 = require("./middleware/error");
const streakCron_1 = require("./utils/streakCron");
const logger_1 = __importDefault(require("./utils/logger"));
if (process.env.NODE_ENV !== 'production') {
    dotenv_1.default.config();
}
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 3000;
app.set('trust proxy', 1);
// ═══ Security ═══
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
}));
// ═══ Rate Limiting ═══
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'طلبات كثيرة، حاول لاحقاً' },
}));
app.use('/api/auth', (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'محاولات كثيرة، حاول بعد 15 دقيقة' },
}));
app.use('/api/notifications/admin', (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 20,
    message: { success: false, message: 'حاول لاحقاً' },
}));
// ═══ Body Parser ═══
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ═══ Health Check ═══
app.get('/health', (req, res) => {
    res.json({ success: true, message: 'Sawab API is running 🚀' });
});
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Sawab API is running' });
});
// ═══ Cron Jobs ═══
// كل منتصف ليل — تصفير الـ Streak
node_cron_1.default.schedule('30 0 * * *', () => {
    logger_1.default.info('Running streak reset cron job...');
    (0, streakCron_1.checkAndResetStreaks)();
});
// كل يوم الساعة 8 مساءً — إشعارات تذكير
node_cron_1.default.schedule('0 20 * * *', () => {
    logger_1.default.info('Running streak reminder notifications...');
    (0, streakCron_1.sendStreakReminders)();
});
// ═══ Routes ═══
app.use('/api/auth', auth_routes_1.default);
app.use('/api/subjects', subject_routes_1.default);
app.use('/api/exams', exam_routes_1.default);
app.use('/api/sessions', session_routes_1.default);
app.use('/api/subscriptions', subscription_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
// ═══ Error Handling ═══
app.use(error_1.notFound);
app.use(error_1.errorHandler);
// ═══ Start ═══
app.listen(PORT, () => {
    console.log(`✅ Sawab Backend running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map