export const dynamic = 'force-dynamic';
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { getMyProfile, upsertProfile, submitForApproval } from '@/actions/profile';
import { CheckCircle, ChevronRight, ChevronLeft, Send } from 'lucide-react';

const steps = [
  'মৌলিক তথ্য',
  'শিক্ষা ও পেশা',
  'পারিবারিক তথ্য',
  'ধর্মীয় তথ্য',
  'নিজের সম্পর্কে',
  'যোগাযোগ তথ্য',
];

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'warning' | 'success' | 'outline' }> = {
  DRAFT: { label: 'খসড়া', variant: 'secondary' },
  PENDING_APPROVAL: { label: 'পর্যালোচনাধীন', variant: 'warning' },
  APPROVED: { label: 'অনুমোদিত', variant: 'success' },
  REJECTED: { label: 'প্রত্যাখ্যাত', variant: 'destructive' },
  SUSPENDED: { label: 'স্থগিত', variant: 'destructive' },
};

export default function ProfilePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown>>({});

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    const result = await getMyProfile();
    if (result.success && result.profile) {
      const p = result.profile as Record<string, unknown>;
      setProfile({
        ...p,
        dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth as string).toISOString().split('T')[0] : '',
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleChange = (field: string, value: unknown) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await upsertProfile(profile as Parameters<typeof upsertProfile>[0]);
    if (result.success) {
      toast({ variant: 'success', title: 'সংরক্ষিত', description: 'প্রোফাইল সংরক্ষণ হয়েছে।' });
      await loadProfile();
    } else {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
    }
    setIsSaving(false);
  };

  const handleSubmitApproval = async () => {
    setIsSaving(true);
    await handleSave();
    const result = await submitForApproval();
    if (result.success) {
      toast({ variant: 'success', title: 'জমা দেওয়া হয়েছে!', description: 'আপনার প্রোফাইল পর্যালোচনার জন্য পাঠানো হয়েছে।' });
      await loadProfile();
    } else {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
    }
    setIsSaving(false);
  };

  const profileStatus = (profile.status as string) || 'DRAFT';
  const statusInfo = statusLabels[profileStatus] || statusLabels['DRAFT'];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-500">লোড হচ্ছে...</div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">আমার প্রোফাইল</h1>
          <p className="text-gray-500 mt-1">আপনার বায়োডাটা পূরণ করুন</p>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <button
            key={step}
            onClick={() => setCurrentStep(index)}
            className={`flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap px-2 py-1 rounded-md transition-colors ${
              index === currentStep ? 'bg-green-700 text-white' : index < currentStep ? 'text-green-700' : 'text-gray-400'
            }`}
          >
            {index < currentStep && <CheckCircle className="h-3 w-3" />}
            {index + 1}. {step}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>প্রদর্শনী নাম</Label>
                  <Input value={(profile.displayName as string) || ''} onChange={e => handleChange('displayName', e.target.value)} placeholder="আপনার নাম" />
                </div>
                <div className="space-y-2">
                  <Label>জন্মতারিখ</Label>
                  <Input type="date" value={(profile.dateOfBirth as string) || ''} onChange={e => handleChange('dateOfBirth', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>লিঙ্গ</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.gender as string) || ''} onChange={e => handleChange('gender', e.target.value)}>
                    <option value="">নির্বাচন করুন</option>
                    <option value="MALE">পুরুষ</option>
                    <option value="FEMALE">মহিলা</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>বিভাগ</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.division as string) || ''} onChange={e => handleChange('division', e.target.value)}>
                    <option value="">নির্বাচন করুন</option>
                    {['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>জেলা</Label>
                  <Input value={(profile.district as string) || ''} onChange={e => handleChange('district', e.target.value)} placeholder="আপনার জেলা" />
                </div>
                <div className="space-y-2">
                  <Label>উপজেলা</Label>
                  <Input value={(profile.upazila as string) || ''} onChange={e => handleChange('upazila', e.target.value)} placeholder="আপনার উপজেলা" />
                </div>
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>শিক্ষাগত যোগ্যতা</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.education as string) || ''} onChange={e => handleChange('education', e.target.value)}>
                    <option value="">নির্বাচন করুন</option>
                    {['এসএসসি', 'এইচএসসি', 'ডিপ্লোমা', 'স্নাতক', 'স্নাতকোত্তর', 'পিএইচডি', 'হাফেজ', 'আলিম', 'ফাজিল', 'কামিল'].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>শিক্ষার বিস্তারিত</Label>
                  <Input value={(profile.educationDetails as string) || ''} onChange={e => handleChange('educationDetails', e.target.value)} placeholder="বিষয়, প্রতিষ্ঠান" />
                </div>
                <div className="space-y-2">
                  <Label>পেশা</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.occupation as string) || ''} onChange={e => handleChange('occupation', e.target.value)}>
                    <option value="">নির্বাচন করুন</option>
                    {['চাকরি', 'ব্যবসা', 'শিক্ষক', 'ডাক্তার', 'ইঞ্জিনিয়ার', 'আইনজীবী', 'ছাত্র/ছাত্রী', 'গৃহিণী', 'প্রবাসী', 'অন্যান্য'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>মাসিক আয়</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.monthlyIncome as string) || ''} onChange={e => handleChange('monthlyIncome', e.target.value)}>
                    <option value="">নির্বাচন করুন</option>
                    {['১০,০০০ এর কম', '১০,০০০-২০,০০০', '২০,০০০-৪০,০০০', '৪০,০০০-৬০,০০০', '৬০,০০০-১,০০,০০০', '১,০০,০০০ এর বেশি'].map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>বৈবাহিক অবস্থা</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.maritalStatus as string) || ''} onChange={e => handleChange('maritalStatus', e.target.value)}>
                    <option value="">নির্বাচন করুন</option>
                    <option value="NEVER_MARRIED">অবিবাহিত</option>
                    <option value="DIVORCED">তালাকপ্রাপ্ত</option>
                    <option value="WIDOWED">বিধবা/বিপত্নীক</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>পরিবারের ধরন</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.familyType as string) || ''} onChange={e => handleChange('familyType', e.target.value)}>
                    <option value="">নির্বাচন করুন</option>
                    <option value="একক পরিবার">একক পরিবার</option>
                    <option value="যৌথ পরিবার">যৌথ পরিবার</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>পারিবারিক অবস্থা</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.familyStatus as string) || ''} onChange={e => handleChange('familyStatus', e.target.value)}>
                    <option value="">নির্বাচন করুন</option>
                    <option value="উচ্চবিত্ত">উচ্চবিত্ত</option>
                    <option value="মধ্যবিত্ত">মধ্যবিত্ত</option>
                    <option value="নিম্নমধ্যবিত্ত">নিম্নমধ্যবিত্ত</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>ভাই-বোন সংখ্যা</Label>
                  <Input type="number" min="0" max="20" value={(profile.siblings as number) || 0} onChange={e => handleChange('siblings', parseInt(e.target.value))} />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={(profile.fatherAlive as boolean) || false} onChange={e => handleChange('fatherAlive', e.target.checked)} />
                    <span className="text-sm">পিতা জীবিত</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={(profile.motherAlive as boolean) || false} onChange={e => handleChange('motherAlive', e.target.checked)} />
                    <span className="text-sm">মাতা জীবিত</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>নামাজের অভ্যাস</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.prayerHabit as string) || ''} onChange={e => handleChange('prayerHabit', e.target.value)}>
                    <option value="">নির্বাচন করুন</option>
                    <option value="পাঁচ ওয়াক্ত নামাজ পড়ি">পাঁচ ওয়াক্ত নামাজ পড়ি</option>
                    <option value="মাঝে মাঝে পড়ি">মাঝে মাঝে পড়ি</option>
                    <option value="জুমার নামাজ পড়ি">জুমার নামাজ পড়ি</option>
                    <option value="চেষ্টা করছি">চেষ্টা করছি</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>হিজাব/দাড়ি</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.beardOrHijab as string) || ''} onChange={e => handleChange('beardOrHijab', e.target.value)}>
                    <option value="">নির্বাচন করুন</option>
                    <option value="হ্যাঁ, সম্পূর্ণরূপে">হ্যাঁ, সম্পূর্ণরূপে</option>
                    <option value="হ্যাঁ, আংশিকভাবে">হ্যাঁ, আংশিকভাবে</option>
                    <option value="না">না</option>
                    <option value="চেষ্টা করছি">চেষ্টা করছি</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>মাযহাব</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.mazhab as string) || ''} onChange={e => handleChange('mazhab', e.target.value)}>
                    <option value="">নির্বাচন করুন</option>
                    <option value="হানাফি">হানাফি</option>
                    <option value="মালিকি">মালিকি</option>
                    <option value="শাফেয়ী">শাফেয়ী</option>
                    <option value="হাম্বলি">হাম্বলি</option>
                    <option value="আহলে হাদিস">আহলে হাদিস</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>সম্প্রদায়/পন্থা</Label>
                  <Input value={(profile.sect as string) || ''} onChange={e => handleChange('sect', e.target.value)} placeholder="যেমন: দেওবন্দি, বেরেলভি" />
                </div>
              </div>
            </>
          )}

          {currentStep === 4 && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>নিজের সম্পর্কে</Label>
                  <Textarea rows={5} value={(profile.aboutMe as string) || ''} onChange={e => handleChange('aboutMe', e.target.value)} placeholder="নিজের সম্পর্কে কিছু লিখুন..." />
                </div>
                <div className="space-y-2">
                  <Label>জীবনসাথীর প্রত্যাশা</Label>
                  <Textarea rows={5} value={(profile.partnerPreferences as string) || ''} onChange={e => handleChange('partnerPreferences', e.target.value)} placeholder="আপনি কেমন জীবনসাথী চান?" />
                </div>
              </div>
            </>
          )}

          {currentStep === 5 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>মোবাইল নম্বর</Label>
                  <Input value={(profile.phoneNumber as string) || ''} onChange={e => handleChange('phoneNumber', e.target.value)} placeholder="01XXXXXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label>অভিভাবকের নম্বর</Label>
                  <Input value={(profile.guardianPhone as string) || ''} onChange={e => handleChange('guardianPhone', e.target.value)} placeholder="01XXXXXXXXX" />
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <h3 className="font-medium text-gray-700">গোপনীয়তা সেটিং</h3>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={(profile.showPhoneToConnected as boolean) ?? true} onChange={e => handleChange('showPhoneToConnected', e.target.checked)} />
                  <span className="text-sm">সংযুক্ত ব্যক্তিকে মোবাইল নম্বর দেখান</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={(profile.showGuardianPhoneToConnected as boolean) ?? true} onChange={e => handleChange('showGuardianPhoneToConnected', e.target.checked)} />
                  <span className="text-sm">সংযুক্ত ব্যক্তিকে অভিভাবকের নম্বর দেখান</span>
                </label>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" disabled={currentStep === 0} onClick={() => setCurrentStep(s => s - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> পূর্ববর্তী
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </Button>
          {currentStep === steps.length - 1 ? (
            <Button onClick={handleSubmitApproval} disabled={isSaving || profileStatus === 'PENDING_APPROVAL'}>
              <Send className="h-4 w-4 mr-1" /> অনুমোদনের জন্য পাঠান
            </Button>
          ) : (
            <Button onClick={() => setCurrentStep(s => s + 1)}>
              পরবর্তী <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
