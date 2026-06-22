import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET!;

const IRAQ_PROVINCES = [
  'بغداد', 'البصرة', 'نينوى', 'أربيل', 'النجف',
  'كربلاء', 'الأنبار', 'ديالى', 'صلاح الدين', 'بابل',
  'واسط', 'ميسان', 'ذي قار', 'المثنى', 'القادسية',
  'كركوك', 'السليمانية', 'دهوك',
];

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, phone, province, password } = req.body;

    if (!name || !phone || !province || !password) {
      res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
      return;
    }

    if (!/^07\d{9}$/.test(phone)) {
      res.status(400).json({ success: false, message: 'رقم الهاتف يجب أن يبدأ بـ 07 ويكون 11 رقم' });
      return;
    }

    if (!IRAQ_PROVINCES.includes(province)) {
      res.status(400).json({ success: false, message: 'المحافظة غير صحيحة' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });
      return;
    }

    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تحتوي على حروف وأرقام' });
      return;
    }

    const existing = await prisma.user.findFirst({ where: { phone } });
    if (existing) {
      res.status(400).json({ success: false, message: 'رقم الهاتف مسجل مسبقاً' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, phone, province, password: hashed },
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '90d' });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        token,
        user: {
          id: user.id, name: user.name, phone: user.phone,
          province: user.province, avatar: user.avatar, studyStreak: user.studyStreak,
        },
      },
    });
  } catch (err) {
    logger.error(`register — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      include: { subscription: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ success: false, message: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
      return;
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '90d' });

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        token,
        user: {
          id: user.id, name: user.name, phone: user.phone,
          province: user.province, avatar: user.avatar,
          studyStreak: user.studyStreak, subscription: user.subscription,
        },
      },
    });
  } catch (err) {
    logger.error(`login — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
      return;
    }

    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      res.status(401).json({ success: false, message: 'البريد أو كلمة المرور غير صحيحة' });
      return;
    }

    const token = jwt.sign(
      { id: admin.id, role: 'ADMIN', adminRole: admin.adminRole },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id, name: admin.name, username: admin.username,
          email: admin.email, adminRole: admin.adminRole, permissions: admin.permissions,
        },
      },
    });
  } catch (err) {
    logger.error(`adminLogin — ${(err as Error).message}`, { stack: (err as Error).stack });
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}