import { PrismaClient, Gender, MaritalStatus, ProfileStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Dummy biodata for testing.
 *   npm run db:seed:dummy   → create dummy users + biodatas
 *   npm run db:clear:dummy  → delete everything created by this script
 * All dummy accounts use the DUMMY_DOMAIN email domain and share DUMMY_PASSWORD.
 */

const prisma = new PrismaClient();

const DUMMY_DOMAIN = 'dummy.zibonsathi.test';
const DUMMY_PASSWORD = 'Test@12345';

type Seed = {
  name: string;
  occupationDetails: string;
  gender: Gender;
  age: number;
  division: string;
  district: string;
  education: string;
  occupation: string;
  maritalStatus: MaritalStatus;
  status?: ProfileStatus;
};

const seeds: Seed[] = [
  // Male
  { name: 'আব্দুল্লাহ আল মামুন', gender: 'MALE', age: 27, division: 'ঢাকা', district: 'ঢাকা', education: 'স্নাতক', occupation: 'ইঞ্জিনিয়ার', occupationDetails: 'সফটওয়্যার ইঞ্জিনিয়ার', maritalStatus: 'NEVER_MARRIED' },
  { name: 'মোহাম্মদ রাকিবুল হাসান', gender: 'MALE', age: 29, division: 'চট্টগ্রাম', district: 'কুমিল্লা', education: 'স্নাতকোত্তর', occupation: 'চাকরি', occupationDetails: 'ব্যাংকার', maritalStatus: 'NEVER_MARRIED' },
  { name: 'তানভীর আহমেদ', gender: 'MALE', age: 31, division: 'রাজশাহী', district: 'বগুড়া', education: 'স্নাতক', occupation: 'ব্যবসা', occupationDetails: 'ব্যবসায়ী', maritalStatus: 'DIVORCED' },
  { name: 'মাহমুদুল হক', gender: 'MALE', age: 26, division: 'সিলেট', district: 'সিলেট', education: 'আলিম', occupation: 'শিক্ষক', occupationDetails: 'মাদ্রাসা শিক্ষক', maritalStatus: 'NEVER_MARRIED' },
  { name: 'ইমরান হোসেন', gender: 'MALE', age: 33, division: 'খুলনা', district: 'যশোর', education: 'স্নাতকোত্তর', occupation: 'চাকরি', occupationDetails: 'সরকারি চাকরিজীবী', maritalStatus: 'WIDOWED' },
  { name: 'সাইফুল ইসলাম', gender: 'MALE', age: 28, division: 'ঢাকা', district: 'গাজীপুর', education: 'ডিপ্লোমা', occupation: 'ইঞ্জিনিয়ার', occupationDetails: 'ইলেকট্রিক্যাল ইঞ্জিনিয়ার', maritalStatus: 'NEVER_MARRIED' },
  { name: 'নাজমুল হুদা', gender: 'MALE', age: 30, division: 'বরিশাল', district: 'বরিশাল', education: 'স্নাতক', occupation: 'ডাক্তার', occupationDetails: 'ডাক্তার', maritalStatus: 'NEVER_MARRIED' },
  { name: 'আরিফুর রহমান', gender: 'MALE', age: 25, division: 'রংপুর', district: 'দিনাজপুর', education: 'স্নাতক', occupation: 'শিক্ষক', occupationDetails: 'শিক্ষক', maritalStatus: 'NEVER_MARRIED' },
  { name: 'ফাহিম মুনতাসির', gender: 'MALE', age: 32, division: 'ময়মনসিংহ', district: 'ময়মনসিংহ', education: 'কামিল', occupation: 'অন্যান্য', occupationDetails: 'ইমাম ও খতিব', maritalStatus: 'NEVER_MARRIED' },
  { name: 'রেজাউল করিম', gender: 'MALE', age: 35, division: 'চট্টগ্রাম', district: 'চট্টগ্রাম', education: 'স্নাতক', occupation: 'ব্যবসা', occupationDetails: 'আমদানি-রপ্তানি ব্যবসা', maritalStatus: 'DIVORCED' },
  // Female
  { name: 'ফাতিমা আক্তার', gender: 'FEMALE', age: 22, division: 'ঢাকা', district: 'নারায়ণগঞ্জ', education: 'স্নাতক', occupation: 'ছাত্র/ছাত্রী', occupationDetails: 'ছাত্রী', maritalStatus: 'NEVER_MARRIED' },
  { name: 'আয়েশা সিদ্দিকা', gender: 'FEMALE', age: 24, division: 'চট্টগ্রাম', district: 'চট্টগ্রাম', education: 'স্নাতক', occupation: 'গৃহিণী', occupationDetails: 'গৃহিণী', maritalStatus: 'NEVER_MARRIED' },
  { name: 'খাদিজা ইসলাম', gender: 'FEMALE', age: 23, division: 'রাজশাহী', district: 'রাজশাহী', education: 'ফাজিল', occupation: 'শিক্ষক', occupationDetails: 'মাদ্রাসা শিক্ষিকা', maritalStatus: 'NEVER_MARRIED' },
  { name: 'মারিয়াম বেগম', gender: 'FEMALE', age: 28, division: 'খুলনা', district: 'খুলনা', education: 'স্নাতকোত্তর', occupation: 'শিক্ষক', occupationDetails: 'শিক্ষিকা', maritalStatus: 'DIVORCED' },
  { name: 'সুমাইয়া রহমান', gender: 'FEMALE', age: 21, division: 'সিলেট', district: 'মৌলভীবাজার', education: 'এইচএসসি', occupation: 'ছাত্র/ছাত্রী', occupationDetails: 'ছাত্রী', maritalStatus: 'NEVER_MARRIED' },
  { name: 'নুসরাত জাহান', gender: 'FEMALE', age: 26, division: 'ঢাকা', district: 'ঢাকা', education: 'স্নাতক', occupation: 'ডাক্তার', occupationDetails: 'ডাক্তার', maritalStatus: 'NEVER_MARRIED' },
  { name: 'হাফসা খাতুন', gender: 'FEMALE', age: 25, division: 'রংপুর', district: 'রংপুর', education: 'স্নাতক', occupation: 'গৃহিণী', occupationDetails: 'গৃহিণী', maritalStatus: 'NEVER_MARRIED' },
  { name: 'জান্নাতুল ফেরদৌস', gender: 'FEMALE', age: 30, division: 'বরিশাল', district: 'পটুয়াখালী', education: 'স্নাতক', occupation: 'চাকরি', occupationDetails: 'এনজিও কর্মী', maritalStatus: 'WIDOWED' },
  { name: 'তাসনিম আরা', gender: 'FEMALE', age: 23, division: 'ময়মনসিংহ', district: 'নেত্রকোনা', education: 'আলিম', occupation: 'ছাত্র/ছাত্রী', occupationDetails: 'ছাত্রী', maritalStatus: 'NEVER_MARRIED' },
  { name: 'রুমানা পারভীন', gender: 'FEMALE', age: 27, division: 'চট্টগ্রাম', district: 'নোয়াখালী', education: 'স্নাতকোত্তর', occupation: 'চাকরি', occupationDetails: 'ব্যাংকার', maritalStatus: 'NEVER_MARRIED' },
  // Pending approval — for testing the admin approval flow
  { name: 'হাসান মাহমুদ', gender: 'MALE', age: 28, division: 'ঢাকা', district: 'টাঙ্গাইল', education: 'স্নাতক', occupation: 'অন্যান্য', occupationDetails: 'ফ্রিল্যান্সার', maritalStatus: 'NEVER_MARRIED', status: 'PENDING_APPROVAL' },
  { name: 'শাহরিয়ার কবির', gender: 'MALE', age: 30, division: 'খুলনা', district: 'কুষ্টিয়া', education: 'স্নাতকোত্তর', occupation: 'শিক্ষক', occupationDetails: 'প্রভাষক', maritalStatus: 'NEVER_MARRIED', status: 'PENDING_APPROVAL' },
  { name: 'উম্মে হাবিবা', gender: 'FEMALE', age: 22, division: 'সিলেট', district: 'হবিগঞ্জ', education: 'স্নাতক', occupation: 'ছাত্র/ছাত্রী', occupationDetails: 'ছাত্রী', maritalStatus: 'NEVER_MARRIED', status: 'PENDING_APPROVAL' },
  { name: 'সাদিয়া আফরিন', gender: 'FEMALE', age: 26, division: 'রাজশাহী', district: 'পাবনা', education: 'স্নাতক', occupation: 'অন্যান্য', occupationDetails: 'গ্রাফিক ডিজাইনার', maritalStatus: 'NEVER_MARRIED', status: 'PENDING_APPROVAL' },
];

// Same option values as the profile form, so they translate in the English UI
const prayerHabits = ['পাঁচ ওয়াক্ত নামাজ পড়ি', 'পাঁচ ওয়াক্ত নামাজ পড়ি', 'চেষ্টা করছি'];
const familyTypes = ['একক পরিবার', 'যৌথ পরিবার'];
const familyStatuses = ['মধ্যবিত্ত', 'উচ্চবিত্ত', 'নিম্নমধ্যবিত্ত'];
const incomes = ['২০,০০০-৪০,০০০', '৪০,০০০-৬০,০০০', '৬০,০০০-১,০০,০০০', '১,০০,০০০ এর বেশি'];

function dobForAge(age: number, i: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age, (i * 5) % 12, ((i * 7) % 27) + 1);
  return d;
}

