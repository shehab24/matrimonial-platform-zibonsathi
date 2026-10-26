import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@zibonsathi.com' },
    update: {},
    create: {
      email: 'admin@zibonsathi.com',
      name: 'Admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Credit Packages
  const packages = [
    { name: '৫ ক্রেডিট', credits: 5, price: 500 },
    { name: '১০ ক্রেডিট', credits: 10, price: 900 },
    { name: '২০ ক্রেডিট', credits: 20, price: 1600 },
  ];

  for (const pkg of packages) {
    await prisma.creditPackage.upsert({
      where: { id: pkg.name },
      update: {},
      create: {
        id: pkg.name,
        name: pkg.name,
        credits: pkg.credits,
        price: pkg.price,
        currency: 'BDT',
        isActive: true,
      },
    });
  }
  console.log('✅ Credit packages created');

  // Sample user 1 - Male
  const user1Hash = await bcrypt.hash('User@123456', 12);
  const user1 = await prisma.user.upsert({
    where: { email: 'rahman@example.com' },
    update: {},
    create: {
      email: 'rahman@example.com',
      name: 'আবদুর রহমান',
      passwordHash: user1Hash,
      emailVerified: new Date(),
      creditBalance: { create: { balance: 5 } },
    },
  });

  await prisma.profile.upsert({
    where: { userId: user1.id },
    update: {},
    create: {
      userId: user1.id,
      status: 'APPROVED',
      displayName: 'আবদুর রহমান',
      gender: 'MALE',
      dateOfBirth: new Date('1995-05-15'),
      division: 'ঢাকা',
      district: 'ঢাকা',
      education: 'স্নাতক',
      educationDetails: 'কম্পিউটার বিজ্ঞান, ঢাকা বিশ্ববিদ্যালয়',
      occupation: 'চাকরি',
      occupationDetails: 'সফটওয়্যার ইঞ্জিনিয়ার',
      monthlyIncome: '৬০,০০০-১,০০,০০০',
      maritalStatus: 'NEVER_MARRIED',
      familyType: 'মধ্যবিত্ত',
      prayerHabit: 'পাঁচ ওয়াক্ত নামাজ পড়ি',
      beardOrHijab: 'হ্যাঁ, আংশিকভাবে',
      mazhab: 'হানাফি',
      aboutMe: 'আমি একজন সফটওয়্যার ইঞ্জিনিয়ার। দ্বীনদার ও পরিশ্রমী একজন মানুষ খুঁজছি।',
      partnerPreferences: 'ধার্মিক, শিক্ষিত এবং পারিবারিক মূল্যবোধসম্পন্ন একজন সঙ্গিনী চাই।',
      approvedAt: new Date(),
      isVisible: true,
    },
  });

  // Sample user 2 - Female
  const user2Hash = await bcrypt.hash('User@123456', 12);
  const user2 = await prisma.user.upsert({
    where: { email: 'fatema@example.com' },
    update: {},
    create: {
      email: 'fatema@example.com',
      name: 'ফাতেমা বেগম',
      passwordHash: user2Hash,
      emailVerified: new Date(),
      creditBalance: { create: { balance: 5 } },
    },
  });

  await prisma.profile.upsert({
    where: { userId: user2.id },
    update: {},
    create: {
      userId: user2.id,
      status: 'APPROVED',
      displayName: 'ফাতেমা বেগম',
      gender: 'FEMALE',
      dateOfBirth: new Date('1998-08-20'),
      division: 'চট্টগ্রাম',
      district: 'চট্টগ্রাম',
      education: 'স্নাতকোত্তর',
      educationDetails: 'বাংলা সাহিত্য, চট্টগ্রাম বিশ্ববিদ্যালয়',
      occupation: 'শিক্ষক',
      occupationDetails: 'বিদ্যালয় শিক্ষিকা',
      monthlyIncome: '২০,০০০-৪০,০০০',
      maritalStatus: 'NEVER_MARRIED',
      familyType: 'মধ্যবিত্ত',
      prayerHabit: 'পাঁচ ওয়াক্ত নামাজ পড়ি',
      beardOrHijab: 'হ্যাঁ, সম্পূর্ণরূপে',
      mazhab: 'হানাফি',
      aboutMe: 'আমি একজন শিক্ষিকা। ইসলামের পথে একজন ভালো মানুষের সঙ্গ চাই।',
      partnerPreferences: 'দ্বীনদার, সৎ এবং পরিশ্রমী একজন সঙ্গী চাই।',
      approvedAt: new Date(),
      isVisible: true,
    },
  });

  console.log('✅ Sample profiles created');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
