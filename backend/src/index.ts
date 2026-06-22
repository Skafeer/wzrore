import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import subjectRoutes from './routes/subject.routes';
import examRoutes from './routes/exam.routes';
import sessionRoutes from './routes/session.routes';
import subscriptionRoutes from './routes/subscription.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from './routes/notification.routes';
import { errorHandler, notFound } from './middleware/error';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT ?? 3000;

app.set('trust proxy', 1);

// ═══ Security ═══
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));
app.options('/{*path}', cors());

// ═══ Rate Limiting ═══
// عام — 1000 طلب كل 15 دقيقة (يتحمل 50 طالب × 20 طلب)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'طلبات كثيرة، حاول لاحقاً' },
}));

// المصادقة — أشد حماية
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'محاولات كثيرة، حاول بعد 15 دقيقة' },
}));

// الإشعارات — حماية متوسطة
app.use('/api/notifications/admin', rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: 'حاول لاحقاً' },
}));

// ═══ Body Parser ═══
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ═══ Health Check ═══
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Sawab API is running 🚀' });
});

// ═══ Routes ═══
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// ═══ Error Handling ═══
app.use(notFound);
app.use(errorHandler);

// ═══ Start ═══
app.listen(PORT, () => {
  console.log(`✅ Sawab Backend running on port ${PORT}`);
});

export default app;