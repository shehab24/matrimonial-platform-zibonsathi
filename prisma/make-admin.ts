import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Create an admin account, or promote an existing account to admin.
 *   npm run admin:create -- <email> <password> [name]   → new admin (password min 8 chars)
 *   npm run admin:create -- <email>                     → promote an existing user
 */

const prisma = new PrismaClient();

async function main() {
  const [email, password, name = 'Admin'] = process.argv.slice(2);
  if (!email) {
    console.error('Usage: npm run admin:create -- <email> [password] [name]');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({ where: { email }, data: { role: 'ADMIN', isSuspended: false } });
    console.log(`✅ ${email} is now an admin (password unchanged)`);
    return;
  }

  if (!password || password.length < 8) {
    console.error('No account with that email. To create one, give a password of at least 8 characters.');
    process.exit(1);
  }

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Admin created: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
