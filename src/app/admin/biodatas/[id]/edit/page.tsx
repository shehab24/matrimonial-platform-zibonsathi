export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { AdminBiodataEditForm } from '@/components/admin/biodata-edit-form';
import { STATUS_LABELS, STATUS_STYLES } from '@/lib/admin-labels';
import { adminBiodataHref } from '@/lib/biodata-url';

export default async function AdminBiodataEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw);
  const p = await prisma.profile.findFirst({ where: { OR: [{ oderId: id }, { id }] } });
  if (!p) notFound();

  const backHref = adminBiodataHref(p);
  const str = (v: string | null) => v ?? '';

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-green-700">
        <ArrowLeft className="h-4 w-4" /> বায়োডাটায় ফিরে যান
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900">বায়োডাটা সম্পাদনা</h1>
          <p className="text-sm text-gray-500 [overflow-wrap:anywhere]">
            {p.oderId ?? 'বায়োডাটা নং দেওয়া হয়নি'} · {p.displayName ?? 'নাম নেই'}
          </p>
        </div>
        <span className={`rounded-md px-3 py-1 text-sm font-semibold ${STATUS_STYLES[p.status]}`}>{STATUS_LABELS[p.status]}</span>
      </div>

      <p className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
        অ্যাডমিন সম্পাদনায় বায়োডাটার স্ট্যাটাস বদলায় না — অনুমোদিত বায়োডাটা সংরক্ষণের সাথে সাথেই আপডেট হয়ে প্রকাশিত থাকবে।
      </p>

      <AdminBiodataEditForm
        profileId={p.id}
        backHref={backHref}
        genderLocked={!!p.oderId}
        initial={{
          displayName: str(p.displayName),
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString().split('T')[0] : '',
          gender: str(p.gender),
          country: str(p.country),
          division: str(p.division),
          district: str(p.district),
          upazila: str(p.upazila),
          education: str(p.education),
          educationDetails: str(p.educationDetails),
          occupation: str(p.occupation),
          occupationDetails: str(p.occupationDetails),
          monthlyIncome: str(p.monthlyIncome),
          maritalStatus: str(p.maritalStatus),
          numberOfChildren: p.numberOfChildren?.toString() ?? '',
          fatherAlive: p.fatherAlive === null ? '' : String(p.fatherAlive),
          motherAlive: p.motherAlive === null ? '' : String(p.motherAlive),
          siblings: p.siblings?.toString() ?? '',
          familyType: str(p.familyType),
          familyStatus: str(p.familyStatus),
          prayerHabit: str(p.prayerHabit),
          beardOrHijab: str(p.beardOrHijab),
          mazhab: str(p.mazhab),
          sect: str(p.sect),
          aboutMe: str(p.aboutMe),
          partnerPreferences: str(p.partnerPreferences),
          phoneNumber: str(p.phoneNumber),
          guardianPhone: str(p.guardianPhone),
        }}
      />
    </div>
  );
}
