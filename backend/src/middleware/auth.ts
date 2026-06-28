import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { AuthRequest, AdminRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ success: false, message: 'غير مصرح' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { subscription: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
      return;
    }

    // ═══ تحقق من صلاحية الاشتراك ═══
    const now = new Date();
    const sub = user.subscription;
    const isActiveSub = sub?.status === 'ACTIVE' && new Date(sub.endDate) > now;

    // لو انتهى الاشتراك — حدّثه في الـ DB
    if (sub?.status === 'ACTIVE' && new Date(sub.endDate) <= now) {
      await prisma.subscription.update({
        where: { userId: user.id },
        data: { status: 'EXPIRED' },
      });
    }

    req.user = {
      id: user.id,
      role: user.role,
      plan: isActiveSub ? sub!.plan : null,
    };

    next();
  } catch {
    res.status(401).json({ success: false, message: 'توكن غير صالح' });
  }
}

export async function adminMiddleware(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ success: false, message: 'غير مصرح' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };

    if (decoded.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'ليس لديك صلاحية' });
      return;
    }

    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });

    if (!admin) {
      res.status(401).json({ success: false, message: 'الأدمن غير موجود' });
      return;
    }

    req.admin = {
      id: admin.id,
      adminRole: admin.adminRole,
      permissions: admin.permissions as Record<string, boolean>,
    };

    next();
  } catch {
    res.status(401).json({ success: false, message: 'توكن غير صالح' });
  }
}

export function superAdminMiddleware(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.admin?.adminRole !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, message: 'هذه الصفحة للأدمن الرئيسي فقط' });
    return;
  }
  next();
}

export function requirePermission(page: string) {
  return (req: AdminRequest, res: Response, next: NextFunction): void => {
    if (req.admin?.adminRole === 'SUPER_ADMIN') { next(); return; }
    if (!req.admin?.permissions[page]) {
      res.status(403).json({ success: false, message: 'ليس لديك صلاحية للوصول لهذه الصفحة' });
      return;
    }
    next();
  };
}