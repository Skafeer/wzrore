import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AdminRequest } from '../types';

export async function adminGetAdmins(req: AdminRequest, res: Response): Promise<void> {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        adminRole: true,
        permissions: true,
        createdAt: true,
      },
    });
    res.json({ success: true, data: admins });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminCreateAdmin(req: AdminRequest, res: Response): Promise<void> {
  try {
    const { name, username, email, password, permissions } = req.body;

    if (!name || !username || !email || !password) {
      res.status(400).json({ success: false, message: 'جميع الحقول مطلوبة' });
      return;
    }

    const existing = await prisma.admin.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      res.status(400).json({ success: false, message: 'البريد أو اسم المستخدم مستخدم' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.create({
      data: {
        name,
        username,
        email,
        password: hashed,
        adminRole: 'ADMIN',
        permissions: permissions ?? {},
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
        adminRole: admin.adminRole,
        permissions: admin.permissions,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminUpdateAdmin(req: AdminRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { name, permissions } = req.body;

    const admin = await prisma.admin.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(permissions && { permissions }),
      },
    });

    res.json({ success: true, data: admin });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}

export async function adminDeleteAdmin(req: AdminRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    if (id === req.admin!.id) {
      res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك' });
      return;
    }

    await prisma.admin.delete({ where: { id } });
    res.json({ success: true, message: 'تم حذف الأدمن' });
  } catch {
    res.status(500).json({ success: false, message: 'حدث خطأ في الخادم' });
  }
}