'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { DIVISIONS, EDUCATION_OPTIONS, OCCUPATION_OPTIONS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { getMyProfile, upsertProfile, submitForApproval } from '@/actions/profile';
import { CheckCircle, ChevronRight, ChevronLeft, Send, HandHeart, ShieldAlert } from 'lucide-react';

const steps = ['basic', 'education', 'family', 'religious', 'about', 'contact', 'pledge'] as const;

// Quick picks for the hadia pledge (Taka); any other amount can be typed in
const HADIA_PRESETS = [500, 1000, 2000, 5000];

const statusLabels: Record<string, { label: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'; variant: 'default' | 'secondary' | 'destructive' | 'warning' | 'success' | 'outline' }> = {
  DRAFT: { label: 'DRAFT', variant: 'secondary' },
  PENDING_APPROVAL: { label: 'PENDING_APPROVAL', variant: 'warning' },
  APPROVED: { label: 'APPROVED', variant: 'success' },
  REJECTED: { label: 'REJECTED', variant: 'destructive' },
  SUSPENDED: { label: 'SUSPENDED', variant: 'destructive' },
};

export default function ProfilePage() {
  const t = useTranslations('profileForm');
  const format = useFormatter();
  const tc = useTranslations('common');
  const tm = useTranslations('maritalStatus');
  const td = useTranslations('divisions');
  const to = useTranslations('options');
  const ts = useTranslations('profileStatus');
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const [customHadia, setCustomHadia] = useState(false);
  // Gender is fixed once saved (it decides the ZBM/ZBF biodata number)
  const [genderLocked, setGenderLocked] = useState(false);

  const showProfile = useCallback((result: Awaited<ReturnType<typeof getMyProfile>>) => {
    if (result.success && result.profile) {
      const p = result.profile as Record<string, unknown>;
      setProfile({
        ...p,
        dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth as string).toISOString().split('T')[0] : '',
        removalPledgeAccepted: !!p.removalPledgeAcceptedAt,
      });
      setCustomHadia(p.hadiaPledge != null && !HADIA_PRESETS.includes(p.hadiaPledge as number));
      setGenderLocked(!!p.gender);
    }
    setIsLoading(false);
  }, []);

  const loadProfile = useCallback(async () => showProfile(await getMyProfile()), [showProfile]);

  useEffect(() => { getMyProfile().then(showProfile); }, [showProfile]);

  const handleChange = (field: string, value: unknown) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await upsertProfile(profile as Parameters<typeof upsertProfile>[0]);
    if (result.success) {
      toast({ variant: 'success', title: t('saved'), description: t('savedBody') });
      await loadProfile();
    } else {
      toast({ variant: 'destructive', title: tc('error'), description: result.error });
    }
    setIsSaving(false);
    return result.success;
  };

  const handleSubmitApproval = async () => {
    setIsSaving(true);
    // Don't submit a biodata whose latest edits failed to save
    if (!(await handleSave())) return;
    setIsSaving(true);
    const result = await submitForApproval();
    if (result.success) {
      toast({ variant: 'success', title: t('submitted'), description: t('submittedBody') });
      await loadProfile();
    } else {
      toast({ variant: 'destructive', title: tc('error'), description: result.error });
    }
    setIsSaving(false);
  };

  const profileStatus = (profile.status as string) || 'DRAFT';
  const pledgeComplete = profile.hadiaPledge != null && !!profile.removalPledgeAccepted;
  const statusInfo = statusLabels[profileStatus] || statusLabels['DRAFT'];

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><div className="text-gray-500">{tc('loading')}</div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-1">{t('subtitle')}</p>
        </div>
        <Badge variant={statusInfo.variant}>{ts(statusInfo.label)}</Badge>
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
            {format.number(index + 1)}. {t(`steps.${step}`)}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t(`steps.${steps[currentStep]}`)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('displayName')}</Label>
                  <Input value={(profile.displayName as string) || ''} onChange={e => handleChange('displayName', e.target.value)} placeholder={t('displayNamePlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('dob')}</Label>
                  <Input type="date" value={(profile.dateOfBirth as string) || ''} onChange={e => handleChange('dateOfBirth', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('gender')}</Label>
                  <select disabled={genderLocked} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700 disabled:cursor-not-allowed disabled:bg-gray-100" value={(profile.gender as string) || ''} onChange={e => handleChange('gender', e.target.value)}>
                    <option value="">{t('select')}</option>
                    <option value="MALE">{tc('male')}</option>
                    <option value="FEMALE">{tc('female')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('division')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.division as string) || ''} onChange={e => handleChange('division', e.target.value)}>
                    <option value="">{t('select')}</option>
                    {DIVISIONS.map(d => <option key={d} value={d}>{td(d)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('district')}</Label>
                  <Input value={(profile.district as string) || ''} onChange={e => handleChange('district', e.target.value)} placeholder={t('districtPlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('upazila')}</Label>
                  <Input value={(profile.upazila as string) || ''} onChange={e => handleChange('upazila', e.target.value)} placeholder={t('upazilaPlaceholder')} />
                </div>
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('education')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.education as string) || ''} onChange={e => handleChange('education', e.target.value)}>
                    <option value="">{t('select')}</option>
                    {EDUCATION_OPTIONS.map(e => <option key={e} value={e}>{to(e)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('educationDetails')}</Label>
                  <Input value={(profile.educationDetails as string) || ''} onChange={e => handleChange('educationDetails', e.target.value)} placeholder={t('educationDetailsPlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('occupation')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.occupation as string) || ''} onChange={e => handleChange('occupation', e.target.value)}>
                    <option value="">{t('select')}</option>
                    {OCCUPATION_OPTIONS.map(o => <option key={o} value={o}>{to(o)}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('monthlyIncome')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.monthlyIncome as string) || ''} onChange={e => handleChange('monthlyIncome', e.target.value)}>
                    <option value="">{t('select')}</option>
                    {['১০,০০০ এর কম', '১০,০০০-২০,০০০', '২০,০০০-৪০,০০০', '৪০,০০০-৬০,০০০', '৬০,০০০-১,০০,০০০', '১,০০,০০০ এর বেশি'].map(i => <option key={i} value={i}>{to(i)}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('maritalStatus')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.maritalStatus as string) || ''} onChange={e => handleChange('maritalStatus', e.target.value)}>
                    <option value="">{t('select')}</option>
                    <option value="NEVER_MARRIED">{tm('NEVER_MARRIED')}</option>
                    <option value="DIVORCED">{tm('DIVORCED')}</option>
                    <option value="WIDOWED">{tm('WIDOWED')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('familyType')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.familyType as string) || ''} onChange={e => handleChange('familyType', e.target.value)}>
                    <option value="">{t('select')}</option>
                    <option value="একক পরিবার">{to('একক পরিবার')}</option>
                    <option value="যৌথ পরিবার">{to('যৌথ পরিবার')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('familyStatus')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.familyStatus as string) || ''} onChange={e => handleChange('familyStatus', e.target.value)}>
                    <option value="">{t('select')}</option>
                    <option value="উচ্চবিত্ত">{to('উচ্চবিত্ত')}</option>
                    <option value="মধ্যবিত্ত">{to('মধ্যবিত্ত')}</option>
                    <option value="নিম্নমধ্যবিত্ত">{to('নিম্নমধ্যবিত্ত')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('siblings')}</Label>
                  <Input type="number" min="0" max="20" value={(profile.siblings as number) || 0} onChange={e => handleChange('siblings', parseInt(e.target.value))} />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={(profile.fatherAlive as boolean) || false} onChange={e => handleChange('fatherAlive', e.target.checked)} />
                    <span className="text-sm">{t('fatherAlive')}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={(profile.motherAlive as boolean) || false} onChange={e => handleChange('motherAlive', e.target.checked)} />
                    <span className="text-sm">{t('motherAlive')}</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('prayerHabit')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.prayerHabit as string) || ''} onChange={e => handleChange('prayerHabit', e.target.value)}>
                    <option value="">{t('select')}</option>
                    <option value="পাঁচ ওয়াক্ত নামাজ পড়ি">{to('পাঁচ ওয়াক্ত নামাজ পড়ি')}</option>
                    <option value="মাঝে মাঝে পড়ি">{to('মাঝে মাঝে পড়ি')}</option>
                    <option value="জুমার নামাজ পড়ি">{to('জুমার নামাজ পড়ি')}</option>
                    <option value="চেষ্টা করছি">{to('চেষ্টা করছি')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('beardOrHijab')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.beardOrHijab as string) || ''} onChange={e => handleChange('beardOrHijab', e.target.value)}>
                    <option value="">{t('select')}</option>
                    <option value="হ্যাঁ, সম্পূর্ণরূপে">{to('হ্যাঁ, সম্পূর্ণরূপে')}</option>
                    <option value="হ্যাঁ, আংশিকভাবে">{to('হ্যাঁ, আংশিকভাবে')}</option>
                    <option value="না">{to('না')}</option>
                    <option value="চেষ্টা করছি">{to('চেষ্টা করছি')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('mazhab')}</Label>
                  <select className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700" value={(profile.mazhab as string) || ''} onChange={e => handleChange('mazhab', e.target.value)}>
                    <option value="">{t('select')}</option>
                    <option value="হানাফি">{to('হানাফি')}</option>
                    <option value="মালিকি">{to('মালিকি')}</option>
                    <option value="শাফেয়ী">{to('শাফেয়ী')}</option>
                    <option value="হাম্বলি">{to('হাম্বলি')}</option>
                    <option value="আহলে হাদিস">{to('আহলে হাদিস')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t('sect')}</Label>
                  <Input value={(profile.sect as string) || ''} onChange={e => handleChange('sect', e.target.value)} placeholder={t('sectPlaceholder')} />
                </div>
              </div>
            </>
          )}

          {currentStep === 4 && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('aboutMe')}</Label>
                  <Textarea rows={5} value={(profile.aboutMe as string) || ''} onChange={e => handleChange('aboutMe', e.target.value)} placeholder={t('aboutMePlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('partnerPreferences')}</Label>
                  <Textarea rows={5} value={(profile.partnerPreferences as string) || ''} onChange={e => handleChange('partnerPreferences', e.target.value)} placeholder={t('partnerPreferencesPlaceholder')} />
                </div>
              </div>
            </>
          )}

          {currentStep === 5 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('phone')} <span className="text-red-600">*</span></Label>
                  <Input type="tel" required value={(profile.phoneNumber as string) || ''} onChange={e => handleChange('phoneNumber', e.target.value)} placeholder="01XXXXXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label>{t('guardianPhone')}</Label>
                  <Input value={(profile.guardianPhone as string) || ''} onChange={e => handleChange('guardianPhone', e.target.value)} placeholder="01XXXXXXXXX" />
                </div>
              </div>
              <p className="text-sm text-gray-500">{t('contactNote')}</p>
            </>
          )}

          {currentStep === 6 && (
            <div className="space-y-6">
              <section className="rounded-xl border border-green-200 bg-green-50/60 p-5">
                <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                  <HandHeart className="h-5 w-5 text-green-700" />
                  {t('hadiaTitle')}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{t('hadiaBody')}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {HADIA_PRESETS.map(amount => {
                    const active = !customHadia && profile.hadiaPledge === amount;
                    return (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => { setCustomHadia(false); handleChange('hadiaPledge', amount); }}
                        aria-pressed={active}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          active ? 'border-green-700 bg-green-700 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-green-600'
                        }`}
                      >
                        {t('taka', { amount })}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => { setCustomHadia(true); handleChange('hadiaPledge', null); }}
                    aria-pressed={customHadia}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      customHadia ? 'border-green-700 bg-green-700 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-green-600'
                    }`}
                  >
                    {t('hadiaOther')}
                  </button>
                </div>
                {customHadia && (
                  <div className="mt-3 max-w-xs space-y-2">
                    <Label>{t('hadiaAmount')}</Label>
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={profile.hadiaPledge == null ? '' : String(profile.hadiaPledge)}
                      onChange={e => handleChange('hadiaPledge', e.target.value === '' ? null : Number(e.target.value))}
                      placeholder={t('hadiaAmountPlaceholder')}
                    />
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-yellow-200 bg-yellow-100/50 p-5">
                <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                  <ShieldAlert className="h-5 w-5 text-yellow-600" />
                  {t('removalTitle')}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">{t('removalBody')}</p>
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg bg-white p-3 ring-1 ring-gray-200">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-green-700"
                    checked={!!profile.removalPledgeAccepted}
                    onChange={e => handleChange('removalPledgeAccepted', e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-900">{t('removalAgree')}</span>
                </label>
              </section>

              {!pledgeComplete && <p className="text-sm text-red-600">{t('pledgeRequired')}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" disabled={currentStep === 0} onClick={() => setCurrentStep(s => s - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> {tc('previous')}
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? t('saving') : tc('save')}
          </Button>
          {currentStep === steps.length - 1 ? (
            <Button onClick={handleSubmitApproval} disabled={isSaving || profileStatus === 'PENDING_APPROVAL' || !pledgeComplete}>
              <Send className="h-4 w-4 mr-1" /> {t('submit')}
            </Button>
          ) : (
            <Button onClick={() => setCurrentStep(s => s + 1)}>
              {tc('next')} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
