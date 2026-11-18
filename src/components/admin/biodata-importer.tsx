'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Loader2, Sparkles, Upload } from 'lucide-react';
import { extractBiodataFromText, importExtractedBiodata } from '@/actions/biodata-import';
import type { ExtractedBiodata } from '@/lib/biodata-extract';
import {
  DIVISIONS, EDUCATION_OPTIONS, OCCUPATION_OPTIONS, MAZHAB_OPTIONS, FAMILY_STATUS_OPTIONS,
  INCOME_OPTIONS, FAMILY_TYPE_OPTIONS, PRAYER_OPTIONS, BEARD_HIJAB_OPTIONS,
} from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

type Field = Exclude<keyof ExtractedBiodata, 'warnings'>;
type Options = readonly string[] | Record<string, string>;
type Kind = 'text' | 'long' | 'date' | 'int' | 'bool' | Options;

const BOOL: Record<string, string> = { true: 'জীবিত', false: 'মৃত' };

// Same groups and labels as the admin edit form
const SECTIONS: { title: string; fields: [Field, string, Kind][] }[] = [
  {
    title: 'মৌলিক তথ্য',
    fields: [
      ['displayName', 'নাম', 'text'],
      ['gender', 'ধরন', { MALE: 'পাত্র', FEMALE: 'পাত্রী' }],
      ['dateOfBirth', 'জন্ম তারিখ', 'date'],
      ['maritalStatus', 'বৈবাহিক অবস্থা', { NEVER_MARRIED: 'অবিবাহিত', DIVORCED: 'ডিভোর্সড', WIDOWED: 'বিধবা/বিপত্নীক' }],
      ['numberOfChildren', 'সন্তান সংখ্যা', 'int'],
    ],
  },
  {
    title: 'ঠিকানা',
    fields: [
      ['country', 'দেশ', 'text'],
      ['division', 'বিভাগ', DIVISIONS],
      ['district', 'জেলা', 'text'],
      ['upazila', 'উপজেলা', 'text'],
    ],
  },
  {
    title: 'শিক্ষা ও পেশা',
    fields: [
      ['education', 'শিক্ষাগত যোগ্যতা', EDUCATION_OPTIONS],
      ['educationDetails', 'শিক্ষার বিস্তারিত', 'long'],
      ['occupation', 'পেশা', OCCUPATION_OPTIONS],
      ['occupationDetails', 'পেশার বিস্তারিত', 'long'],
      ['monthlyIncome', 'মাসিক আয়', INCOME_OPTIONS],
    ],
  },
  {
    title: 'পরিবার',
    fields: [
      ['fatherAlive', 'পিতা', BOOL],
      ['motherAlive', 'মাতা', BOOL],
      ['siblings', 'ভাই-বোন সংখ্যা', 'int'],
      ['familyType', 'পরিবারের ধরন', FAMILY_TYPE_OPTIONS],
      ['familyStatus', 'পারিবারিক অবস্থা', FAMILY_STATUS_OPTIONS],
    ],
  },
  {
    title: 'ধর্মীয় তথ্য',
    fields: [
      ['prayerHabit', 'নামাজ', PRAYER_OPTIONS],
      ['beardOrHijab', 'দাড়ি/হিজাব', BEARD_HIJAB_OPTIONS],
      ['mazhab', 'মাযহাব', MAZHAB_OPTIONS],
      ['sect', 'সম্প্রদায়', 'text'],
    ],
  },
  {
    title: 'বিস্তারিত',
    fields: [
      ['aboutMe', 'নিজের সম্পর্কে', 'long'],
      ['partnerPreferences', 'প্রত্যাশিত জীবনসঙ্গী', 'long'],
    ],
  },
  {
    title: 'যোগাযোগ',
    fields: [
      ['phoneNumber', 'মোবাইল', 'text'],
      ['guardianPhone', 'অভিভাবকের মোবাইল', 'text'],
      ['contactEmail', 'ইমেইল', 'text'],
    ],
  },
];

const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600';

