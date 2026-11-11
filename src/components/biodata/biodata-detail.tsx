'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useFormatter, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ToastAction } from '@/components/ui/toast';
import { toast } from '@/hooks/use-toast';
import { GenderAvatar } from '@/components/ui/gender-avatar';
import { cn } from '@/lib/utils';
import {
  User, MapPin, GraduationCap, Phone, Users, BookOpen, ArrowLeft, Ban, Heart, Share2, Briefcase,
  CircleDot, CalendarDays, Cake, MessageCircle, Send, Loader2, Flag, Gem, HeartHandshake, AlertTriangle, Pencil, Quote,
} from 'lucide-react';
import { toggleFavorite, checkFavoriteStatus } from '@/actions/favorite';
import { toggleIgnore, checkIgnoreStatus } from '@/actions/ignore';
import { sendConnectionRequest, checkConnectionStatus } from '@/actions/connection';
import { reportProfile } from '@/actions/report';
import { REPORT_REASONS } from '@/lib/constants';

interface ProfileData {
  id: string;
  oderId: string | null;
  displayName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  religion: string | null;
  sect: string | null;
  country: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  education: string | null;
  educationDetails: string | null;
  occupation: string | null;
  occupationDetails: string | null;
  monthlyIncome: string | null;
  maritalStatus: string | null;
  numberOfChildren: number | null;
  fatherAlive: boolean | null;
  motherAlive: boolean | null;
  siblings: number | null;
  familyType: string | null;
  familyStatus: string | null;
  prayerHabit: string | null;
  beardOrHijab: string | null;
  mazhab: string | null;
  aboutMe: string | null;
  partnerPreferences: string | null;
  photos: { url: string; isPrimary: boolean }[];
  phoneNumber: string | null;
  guardianPhone: string | null;
  approvedAt: string | null;
  createdAt: string | null;
  isOwn: boolean;
  // Imported biodata: contact numbers are free for any logged-in member
  freeContact?: boolean;
}

type Row = { label: string; value: React.ReactNode };

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  return new Date().getFullYear() - new Date(dob).getFullYear();
}

/**
 * Public biodata page. `slug` is the biodata no. (ZBF-00010) or, for profiles without one, the internal ID;
 * the API resolves either, and all actions use the resolved `profile.id`.
 */
