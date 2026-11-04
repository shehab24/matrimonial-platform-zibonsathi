import { permanentRedirect } from 'next/navigation';
import { ProfileStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { BiodataDetail } from '@/components/biodata/biodata-detail';

// Old internal-ID links (/profile/<id>) move to the public /biodata/<biodata no.> URL.
// Only public biodatas redirect, so the number of a hidden profile is never revealed.
export default async function ProfileByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id },
    select: { oderId: true, status: true, isVisible: true },
  });
  if (profile?.oderId && profile.status === ProfileStatus.APPROVED && profile.isVisible) {
    permanentRedirect(`/biodata/${profile.oderId}`);
  }
  return <BiodataDetail slug={id} />;
}
