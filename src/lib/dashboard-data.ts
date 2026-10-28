import { cache } from 'react';
import { prisma } from './prisma';

/** The member's own biodata summary, fetched once per request and shared by the layout and pages */
export const getMyProfileSummary = cache((userId: string) =>
  prisma.profile.findUnique({
    where: { userId },
    select: { id: true, status: true, gender: true, oderId: true },
  })
);

export interface DashboardStats {
  balance: number;
  views: number;
  views30: number;
  views7: number;
  viewsToday: number;
  likedMe: number;
  favorites: number;
  ignored: number;
  purchases: number;
  sent: number;
  received: number;
}

/**
 * All member dashboard counters in a single query. The database is a network round trip
 * away, so one query with sub-selects is much faster than a dozen separate counts.
 */
export async function getDashboardStats(userId: string, since: { last30: Date; last7: Date; today: Date }) {
  const [row] = await prisma.$queryRaw<DashboardStats[]>`
    WITH my_views AS (
      SELECT rv."viewedAt" FROM recently_viewed rv
      JOIN profiles p ON p.id = rv."profileId"
      WHERE p."userId" = ${userId}
    )
    SELECT
      COALESCE((SELECT balance FROM credit_balances WHERE "userId" = ${userId}), 0)::int AS "balance",
      (SELECT COUNT(*) FROM my_views)::int AS "views",
      (SELECT COUNT(*) FROM my_views WHERE "viewedAt" >= ${since.last30})::int AS "views30",
      (SELECT COUNT(*) FROM my_views WHERE "viewedAt" >= ${since.last7})::int AS "views7",
      (SELECT COUNT(*) FROM my_views WHERE "viewedAt" >= ${since.today})::int AS "viewsToday",
      (SELECT COUNT(*) FROM favorites WHERE "profileId" = ${userId})::int AS "likedMe",
      (SELECT COUNT(*) FROM favorites WHERE "userId" = ${userId})::int AS "favorites",
      (SELECT COUNT(*) FROM ignored_profiles WHERE "userId" = ${userId})::int AS "ignored",
      (SELECT COUNT(*) FROM credit_ledger WHERE "userId" = ${userId} AND type = 'PURCHASE')::int AS "purchases",
      (SELECT COUNT(*) FROM connections WHERE "senderId" = ${userId})::int AS "sent",
      (SELECT COUNT(*) FROM connections WHERE "receiverId" = ${userId} AND status <> 'REJECTED')::int AS "received"
  `;
  return row;
}
