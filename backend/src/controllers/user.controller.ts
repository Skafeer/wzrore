import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { uploadImage } from '../utils/cloudinary';
import { AuthRequest } from '../types';

// ═══ STUDENT ═══

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        province: user.province,
        avatar: user.avatar,
        studyStreak: user.studyStreak,
        subscription: user.subscription,
        createdAt: user.createdAt,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { name, province } = req.body;

    let avatar: string | undefined;
    if (req.file) {
      avatar = await uploadImage(req.file.buffer, 'avatars');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(province && { province }),
        ...(avatar && { avatar }),
      },
    });

    res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي',
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        province: user.province,
        avatar: user.avatar,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

// ═══ ADMIN ═══

export async function adminGetUsers(req: Request, res: Response): Promise<void> {
  try {
    const { search, hasSubscription, page = '1', limit = '20' } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { province: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (hasSubscription === 'true') {
      where.subscription = { status: 'ACTIVE' };
    } else if (hasSubscription === 'false') {
      where.subscription = null;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: true,
          _count: { select: { examSessions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users.map(u => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        province: u.province,
        avatar: u.avatar,
        studyStreak: u.studyStreak,
        subscription: u.subscription,
        examCount: u._count.examSessions,
        createdAt: u.createdAt,
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminUpdateUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { name, province } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(province && { province }),
      },
    });

    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminDeleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'تم حذف الحساب' });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}