'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, MapPin, GraduationCap, Briefcase, Heart, Phone, 
  Calendar, Users, Home, BookOpen, ArrowLeft, Star, Ban,
  MessageCircle, Send, Check, X, Loader2
} from 'lucide-react';
import { toggleFavorite, checkFavoriteStatus } from '@/actions/favorite';
import { toggleIgnore, checkIgnoreStatus } from '@/actions/ignore';
import { sendConnectionRequest, checkConnectionStatus } from '@/actions/connection';

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
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  return today.getFullYear() - birth.getFullYear();
}

const maritalLabels: Record<string, string> = {
  NEVER_MARRIED: 'অবিবাহিত',
  DIVORCED: 'তালাকপ্রাপ্ত',
  WIDOWED: 'বিধবা/বিপত্নীক',
};

const genderLabels: Record<string, string> = {
  MALE: 'পুরুষ',
  FEMALE: 'মহিলা',
};

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [isIgnored, setIsIgnored] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/profile/${profileId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'প্রোফাইল লোড করতে সমস্যা হয়েছে');
        } else {
          setProfile(data.profile);
        }
      } catch {
        setError('সার্ভারে সমস্যা হয়েছে');
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
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto" />
        <p className="mt-4 text-gray-500">প্রোফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">প্রোফাইল পাওয়া যায়নি</h1>
        <p className="text-gray-500 mb-6">{error || 'এই প্রোফাইলটি বিদ্যমান নেই বা মুছে ফেলা হয়েছে'}</p>
        <Link href="/browse">
          <Button><ArrowLeft className="h-4 w-4 mr-2" /> ব্রাউজে ফিরুন</Button>
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
          সব প্রোফাইল দেখুন
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
              <h1 className="text-2xl sm:text-3xl font-bold">{profile.displayName || 'নাম দেওয়া হয়নি'}</h1>
              <p className="text-white/80 mt-1">
                {age && `${age} বছর`}
                {profile.gender && ` • ${genderLabels[profile.gender] || profile.gender}`}
                {profile.maritalStatus && ` • ${maritalLabels[profile.maritalStatus] || profile.maritalStatus}`}
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

        {/* Action Buttons */}
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
              {isFavorite ? 'পছন্দে আছে' : 'পছন্দে রাখুন'}
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
              {isIgnored ? 'উপেক্ষা করা হয়েছে' : 'উপেক্ষা করুন'}
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
                যোগাযোগের অনুরোধ
              </Button>
            )}

            {connectionStatus === 'PENDING' && (
              <Button size="sm" variant="secondary" disabled>
                <Loader2 className="h-4 w-4 mr-2" />
                অনুরোধ পাঠানো হয়েছে
              </Button>
            )}

            {connectionStatus === 'ACCEPTED' && (
              <Link href={`/messages?profile=${profileId}`}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  মেসেজ করুন
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              প্রাথমিক তথ্য
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="বায়োডাটা নং" value={profile.oderId} />
            <InfoRow label="বয়স" value={age ? `${age} বছর` : null} />
            <InfoRow label="লিঙ্গ" value={profile.gender ? genderLabels[profile.gender] : null} />
            <InfoRow label="বৈবাহিক অবস্থা" value={profile.maritalStatus ? maritalLabels[profile.maritalStatus] : null} />
            {profile.numberOfChildren !== null && profile.numberOfChildren > 0 && (
              <InfoRow label="সন্তান সংখ্যা" value={`${profile.numberOfChildren} জন`} />
            )}
            <InfoRow label="ধর্ম" value={profile.religion} />
            <InfoRow label="মাযহাব" value={profile.mazhab} />
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              ঠিকানা
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="দেশ" value={profile.country || 'বাংলাদেশ'} />
            <InfoRow label="বিভাগ" value={profile.division} />
            <InfoRow label="জেলা" value={profile.district} />
            <InfoRow label="উপজেলা" value={profile.upazila} />
          </CardContent>
        </Card>

        {/* Education & Work */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              শিক্ষা ও পেশা
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="শিক্ষাগত যোগ্যতা" value={profile.education} />
            {profile.educationDetails && (
              <InfoRow label="বিস্তারিত" value={profile.educationDetails} />
            )}
            <InfoRow label="পেশা" value={profile.occupation} />
            {profile.occupationDetails && (
              <InfoRow label="পেশার বিস্তারিত" value={profile.occupationDetails} />
            )}
            <InfoRow label="মাসিক আয়" value={profile.monthlyIncome} />
          </CardContent>
        </Card>

        {/* Family */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              পারিবারিক তথ্য
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="বাবা" value={profile.fatherAlive === true ? 'জীবিত' : profile.fatherAlive === false ? 'মৃত' : null} />
            <InfoRow label="মা" value={profile.motherAlive === true ? 'জীবিত' : profile.motherAlive === false ? 'মৃত' : null} />
            <InfoRow label="ভাই-বোন" value={profile.siblings !== null ? `${profile.siblings} জন` : null} />
            <InfoRow label="পরিবারের ধরন" value={profile.familyType} />
            <InfoRow label="পারিবারিক অবস্থা" value={profile.familyStatus} />
          </CardContent>
        </Card>

        {/* Religious */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              ধর্মীয় তথ্য
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="নামাজ" value={profile.prayerHabit} />
            <InfoRow label={profile.gender === 'MALE' ? 'দাড়ি' : 'পর্দা/হিজাব'} value={profile.beardOrHijab} />
            <InfoRow label="মাযহাব" value={profile.mazhab} />
          </CardContent>
        </Card>

        {/* Contact (if connected) */}
        {(profile.phoneNumber || profile.guardianPhone) && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                <Phone className="h-5 w-5" />
                যোগাযোগ (সংযুক্ত)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.phoneNumber && <InfoRow label="মোবাইল" value={profile.phoneNumber} />}
              {profile.guardianPhone && <InfoRow label="অভিভাবক" value={profile.guardianPhone} />}
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
                <CardTitle className="text-lg">নিজের সম্পর্কে</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{profile.aboutMe}</p>
              </CardContent>
            </Card>
          )}
          {profile.partnerPreferences && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">জীবনসঙ্গীর পছন্দ</CardTitle>
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
              এই প্রোফাইলে আগ্রহী?
            </h3>
            <p className="text-gray-600 mb-4">
              যোগাযোগের অনুরোধ পাঠাতে বা পছন্দে যোগ করতে লগইন করুন
            </p>
            <div className="flex justify-center gap-3">
              <Link href={`/login?callbackUrl=/profile/${profileId}`}>
                <Button className="bg-green-600 hover:bg-green-700">লগইন করুন</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">রেজিস্ট্রার করুন</Button>
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
