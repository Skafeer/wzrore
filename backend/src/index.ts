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

import { errorHandler, notFound } from './middleware/error';

// فقط في development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT ?? 3000;

// ═══ Trust Proxy (Railway) ═══
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
app.options('*', cors());

// ═══ Rate Limiting ═══
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'طلبات كثيرة، حاول لاحقاً' },
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

// ═══ Error Handling ═══
app.use(notFound);
app.use(errorHandler);

// ═══ Start ═══
app.listen(PORT, () => {
  console.log(`✅ Sawab Backend running on port ${PORT}`);
});

export default app;
