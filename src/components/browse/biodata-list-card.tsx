'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { ArrowRight, CalendarDays, MapPin, CircleDot, GraduationCap, Briefcase, Heart } from 'lucide-react';
import { toggleFavorite } from '@/actions/favorite';
import { toast } from '@/hooks/use-toast';
import { GenderAvatar } from '@/components/ui/gender-avatar';
import { cn } from '@/lib/utils';
import { biodataHref } from '@/lib/biodata-url';

export interface BrowseProfile {
  id: string;
  oderId: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  division: string | null;
  district: string | null;
  education: string | null;
  occupation: string | null;
  maritalStatus: string | null;
  isFavorite: boolean;
  photos: { url: string }[];
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  return new Date().getFullYear() - new Date(dob).getFullYear();
}

/** Browse-grid card: avatar and biodata no. on the left, key facts on the right. */
export function BiodataListCard({ profile }: { profile: BrowseProfile }) {
  const t = useTranslations('browse');
  const tc = useTranslations('common');
  const tm = useTranslations('maritalStatus');
  const td = useTranslations('divisions');
  const to = useTranslations('options');
  const opt = (value: string) => (to.has(value) ? to(value) : value);
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [isFavorite, setIsFavorite] = useState(profile.isFavorite);
  const [saving, setSaving] = useState(false);
  const href = biodataHref(profile);

  const age = calcAge(profile.dateOfBirth);
  const rows = [
    { icon: CalendarDays, text: age === null ? null : tc('years', { age }) },
    {
      icon: MapPin,
      text: [profile.district, profile.division && (td.has(profile.division) ? td(profile.division) : profile.division)]
        .filter(Boolean).join(', ') || null,
    },
    { icon: CircleDot, text: profile.maritalStatus ? tm(profile.maritalStatus) : null },
    { icon: GraduationCap, text: profile.education ? opt(profile.education) : null },
    { icon: Briefcase, text: profile.occupation ? opt(profile.occupation) : null },
  ].filter(r => r.text);

  const onFavorite = async () => {
    if (sessionStatus !== 'authenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setSaving(true);
    const result = await toggleFavorite(profile.id);
    if (result.success && result.isFavorite !== undefined) {
      setIsFavorite(result.isFavorite);
    } else if (!result.success) {
      toast({ variant: 'destructive', title: tc('error'), description: result.error });
    }
    setSaving(false);
  };

  return (
    <div className="group relative flex overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/5 transition-all hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg hover:shadow-green-900/10">
      <Link href={href} className="flex w-[122px] shrink-0 flex-col items-center justify-center gap-3 border-r border-gray-100 bg-gray-50/80 px-3 py-5">
        {profile.photos?.[0] ? (
          <img src={profile.photos[0].url} alt="" className="h-[76px] w-[76px] rounded-full object-cover ring-1 ring-green-700/40 ring-offset-2 ring-offset-white" />
        ) : (
          <GenderAvatar gender={profile.gender} className="h-[76px] w-[76px]" />
        )}
        {profile.oderId && (
          <span className="whitespace-nowrap rounded-full bg-gray-200/70 px-2.5 py-1 text-[12px] font-medium tracking-wide text-gray-700">
            {profile.oderId}
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col py-4 pl-4 pr-3">
        <button
          type="button"
          onClick={onFavorite}
          disabled={saving}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? t('removeFavorite') : t('addFavorite')}
          className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
        >
          <Heart className={cn('h-[18px] w-[18px]', isFavorite && 'fill-red-500 text-red-500')} />
        </button>

        <ul className="space-y-2 pr-7">
          {rows.map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-center gap-2.5 text-[14px] text-gray-800">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="truncate">{text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex justify-end pt-3">
          <Link
            href={href}
            className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3.5 py-1.5 text-[13px] font-bold text-green-800 transition-colors group-hover:bg-green-700 group-hover:text-white"
          >
            {t('viewBiodata')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
