export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, User } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { BiodataReviewActions } from '@/components/admin/biodata-review-actions';
import { GENDER_LABELS, MARITAL_LABELS, STATUS_LABELS, STATUS_STYLES, bnDate, bnNumber } from '@/lib/admin-labels';

const yesNo = (v: boolean | null) => (v === null ? null : v ? 'জীবিত' : 'মৃত');

function calcAge(dob: Date | null) {
  return dob ? new Date().getFullYear() - dob.getFullYear() : null;
}

function Section({ title, rows }: { title: string; rows: [string, React.ReactNode][] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <h2 className="px-5 py-3 border-b border-gray-200 font-semibold text-gray-900">{title}</h2>
      <dl className="divide-y divide-gray-100">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[150px_1fr] gap-3 px-5 py-2.5 text-sm">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-gray-900 whitespace-pre-wrap break-words">{value ?? <span className="text-gray-400">—</span>}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default async function AdminBiodataDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.profile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true, createdAt: true, isSuspended: true, emailVerified: true } },
      photos: true,
    },
  });
  if (!p) notFound();

  const age = calcAge(p.dateOfBirth);
  const [reportsAgainst, favoritedBy] = await Promise.all([
    prisma.report.count({ where: { targetId: p.userId } }),
    prisma.favorite.count({ where: { profileId: p.userId } }),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/admin/biodatas" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-green-700">
        <ArrowLeft className="h-4 w-4" /> সকল বায়োডাটা
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-green-700 bg-green-50">
          {p.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photos[0].url} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-green-700" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900">{p.displayName ?? 'নাম নেই'}</h1>
          <p className="text-sm text-gray-500">
            {p.oderId ?? 'বায়োডাটা নং দেওয়া হয়নি'} · {p.user.email}
          </p>
        </div>
        <span className={`rounded-md px-3 py-1 text-sm font-semibold ${STATUS_STYLES[p.status]}`}>{STATUS_LABELS[p.status]}</span>
        {p.status === 'APPROVED' && (
          <Link href={`/profile/${p.id}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-green-700 hover:underline">
            পাবলিক পেজ <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="space-y-6">
          <Section title="মৌলিক তথ্য" rows={[
            ['লিঙ্গ', p.gender ? GENDER_LABELS[p.gender] : null],
            ['জন্মতারিখ', p.dateOfBirth ? `${bnDate(p.dateOfBirth)} (${bnNumber(age!)} বছর)` : null],
            ['বৈবাহিক অবস্থা', p.maritalStatus ? MARITAL_LABELS[p.maritalStatus] : null],
            ['সন্তান সংখ্যা', p.numberOfChildren !== null ? bnNumber(p.numberOfChildren) : null],
            ['ঠিকানা', [p.upazila, p.district, p.division, p.country].filter(Boolean).join(', ') || null],
          ]} />
          <Section title="শিক্ষা ও পেশা" rows={[
            ['শিক্ষাগত যোগ্যতা', p.education],
            ['শিক্ষার বিস্তারিত', p.educationDetails],
            ['পেশা', p.occupation],
            ['পেশার বিস্তারিত', p.occupationDetails],
            ['মাসিক আয়', p.monthlyIncome],
          ]} />
          <Section title="পারিবারিক ও ধর্মীয় তথ্য" rows={[
            ['পিতা', yesNo(p.fatherAlive)],
            ['মাতা', yesNo(p.motherAlive)],
            ['ভাই-বোন', p.siblings !== null ? bnNumber(p.siblings) : null],
            ['পরিবারের ধরন', p.familyType],
            ['পারিবারিক অবস্থা', p.familyStatus],
            ['নামাজ', p.prayerHabit],
            ['দাড়ি/হিজাব', p.beardOrHijab],
            ['মাযহাব', p.mazhab],
            ['সম্প্রদায়', p.sect],
          ]} />
          <Section title="নিজের সম্পর্কে ও প্রত্যাশা" rows={[
            ['নিজের সম্পর্কে', p.aboutMe],
            ['জীবনসাথীর প্রত্যাশা', p.partnerPreferences],
          ]} />
        </div>

        <div className="space-y-6 xl:sticky xl:top-24">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-3">সিদ্ধান্ত</h2>
            {p.adminNote && (
              <p className="mb-3 rounded-md bg-gray-50 p-3 text-xs text-gray-600">
                <span className="font-semibold">আগের নোট:</span> {p.adminNote}
              </p>
            )}
            <BiodataReviewActions profileId={p.id} status={p.status} />
          </div>

          <Section title="যোগাযোগ (শুধু অ্যাডমিন)" rows={[
            ['মোবাইল', p.phoneNumber],
            ['অভিভাবক', p.guardianPhone],
          ]} />

          <Section title="অ্যাকাউন্ট" rows={[
            ['নাম', p.user.name],
            ['ইমেইল', p.user.email],
            ['নিবন্ধন', bnDate(p.user.createdAt)],
            ['অ্যাকাউন্ট', p.user.isSuspended ? 'স্থগিত' : 'সক্রিয়'],
            ['পছন্দ করেছেন', `${bnNumber(favoritedBy)} জন`],
            ['রিপোর্ট', `${bnNumber(reportsAgainst)} টি`],
            ['শেষ আপডেট', bnDate(p.updatedAt)],
          ]} />
        </div>
      </div>
    </div>
  );
}
