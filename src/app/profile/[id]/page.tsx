'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ToastAction } from '@/components/ui/toast';
import { toast } from '@/hooks/use-toast';
import {
  User, MapPin, GraduationCap, Phone,
  Users, BookOpen, ArrowLeft, Star, Ban,
  MessageCircle, Send, Loader2, Flag
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
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  return today.getFullYear() - birth.getFullYear();
}

export default function ProfileDetailPage() {
  const t = useTranslations('biodata');
  const tc = useTranslations('common');
  const tm = useTranslations('maritalStatus');
  const td = useTranslations('divisions');
  const to = useTranslations('options');
  // Translate stored Bengali option values for display; free text is shown as entered
  const opt = (value: string | null) => (value && to.has(value) ? to(value) : value);
  const genderLabel = (gender: string) => (gender === 'MALE' ? tc('male') : gender === 'FEMALE' ? tc('female') : gender);
  const params = useParams();
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const profileId = params.id as string;

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
        const res = await fetch(`/api/profile/${profileId}`);
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
  }, [profileId]);

  // Check favorite/ignore/connection status for logged-in users
  useEffect(() => {
    async function checkStatuses() {
      if (sessionStatus === 'authenticated' && profile) {
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
  }, [sessionStatus, profile, profileId]);

  const handleFavorite = async () => {
    if (sessionStatus !== 'authenticated') {
      router.push(`/login?callbackUrl=/profile/${profileId}`);
      return;
    }
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
    if (sessionStatus !== 'authenticated') {
      router.push(`/login?callbackUrl=/profile/${profileId}`);
      return;
    }
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
    if (sessionStatus !== 'authenticated') {
      router.push(`/login?callbackUrl=/profile/${profileId}`);
      return;
    }
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

  const openReport = () => {
    if (sessionStatus !== 'authenticated') {
      router.push(`/login?callbackUrl=/profile/${profileId}`);
      return;
    }
    setReportOpen(true);
  };

  const handleReport = async () => {
    if (!reportReason) return;
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/browse" className="inline-flex items-center text-gray-600 hover:text-green-600 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('allProfiles')}
        </Link>
      </div>

      {/* Header Card */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0 ring-4 ring-white/30">
              {primaryPhoto ? (
                <img src={primaryPhoto.url} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {profile.oderId && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                    {profile.oderId}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">{profile.displayName || t('noName')}</h1>
              <p className="text-white/80 mt-1">
                {age && tc('years', { age })}
                {profile.gender && ` • ${genderLabel(profile.gender)}`}
                {profile.maritalStatus && ` • ${tm(profile.maritalStatus)}`}
              </p>
              {(profile.district || profile.division) && (
                <p className="text-white/70 text-sm mt-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {[profile.district, profile.division].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - not shown on the viewer's own biodata */}
        {!profile.isOwn && (
        <CardContent className="p-4 bg-gray-50 border-t">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={isFavorite ? "default" : "outline"}
              size="sm"
              onClick={handleFavorite}
              disabled={actionLoading === 'favorite'}
              className={isFavorite ? 'bg-pink-500 hover:bg-pink-600' : ''}
            >
              {actionLoading === 'favorite' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Star className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
              )}
              {isFavorite ? t('inFavorites') : t('addFavorite')}
            </Button>

            <Button
              variant={isIgnored ? "destructive" : "outline"}
              size="sm"
              onClick={handleIgnore}
              disabled={actionLoading === 'ignore'}
            >
              {actionLoading === 'ignore' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              {isIgnored ? t('ignored') : t('ignore')}
            </Button>

            {connectionStatus === null && (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={actionLoading === 'connect'}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === 'connect' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {t('requestContact')}
              </Button>
            )}

            {connectionStatus === 'PENDING' && (
              <Button size="sm" variant="secondary" disabled>
                <Loader2 className="h-4 w-4 mr-2" />
                {t('requestSent')}
              </Button>
            )}

            {connectionStatus === 'ACCEPTED' && (
              <Link href={`/messages?profile=${profileId}`}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t('message')}
                </Button>
              </Link>
            )}

            <Button size="sm" variant="ghost" onClick={openReport} className="ml-auto text-gray-500 hover:text-red-600">
              <Flag className="h-4 w-4 mr-2" />
              {t('report')}
            </Button>
          </div>
        </CardContent>
        )}
      </Card>

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

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              {t('basicInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label={t('biodataNo')} value={profile.oderId} />
            <InfoRow label={t('age')} value={age ? tc('years', { age }) : null} />
            <InfoRow label={t('gender')} value={profile.gender ? genderLabel(profile.gender) : null} />
            <InfoRow label={t('maritalStatus')} value={profile.maritalStatus ? tm(profile.maritalStatus) : null} />
            {profile.numberOfChildren !== null && profile.numberOfChildren > 0 && (
              <InfoRow label={t('children')} value={t('persons', { count: profile.numberOfChildren })} />
            )}
            <InfoRow label={t('religion')} value={opt(profile.religion)} />
            <InfoRow label={t('mazhab')} value={opt(profile.mazhab)} />
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              {t('address')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label={t('country')} value={opt(profile.country) || t('bangladesh')} />
            <InfoRow label={t('division')} value={profile.division && td.has(profile.division) ? td(profile.division) : profile.division} />
            <InfoRow label={t('district')} value={profile.district} />
            <InfoRow label={t('upazila')} value={profile.upazila} />
          </CardContent>
        </Card>

        {/* Education & Work */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              {t('educationOccupation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label={t('education')} value={opt(profile.education)} />
            {profile.educationDetails && (
              <InfoRow label={t('details')} value={profile.educationDetails} />
            )}
            <InfoRow label={t('occupation')} value={opt(profile.occupation)} />
            {profile.occupationDetails && (
              <InfoRow label={t('occupationDetails')} value={profile.occupationDetails} />
            )}
            <InfoRow label={t('monthlyIncome')} value={opt(profile.monthlyIncome)} />
          </CardContent>
        </Card>

        {/* Family */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              {t('familyInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label={t('father')} value={profile.fatherAlive === true ? t('alive') : profile.fatherAlive === false ? t('deceased') : null} />
            <InfoRow label={t('mother')} value={profile.motherAlive === true ? t('alive') : profile.motherAlive === false ? t('deceased') : null} />
            <InfoRow label={t('siblings')} value={profile.siblings !== null ? t('persons', { count: profile.siblings }) : null} />
            <InfoRow label={t('familyType')} value={opt(profile.familyType)} />
            <InfoRow label={t('familyStatus')} value={opt(profile.familyStatus)} />
          </CardContent>
        </Card>

        {/* Religious */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              {t('religiousInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label={t('prayer')} value={opt(profile.prayerHabit)} />
            <InfoRow label={profile.gender === 'MALE' ? t('beard') : t('hijab')} value={opt(profile.beardOrHijab)} />
            <InfoRow label={t('mazhab')} value={opt(profile.mazhab)} />
          </CardContent>
        </Card>

        {/* Contact (if connected) */}
        {(profile.phoneNumber || profile.guardianPhone) && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                <Phone className="h-5 w-5" />
                {t('contactConnected')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.phoneNumber && <InfoRow label={t('mobile')} value={profile.phoneNumber} />}
              {profile.guardianPhone && <InfoRow label={t('guardian')} value={profile.guardianPhone} />}
            </CardContent>
          </Card>
        )}
      </div>

      {/* About Me & Preferences */}
      {(profile.aboutMe || profile.partnerPreferences) && (
        <div className="grid grid-cols-1 gap-6 mt-6">
          {profile.aboutMe && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('aboutMe')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{profile.aboutMe}</p>
              </CardContent>
            </Card>
          )}
          {profile.partnerPreferences && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('partnerPreferences')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{profile.partnerPreferences}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* CTA for non-logged users */}
      {sessionStatus === 'unauthenticated' && (
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('interested')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('loginPrompt')}
            </p>
            <div className="flex justify-center gap-3">
              <Link href={`/login?callbackUrl=/profile/${profileId}`}>
                <Button className="bg-green-600 hover:bg-green-700">{t('login')}</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">{t('register')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-gray-900 text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}