export function BiodataDetail({ slug }: { slug: string }) {
  const t = useTranslations('biodata');
  const tc = useTranslations('common');
  const tm = useTranslations('maritalStatus');
  const td = useTranslations('divisions');
  const to = useTranslations('options');
  const format = useFormatter();
  // Translate stored Bengali option values for display; free text is shown as entered
  const opt = (value: string | null) => (value && to.has(value) ? to(value) : value);
  const genderLabel = (gender: string) => (gender === 'MALE' ? tc('male') : gender === 'FEMALE' ? tc('female') : gender);
  const router = useRouter();
  const pathname = usePathname();
  const { status: sessionStatus } = useSession();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname)}`;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFavorite, setIsFavorite] = useState(false);
  const [isIgnored, setIsIgnored] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || t('loadError'));
        } else {
          setProfile(data.profile);
        }
      } catch {
        setError(t('serverError'));
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps -- t is stable

  const profileId = profile?.id;

  // Check favorite/ignore/connection status for logged-in users
  useEffect(() => {
    async function checkStatuses() {
      if (sessionStatus === 'authenticated' && profileId) {
        const [favResult, ignResult, connResult] = await Promise.all([
          checkFavoriteStatus(profileId),
          checkIgnoreStatus(profileId),
          checkConnectionStatus(profileId),
        ]);
        if (favResult.success) setIsFavorite(favResult.isFavorite);
        if (ignResult.success) setIsIgnored(ignResult.isIgnored);
        if (connResult.success) setConnectionStatus(connResult.status);
      }
    }
    checkStatuses();
  }, [sessionStatus, profileId]);

  const requireLogin = () => {
    if (sessionStatus === 'authenticated') return false;
    router.push(loginHref);
    return true;
  };

  const handleFavorite = async () => {
    if (!profileId || requireLogin()) return;
    setActionLoading('favorite');
    const result = await toggleFavorite(profileId);
    if (result.success && result.isFavorite !== undefined) {
      setIsFavorite(result.isFavorite);
    } else if (!result.success) {
      toast({ variant: 'destructive', title: tc('error'), description: result.error });
    }
    setActionLoading(null);
  };

  const handleIgnore = async () => {
    if (!profileId || requireLogin()) return;
    setActionLoading('ignore');
    const result = await toggleIgnore(profileId);
    if (result.success && result.isIgnored !== undefined) {
      setIsIgnored(result.isIgnored);
    } else if (!result.success) {
      toast({ variant: 'destructive', title: tc('error'), description: result.error });
    }
    setActionLoading(null);
  };

  const handleConnect = async () => {
    if (!profileId || requireLogin()) return;
    setActionLoading('connect');
    const result = await sendConnectionRequest(profileId);
    if (result.success) {
      setConnectionStatus('PENDING');
      toast({ variant: 'success', title: t('requestSentToast') });
    } else {
      toast({
        variant: 'destructive',
        title: tc('error'),
        description: result.error,
        // Out of credits: point straight to where more can be bought
        action: 'insufficientCredits' in result && result.insufficientCredits ? (
          <ToastAction altText={t('getCredits')} onClick={() => router.push('/credits')}>
            {t('getCredits')}
          </ToastAction>
        ) : undefined,
      });
    }
    setActionLoading(null);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = profile?.oderId ? t('shareTitle', { no: profile.oderId }) : document.title;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ variant: 'success', title: t('linkCopied') });
      }
    } catch {
      // Share sheet dismissed; nothing to do
    }
  };

  const openReport = () => {
    if (requireLogin()) return;
    setReportOpen(true);
  };

  const handleReport = async () => {
    if (!reportReason || !profileId) return;
    setActionLoading('report');
    const result = await reportProfile({ profileId, reason: reportReason, details: reportDetails });
    if (result.success) {
      toast({ variant: 'success', title: t('reportSent'), description: t('reportSentBody') });
      setReportOpen(false);
      setReportReason('');
      setReportDetails('');
    } else {
      toast({ variant: 'destructive', title: tc('error'), description: result.error });
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto" />
        <p className="mt-4 text-gray-500">{t('loading')}</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{t('notFound')}</h1>
        <p className="text-gray-500 mb-6">{error || t('notFoundBody')}</p>
        <Link href="/browse">
          <Button><ArrowLeft className="h-4 w-4 mr-2" /> {t('backToBrowse')}</Button>
        </Link>
      </div>
    );
  }

  const age = calcAge(profile.dateOfBirth);
  const primaryPhoto = profile.photos.find(p => p.isPrimary) || profile.photos[0];
  const division = profile.division && td.has(profile.division) ? td(profile.division) : profile.division;
  const aliveLabel = (v: boolean | null) => (v === true ? t('alive') : v === false ? t('deceased') : null);
  const longText = (text: string | null) => text && <span className="whitespace-pre-wrap leading-relaxed">{text}</span>;

  const facts: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null }[] = [
    { icon: CircleDot, label: t('maritalStatus'), value: profile.maritalStatus ? tm(profile.maritalStatus) : null },
    { icon: Cake, label: t('age'), value: age === null ? null : tc('years', { age }) },
    {
      icon: CalendarDays,
      label: t('birthYear'),
      value: profile.dateOfBirth ? format.dateTime(new Date(profile.dateOfBirth), { month: 'long', year: 'numeric' }) : null,
    },
    { icon: MapPin, label: t('address'), value: [profile.district, division].filter(Boolean).join(', ') || null },
    { icon: Briefcase, label: t('occupation'), value: opt(profile.occupation) },
    { icon: BookOpen, label: t('mazhab'), value: opt(profile.mazhab) },
  ];

  const sections: { icon: React.ComponentType<{ className?: string }>; title: string; rows: Row[] }[] = [
    {
      icon: MapPin,
      title: t('address'),
      rows: [
        { label: t('country'), value: opt(profile.country) || t('bangladesh') },
        { label: t('division'), value: division },
        { label: t('district'), value: profile.district },
        { label: t('upazila'), value: profile.upazila },
      ],
    },
    {
      icon: GraduationCap,
      title: t('education'),
      rows: [
        { label: t('highestEducation'), value: opt(profile.education) },
        { label: t('educationDetails'), value: longText(profile.educationDetails) },
      ],
    },
    {
      icon: Users,
      title: t('familyInfo'),
      rows: [
        { label: t('father'), value: aliveLabel(profile.fatherAlive) },
        { label: t('mother'), value: aliveLabel(profile.motherAlive) },
        { label: t('siblings'), value: profile.siblings !== null ? t('persons', { count: profile.siblings }) : null },
        { label: t('familyType'), value: opt(profile.familyType) },
        { label: t('familyStatus'), value: opt(profile.familyStatus) },
      ],
    },
    {
      icon: User,
      title: t('personalInfo'),
      rows: [
        { label: t('gender'), value: profile.gender ? genderLabel(profile.gender) : null },
        { label: t('religion'), value: opt(profile.religion) },
        { label: t('sect'), value: opt(profile.sect) },
        { label: t('mazhab'), value: opt(profile.mazhab) },
        { label: t('prayer'), value: opt(profile.prayerHabit) },
        { label: profile.gender === 'MALE' ? t('beard') : t('hijab'), value: opt(profile.beardOrHijab) },
        { label: t('aboutMe'), value: longText(profile.aboutMe) },
      ],
    },
    {
      icon: Briefcase,
      title: t('professionInfo'),
      rows: [
        { label: t('occupation'), value: opt(profile.occupation) },
        { label: t('occupationDetails'), value: longText(profile.occupationDetails) },
        { label: t('monthlyIncome'), value: opt(profile.monthlyIncome) },
      ],
    },
    {
      icon: Gem,
      title: t('marriageInfo'),
      rows: [
        { label: t('maritalStatus'), value: profile.maritalStatus ? tm(profile.maritalStatus) : null },
        {
          label: t('children'),
          value: profile.numberOfChildren ? t('persons', { count: profile.numberOfChildren }) : null,
        },
      ],
    },
    {
      icon: HeartHandshake,
      title: t('partnerSection'),
      rows: [{ label: t('partnerPreferences'), value: longText(profile.partnerPreferences) }],
    },
  ];

  const hasContact = !!(profile.phoneNumber || profile.guardianPhone);

  // Contact button, shared by the sidebar and the contact section
  const connectButton = (className?: string) => {
    // Imported biodata: no connection needed, just log in
    if (profile.freeContact) {
      if (hasContact) return null;
      if (sessionStatus === 'unauthenticated') {
        return (
          <Link href={loginHref} className={cn('block', className)}>
            <Button className="w-full h-11 rounded-xl">{t('loginToContact')}</Button>
          </Link>
        );
      }
      return null;
    }
    if (sessionStatus === 'unauthenticated') {
      return (
        <Link href={loginHref} className={cn('block', className)}>
          <Button className="w-full h-11 rounded-xl">{t('loginToContact')}</Button>
        </Link>
      );
    }
    if (connectionStatus === 'ACCEPTED') {
      return (
        <Link href={`/messages?profile=${profile.id}`} className={cn('block', className)}>
          <Button className="w-full h-11 rounded-xl"><MessageCircle className="h-4 w-4 mr-2" />{t('message')}</Button>
        </Link>
      );
    }
    if (connectionStatus === 'PENDING') {
      return (
        <Button variant="secondary" disabled className={cn('w-full h-11 rounded-xl', className)}>
          {t('requestSent')}
        </Button>
      );
    }
    return (
      <Button onClick={handleConnect} disabled={actionLoading === 'connect'} className={cn('w-full h-11 rounded-xl', className)}>
        {actionLoading === 'connect' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
        {t('requestContact')}
      </Button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/5">
            <div className="h-20 bg-gradient-to-br from-green-800 via-green-700 to-emerald-600" />
            <div className="-mt-12 flex flex-col items-center px-5 pb-5">
              {primaryPhoto ? (
                <img src={primaryPhoto.url} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-white" />
              ) : (
                <GenderAvatar gender={profile.gender} className="h-24 w-24 ring-4 ring-offset-0 ring-white" />
              )}
              <p className="mt-3 text-[13px] text-gray-500">{t('biodataNo')}</p>
              <p className="text-2xl font-bold tracking-wide text-gray-900">{profile.oderId ?? '—'}</p>

              <dl className="mt-4 w-full divide-y divide-gray-100 border-t border-gray-100">
                {facts.filter(f => f.value).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-3 py-2.5">
                    <dt className="flex items-center gap-2 text-[13px] text-gray-500">
                      <Icon className="h-4 w-4 text-green-700" />
                      {label}
                    </dt>
                    <dd className="text-right text-[14px] font-semibold text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>

              {profile.isOwn ? (
                <div className="mt-4 w-full space-y-2">
                  <p className="rounded-xl bg-green-50 px-3 py-2 text-center text-[13px] text-green-800">{t('ownBiodata')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/profile">
                      <SideAction icon={Pencil} label={t('editBiodata')} />
                    </Link>
                    <SideAction icon={Share2} label={t('share')} onClick={handleShare} />
                  </div>
                </div>
              ) : (
                <div className="mt-4 w-full space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <SideAction
                      icon={Heart}
                      label={isFavorite ? t('liked') : t('like')}
                      active={isFavorite}
                      activeClass="border-pink-300 bg-pink-50 text-pink-600 [&_svg]:fill-current"
                      loading={actionLoading === 'favorite'}
                      onClick={handleFavorite}
                    />
                    <SideAction
                      icon={Ban}
                      label={isIgnored ? t('disliked') : t('dislike')}
                      active={isIgnored}
                      activeClass="border-red-300 bg-red-50 text-red-600"
                      loading={actionLoading === 'ignore'}
                      onClick={handleIgnore}
                    />
                    <SideAction icon={Share2} label={t('share')} onClick={handleShare} />
                  </div>
                  {connectButton()}
                  <button
                    type="button"
                    onClick={openReport}
                    className="mx-auto flex items-center gap-1.5 text-[12px] text-gray-400 transition-colors hover:text-red-600"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    {t('report')}
                  </button>
                </div>
              )}
            </div>
          </div>

          <figure className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 py-5 text-center shadow-sm shadow-gray-900/5">
            <Quote className="absolute -bottom-2 -right-1 h-14 w-14 text-gray-100" />
            <blockquote className="relative text-[13px] italic leading-relaxed text-gray-600">“{t('verseBody')}”</blockquote>
            <figcaption className="relative mt-2 text-[12px] font-semibold text-green-800">{t('verseRef')}</figcaption>
          </figure>
        </aside>

        {/* Details */}
        <div className="space-y-5">
          {sections.map(section => (
            <DetailSection key={section.title} icon={section.icon} title={section.title} rows={section.rows} />
          ))}

          {!profile.isOwn && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/5 sm:p-7">
              <SectionTitle icon={Phone} title={t('contactTitle')} />
              {hasContact ? (
                <RowsTable rows={[
                  { label: t('mobile'), value: profile.phoneNumber },
                  { label: t('guardian'), value: profile.guardianPhone },
                ].filter(r => r.value)} />
              ) : (
                <div className="rounded-xl border border-dashed border-green-200 bg-green-50/60 p-5 text-center">
                  <p className="mx-auto max-w-md text-[14px] leading-relaxed text-gray-700">
                    {profile.freeContact
                      ? sessionStatus === 'unauthenticated' ? t('contactLoginRequired') : t('contactUnavailable')
                      : connectionStatus === 'PENDING' ? t('contactPending') : t('contactLocked')}
                  </p>
                  <div className="mx-auto mt-4 max-w-xs">{connectButton()}</div>
                </div>
              )}
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-yellow-100/60 px-4 py-3 text-[13px] leading-relaxed text-gray-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                <span><strong className="font-semibold">{t('caution')}</strong> {t('cautionBody')}</span>
              </p>
            </section>
          )}
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('reportTitle')}</DialogTitle>
            <DialogDescription>{t('reportBody')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-reason">{t('reportReason')}</Label>
              <select
                id="report-reason"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="">{t('reportSelectReason')}</option>
                {REPORT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>{t(`reportReasons.${reason}`)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-details">{t('reportDetails')}</Label>
              <Textarea
                id="report-details"
                value={reportDetails}
                maxLength={1000}
                onChange={(e) => setReportDetails(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>{tc('cancel')}</Button>
            <Button variant="destructive" onClick={handleReport} disabled={!reportReason || actionLoading === 'report'}>
              {actionLoading === 'report' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('reportSubmit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SideAction({ icon: Icon, label, onClick, active, activeClass, loading }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  active?: boolean;
  activeClass?: string;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-pressed={active}
      className={cn(
        'flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 text-[13px] font-semibold text-gray-700 transition-colors hover:border-green-300 hover:text-green-800 disabled:opacity-60',
        active && activeClass
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      <span className="truncate">{label}</span>
    </button>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <h2 className="mb-5 flex items-center gap-3 text-xl font-bold text-green-800">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-700">
        <Icon className="h-5 w-5" />
      </span>
      {title}
    </h2>
  );
}

function RowsTable({ rows }: { rows: Row[] }) {
  return (
    <dl className="overflow-hidden rounded-xl border border-gray-200">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={cn(
            'grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-0 sm:p-0',
            i % 2 === 0 && 'bg-gray-50',
            i > 0 && 'border-t border-gray-200'
          )}
        >
          <dt className="text-[13px] text-gray-500 sm:px-4 sm:py-3.5 sm:text-[14px]">{row.label}</dt>
          <dd className="text-[14px] font-medium text-gray-900 sm:border-l sm:border-gray-200 sm:px-4 sm:py-3.5">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DetailSection({ icon, title, rows }: { icon: React.ComponentType<{ className?: string }>; title: string; rows: Row[] }) {
  const filled = rows.filter(r => r.value);
  if (filled.length === 0) return null;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/5 sm:p-7">
      <SectionTitle icon={icon} title={title} />
      <RowsTable rows={filled} />
    </section>
  );
}
