import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('Admin@123456', 12);
  
  const admin = await prisma.admin.create({
    data: {
      name: 'المشرف الرئيسي',
      username: 'superadmin',
      email: 'admin@sawab.iq',
      password: hashed,
      adminRole: 'SUPER_ADMIN',
      permissions: {},
    },
  });
  
  console.log('✅ تم إنشاء الأدمن:', admin.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());