'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, CalendarDays, MapPin, CircleDot, GraduationCap, Briefcase, User } from 'lucide-react';

export interface BiodataSummary {
  id: string;
  oderId: string | null;
  displayName: string | null;
  dateOfBirth: string | Date | null;
  gender: string | null;
  division: string | null;
  district: string | null;
  education: string | null;
  occupation: string | null;
  maritalStatus: string | null;
  photos?: { url: string }[];
}

function calcAge(dob: string | Date | null): number | null {
  if (!dob) return null;
  return new Date().getFullYear() - new Date(dob).getFullYear();
}

/**
 * Compact biodata card used across the dashboard lists.
 * `action` sits top-right (e.g. a remove button); `footer` renders under the details (status, accept/reject).
 */
export function BiodataCard({
  profile,
  action,
  footer,
}: {
  profile: BiodataSummary;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const tm = useTranslations('maritalStatus');
  const to = useTranslations('options');
  const opt = (value: string | null) => (value && to.has(value) ? to(value) : value);
  const age = calcAge(profile.dateOfBirth);
  const location = [profile.district, profile.division].filter(Boolean).join(', ');

  const rows = [
    { icon: CalendarDays, value: age !== null ? tc('years', { age }) : null },
    { icon: MapPin, value: location || null },
    { icon: CircleDot, value: profile.maritalStatus ? tm(profile.maritalStatus) : null },
    { icon: GraduationCap, value: opt(profile.education) },
    { icon: Briefcase, value: opt(profile.occupation) },
  ].filter((row) => row.value);

  return (
    <div className="flex rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Avatar + biodata ID */}
      <div className="flex w-32 sm:w-36 shrink-0 flex-col items-center justify-center gap-3 border-r border-gray-200 bg-gray-50 px-3 py-5">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-green-700 bg-green-50">
          {profile.photos?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photos[0].url} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-green-700" />
          )}
        </div>
        <span className="rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          {profile.oderId ?? '—'}
        </span>
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <ul className="min-w-0 space-y-2">
            {rows.map(({ icon: Icon, value }, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <Icon className="h-3.5 w-3.5 text-gray-500" />
                </span>
                <span className="truncate">{value}</span>
              </li>
            ))}
          </ul>
          {action}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <div className="flex flex-wrap items-center gap-2">{footer}</div>
          <Link
            href={`/profile/${profile.id}`}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100"
          >
            {t('viewBiodata')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
