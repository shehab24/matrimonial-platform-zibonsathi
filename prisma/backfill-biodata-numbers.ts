import { PrismaClient, ProfileStatus } from '@prisma/client';

/**
 * One-off: give a biodata no. to biodatas that were submitted before numbers were assigned on submission
 * (they only got one on approval). Oldest first, so earlier submissions get lower numbers. Safe to re-run.
 *   npm run db:backfill:numbers
 */

const prisma = new PrismaClient();

async function nextNumber(prefix: 'ZBM' | 'ZBF'): Promise<string> {
  const last = await prisma.profile.findFirst({
    where: { oderId: { startsWith: prefix } },
    orderBy: { oderId: 'desc' },
    select: { oderId: true },
  });
  const n = (parseInt(last?.oderId?.match(/\d+$/)?.[0] ?? '0', 10) || 0) + 1;
  return `${prefix}-${n.toString().padStart(5, '0')}`;
}

async function main() {
  const profiles = await prisma.profile.findMany({
    where: { oderId: null, gender: { not: null }, status: ProfileStatus.PENDING_APPROVAL },
    orderBy: { createdAt: 'asc' },
    select: { id: true, gender: true },
  });

  for (const p of profiles) {
    const oderId = await nextNumber(p.gender === 'MALE' ? 'ZBM' : 'ZBF');
    await prisma.profile.update({ where: { id: p.id }, data: { oderId } });
    console.log(`${p.id} → ${oderId}`);
  }
  console.log(`Done: ${profiles.length} biodata(s) numbered.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