async function clear() {
  const users = await prisma.user.findMany({ where: { email: { endsWith: `@${DUMMY_DOMAIN}` } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  const involves = (a: string, b: string) => ({ OR: [{ [a]: { in: ids } }, { [b]: { in: ids } }] });

  // These relations don't cascade from User, so remove activity created while testing first
  await prisma.$transaction([
    prisma.message.deleteMany({ where: involves('senderId', 'receiverId') }),
    prisma.report.deleteMany({ where: involves('submitterId', 'targetId') }),
    prisma.creditLedger.deleteMany({ where: { userId: { in: ids } } }),
    prisma.payment.deleteMany({ where: { userId: { in: ids } } }),
    prisma.connection.deleteMany({ where: involves('senderId', 'receiverId') }),
  ]);
  const { count } = await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`🧹 Deleted ${count} dummy users (and their biodatas)`);
}

async function seed() {
  await clear();

  const passwordHash = await bcrypt.hash(DUMMY_PASSWORD, 12);
  const counters = { MALE: 0, FEMALE: 0 };

  // Continue after the highest existing biodata ID for each gender
  for (const gender of ['MALE', 'FEMALE'] as const) {
    const last = await prisma.profile.findFirst({
      where: { oderId: { startsWith: gender === 'MALE' ? 'ZBM' : 'ZBF' } },
      orderBy: { oderId: 'desc' },
      select: { oderId: true },
    });
    counters[gender] = last?.oderId ? parseInt(last.oderId.match(/\d+$/)?.[0] ?? '0', 10) : 0;
  }

  for (const [i, s] of seeds.entries()) {
    const status = s.status ?? ProfileStatus.APPROVED;
    const isMale = s.gender === Gender.MALE;
    const oderId =
      status === ProfileStatus.APPROVED
        ? `${isMale ? 'ZBM' : 'ZBF'}-${String(++counters[s.gender]).padStart(5, '0')}`
        : null;

    await prisma.user.create({
      data: {
        name: s.name,
        email: `dummy${String(i + 1).padStart(2, '0')}@${DUMMY_DOMAIN}`,
        passwordHash,
        emailVerified: new Date(),
        creditBalance: { create: { balance: 5 } },
        profile: {
          create: {
            oderId,
            status,
            approvedAt: status === ProfileStatus.APPROVED ? new Date() : null,
            displayName: s.name,
            dateOfBirth: dobForAge(s.age, i),
            gender: s.gender,
            sect: 'সুন্নি',
            mazhab: 'হানাফি',
            country: 'বাংলাদেশ',
            division: s.division,
            district: s.district,
            education: s.education,
            occupation: s.occupation,
            occupationDetails: s.occupationDetails,
            monthlyIncome: isMale ? incomes[i % incomes.length] : null,
            maritalStatus: s.maritalStatus,
            numberOfChildren: s.maritalStatus === 'NEVER_MARRIED' ? null : i % 2,
            fatherAlive: i % 4 !== 0,
            motherAlive: true,
            siblings: (i % 4) + 1,
            familyType: familyTypes[i % familyTypes.length],
            familyStatus: familyStatuses[i % familyStatuses.length],
            prayerHabit: prayerHabits[i % prayerHabits.length],
            beardOrHijab: i % 3 === 2 ? 'হ্যাঁ, আংশিকভাবে' : 'হ্যাঁ, সম্পূর্ণরূপে',
            aboutMe: `আমি ${s.district} জেলার বাসিন্দা। পেশায় ${s.occupationDetails}। দ্বীন মেনে চলার চেষ্টা করি এবং একটি সুন্দর ইসলামিক পরিবার গড়তে চাই।`,
            partnerPreferences: isMale
              ? 'দ্বীনদার, পর্দানশীন ও পরিবারের প্রতি যত্নশীল পাত্রী চাই।'
              : 'দ্বীনদার, নামাজি ও হালাল উপার্জনকারী পাত্র চাই।',
            phoneNumber: `0170000${String(1000 + i)}`,
            guardianPhone: `0180000${String(1000 + i)}`,
          },
        },
      },
    });
    console.log(`  ✓ ${oderId ?? '(pending)'.padEnd(9)}  ${s.name}`);
  }

  console.log(`\n✅ Created ${seeds.length} dummy biodatas. Login: dummyNN@${DUMMY_DOMAIN} / ${DUMMY_PASSWORD}`);
}

(process.argv.includes('--clear') ? clear() : seed())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
