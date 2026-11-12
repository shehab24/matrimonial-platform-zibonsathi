'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { adminUpdateProfile } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { DIVISIONS, EDUCATION_OPTIONS, OCCUPATION_OPTIONS, MAZHAB_OPTIONS, FAMILY_STATUS_OPTIONS } from '@/lib/constants';
import { GENDER_LABELS, MARITAL_LABELS } from '@/lib/admin-labels';

type Fields = Record<
  | 'displayName' | 'dateOfBirth' | 'gender' | 'country' | 'division' | 'district' | 'upazila'
  | 'education' | 'educationDetails' | 'occupation' | 'occupationDetails' | 'monthlyIncome'
  | 'maritalStatus' | 'numberOfChildren' | 'fatherAlive' | 'motherAlive' | 'siblings' | 'familyType' | 'familyStatus'
  | 'prayerHabit' | 'beardOrHijab' | 'mazhab' | 'sect' | 'aboutMe' | 'partnerPreferences' | 'phoneNumber' | 'guardianPhone',
  string
>;

// Same choices as the member form (src/app/(dashboard)/profile/page.tsx)
const INCOME_OPTIONS = ['১০,০০০ এর কম', '১০,০০০-২০,০০০', '২০,০০০-৪০,০০০', '৪০,০০০-৬০,০০০', '৬০,০০০-১,০০,০০০', '১,০০,০০০ এর বেশি'];
const FAMILY_TYPE_OPTIONS = ['একক পরিবার', 'যৌথ পরিবার'];
const PRAYER_OPTIONS = ['পাঁচ ওয়াক্ত নামাজ পড়ি', 'মাঝে মাঝে পড়ি', 'জুমার নামাজ পড়ি', 'চেষ্টা করছি'];
const BEARD_HIJAB_OPTIONS = ['হ্যাঁ, সম্পূর্ণরূপে', 'হ্যাঁ, আংশিকভাবে', 'না', 'চেষ্টা করছি'];

const selectClass =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-green-700 disabled:cursor-not-allowed disabled:bg-gray-100';

export function AdminBiodataEditForm({
  profileId,
  initial,
  genderLocked,
  backHref,
}: {
  profileId: string;
  initial: Fields;
  genderLocked: boolean;
  backHref: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Fields>(initial);
  const [isPending, startTransition] = useTransition();

  const set = (field: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const text = (field: keyof Fields, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={form[field]} onChange={set(field)} {...props} />
    </div>
  );

  // Options are value → label. Imported biodatas can hold values outside the list, so the current one is always kept.
  const select = (field: keyof Fields, label: string, options: readonly string[] | Record<string, string>, disabled = false) => {
    const entries: [string, string][] = Array.isArray(options) ? options.map(o => [o, o]) : Object.entries(options);
    if (form[field] && !entries.some(([v]) => v === form[field])) entries.push([form[field], form[field]]);
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <select className={selectClass} value={form[field]} onChange={set(field)} disabled={disabled}>
          <option value="">নির্বাচন করুন</option>
          {entries.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
    );
  };

  const section = (title: string, children: React.ReactNode) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <h2 className="px-5 py-3 border-b border-gray-200 font-semibold text-gray-900">{title}</h2>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  const aliveOptions = { true: 'জীবিত', false: 'মৃত' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const toBool = (v: string) => (v === '' ? null : v === 'true');
    startTransition(async () => {
      const result = await adminUpdateProfile(profileId, {
        ...form,
        fatherAlive: toBool(form.fatherAlive),
        motherAlive: toBool(form.motherAlive),
      });
      if (result.success) {
        toast({ variant: 'success', title: 'বায়োডাটা আপডেট হয়েছে' });
        router.push(backHref);
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {section('মৌলিক তথ্য', <>
        {text('displayName', 'নাম')}
        {text('dateOfBirth', 'জন্মতারিখ', { type: 'date' })}
        <div>
          {select('gender', 'লিঙ্গ', GENDER_LABELS, genderLocked)}
          {genderLocked && <p className="mt-1 text-xs text-gray-500">বায়োডাটা নং দেওয়া হয়ে গেছে, তাই লিঙ্গ পরিবর্তন করা যাবে না।</p>}
        </div>
        {select('maritalStatus', 'বৈবাহিক অবস্থা', MARITAL_LABELS)}
        {text('numberOfChildren', 'সন্তান সংখ্যা', { type: 'number', min: 0, max: 50 })}
        {text('country', 'দেশ')}
        {select('division', 'বিভাগ', DIVISIONS)}
        {text('district', 'জেলা')}
        {text('upazila', 'উপজেলা')}
      </>)}

      {section('শিক্ষা ও পেশা', <>
        {select('education', 'শিক্ষাগত যোগ্যতা', EDUCATION_OPTIONS)}
        {text('educationDetails', 'শিক্ষার বিস্তারিত')}
        {select('occupation', 'পেশা', OCCUPATION_OPTIONS)}
        {text('occupationDetails', 'পেশার বিস্তারিত')}
        {select('monthlyIncome', 'মাসিক আয়', INCOME_OPTIONS)}
      </>)}

      {section('পারিবারিক ও ধর্মীয় তথ্য', <>
        {select('fatherAlive', 'পিতা', aliveOptions)}
        {select('motherAlive', 'মাতা', aliveOptions)}
        {text('siblings', 'ভাই-বোন', { type: 'number', min: 0, max: 50 })}
        {select('familyType', 'পরিবারের ধরন', FAMILY_TYPE_OPTIONS)}
        {select('familyStatus', 'পারিবারিক অবস্থা', FAMILY_STATUS_OPTIONS)}
        {select('prayerHabit', 'নামাজ', PRAYER_OPTIONS)}
        {select('beardOrHijab', 'দাড়ি/হিজাব', BEARD_HIJAB_OPTIONS)}
        {select('mazhab', 'মাযহাব', MAZHAB_OPTIONS)}
        {text('sect', 'সম্প্রদায়')}
      </>)}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <h2 className="px-5 py-3 border-b border-gray-200 font-semibold text-gray-900">নিজের সম্পর্কে ও প্রত্যাশা</h2>
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <Label>নিজের সম্পর্কে</Label>
            <Textarea rows={6} value={form.aboutMe} onChange={set('aboutMe')} />
          </div>
          <div className="space-y-2">
            <Label>জীবনসাথীর প্রত্যাশা</Label>
            <Textarea rows={6} value={form.partnerPreferences} onChange={set('partnerPreferences')} />
          </div>
        </div>
      </div>

      {section('যোগাযোগ (শুধু অ্যাডমিন)', <>
        {text('phoneNumber', 'মোবাইল', { type: 'tel', placeholder: '01XXXXXXXXX' })}
        {text('guardianPhone', 'অভিভাবক', { type: 'tel', placeholder: '01XXXXXXXXX' })}
      </>)}

      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href={backHref}>বাতিল</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          <Save className="h-4 w-4" /> {isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
        </Button>
      </div>
    </form>
  );
}
