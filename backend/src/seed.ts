import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('Admin@123456', 12);
  
  const admin = await prisma.admin.update({
    where: { email: 'admin@sawab.iq' },
    data: { password: hashed },
  });
  
  console.log('✅ تم تحديث كلمة المرور:', admin.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());