export function BiodataImporter() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [data, setData] = useState<ExtractedBiodata | null>(null);
  const [parsing, startParsing] = useTransition();
  const [saving, startSaving] = useTransition();

  const parse = () =>
    startParsing(async () => {
      const result = await extractBiodataFromText(text);
      if (result.success) setData(result.data);
      else toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
    });

  const save = () =>
    data &&
    startSaving(async () => {
      const result = await importExtractedBiodata(data);
      if (result.success) {
        toast({ variant: 'success', title: 'বায়োডাটা ইমপোর্ট হয়েছে', description: 'ছবি যোগ বা বাকি তথ্য ঠিক করে অনুমোদন দিন।' });
        router.push(result.editHref);
      } else {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
      }
    });

  const set = (field: Field, value: unknown) => setData((d) => (d ? { ...d, [field]: value } : d));

  const control = (field: Field, kind: Kind) => {
    const value = data?.[field];
    if (kind === 'long') {
      return <textarea rows={field === 'aboutMe' || field === 'partnerPreferences' ? 6 : 3} className={inputClass} value={(value as string) ?? ''} onChange={(e) => set(field, e.target.value || null)} />;
    }
    if (kind === 'text' || kind === 'date') {
      return <input type={kind === 'date' ? 'date' : 'text'} className={inputClass} value={(value as string) ?? ''} onChange={(e) => set(field, e.target.value || null)} />;
    }
    if (kind === 'int') {
      return <input type="number" min={0} max={50} className={inputClass} value={value === null || value === undefined ? '' : String(value)} onChange={(e) => set(field, e.target.value === '' ? null : Number(e.target.value))} />;
    }
    const entries = Array.isArray(kind) ? kind.map((o) => [o, o]) : Object.entries(kind);
    const isBool = kind === BOOL;
    return (
      <select
        className={inputClass}
        value={value === null || value === undefined ? '' : String(value)}
        onChange={(e) => set(field, e.target.value === '' ? null : isBool ? e.target.value === 'true' : e.target.value)}
      >
        <option value="">— নির্বাচন করুন —</option>
        {entries.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
      </select>
    );
  };

  if (!data) {
    return (
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <label htmlFor="biodata-text" className="block text-sm font-semibold text-gray-800">বায়োডাটার লেখা</label>
        <textarea
          id="biodata-text"
          rows={16}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'এখানে পুরো বায়োডাটা পেস্ট করুন...\n\nযেমন:\nপাত্রের বায়োডাটা\nনাম: ...\nজন্ম তারিখ: ...\nস্থায়ী ঠিকানা: ...'}
          className={`${inputClass} font-[inherit] leading-relaxed`}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-500">একবারে একটি বায়োডাটা দিন। পার্স করতে সাধারণত ১০-৩০ সেকেন্ড লাগে।</p>
          <Button onClick={parse} disabled={parsing || text.trim().length < 30}>
            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {parsing ? 'AI পড়ছে...' : 'AI দিয়ে পার্স করুন'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.warnings.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-yellow-900">
            <AlertTriangle className="h-4 w-4" /> যাচাই করে নিন
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-yellow-900">
            {data.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <section key={section.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-gray-900">{section.title}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {section.fields.map(([field, label, kind]) => (
                  <div key={field} className={kind === 'long' ? 'sm:col-span-2' : ''}>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                      {label}
                      {field === 'gender' && <span className="text-red-600"> *</span>}
                    </label>
                    {control(field, kind)}
                    {(data[field] === null || data[field] === '') && field !== 'numberOfChildren' && (
                      <p className="mt-1 text-[11px] text-gray-400">লেখায় পাওয়া যায়নি</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">
              সব ঠিক থাকলে ইমপোর্ট করুন। বায়োডাটাটি <strong>রিভিউয়ের অপেক্ষায়</strong> অবস্থায় তৈরি হবে, তারপর এডিট পেজে ছবি যোগ ও বাকি তথ্য ঠিক করে অনুমোদন দিতে পারবেন।
            </p>
            <Button className="mt-4 w-full" onClick={save} disabled={saving || !data.gender}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              ইমপোর্ট করুন
            </Button>
            {!data.gender && <p className="mt-2 text-xs text-red-600">পাত্র না পাত্রী নির্বাচন করুন</p>}
            <Button variant="outline" className="mt-2 w-full" onClick={() => setData(null)} disabled={saving}>
              <ArrowLeft className="h-4 w-4" /> লেখায় ফিরে যান
            </Button>
          </div>
          <details className="rounded-xl border border-gray-200 bg-white p-5 text-sm shadow-sm">
            <summary className="cursor-pointer font-semibold text-gray-800">মূল লেখা</summary>
            <p className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap text-gray-600">{text}</p>
          </details>
        </aside>
      </div>
    </div>
  );
}
