import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { ContentPage } from '@/components/layout/content-page';
import { intlLocale } from '@/i18n/config';

const content = {
  bn: {
    title: 'নির্দেশনা',
    subtitle: 'জীবনসাথী ব্যবহারের ধাপে ধাপে গাইড',
    create: 'বায়োডাটা তৈরি করুন',
    browse: 'বায়োডাটা খুঁজুন',
    steps: [
      { title: 'অ্যাকাউন্ট খুলুন', body: 'ইমেইল ও পাসওয়ার্ড দিয়ে বিনামূল্যে নিবন্ধন করুন, তারপর লগইন করুন।' },
      { title: 'বায়োডাটা পূরণ করুন', body: '"আমার বায়োডাটা" পাতায় গিয়ে ব্যক্তিগত, শিক্ষাগত, পারিবারিক ও ধর্মীয় তথ্য সঠিকভাবে পূরণ করুন। অভিভাবকের যোগাযোগ নম্বর অবশ্যই দিন।' },
      { title: 'অনুমোদনের জন্য জমা দিন', body: 'বায়োডাটা জমা দেওয়ার পর আমাদের টিম যাচাই করে প্রকাশ করবে। অনুমোদিত হলে আপনি একটি বায়োডাটা আইডি পাবেন।' },
      { title: 'বায়োডাটা খুঁজুন', body: '"বায়োডাটা" পাতায় লিঙ্গ, বয়স, বৈবাহিক অবস্থা, বিভাগ ও শিক্ষা অনুযায়ী ফিল্টার করে খুঁজুন। পছন্দের বায়োডাটা তালিকায় যোগ করে রাখতে পারেন।' },
      { title: 'অভিভাবকের সাথে যোগাযোগ করুন', body: 'পছন্দ হলে সংযোগ অনুরোধ পাঠান। অনুরোধ গৃহীত হলে ক্রেডিট ব্যবহার করে অভিভাবকের যোগাযোগ তথ্য দেখুন।' },
      { title: 'খোঁজ-খবর নিয়ে বিবাহ সম্পন্ন করুন', body: 'পারিবারিকভাবে খোঁজ-খবর নিয়ে, ইস্তিখারা করে সিদ্ধান্ত নিন। আমরা সবসময় নিজ দায়িত্বে যাচাই করার পরামর্শ দিই।' },
    ],
  },
  en: {
    title: 'Guide',
    subtitle: 'A step-by-step guide to using ZibonSathi',
    create: 'Create Biodata',
    browse: 'Browse biodatas',
    steps: [
      { title: 'Open an account', body: 'Register for free with your email and password, then log in.' },
      { title: 'Fill in your biodata', body: 'Go to “My Biodata” and carefully fill in your personal, educational, family and religious details. Be sure to add a guardian’s contact number.' },
      { title: 'Submit for approval', body: 'After you submit, our team reviews and publishes your biodata. Once approved, you receive a biodata ID.' },
      { title: 'Search biodatas', body: 'On the “Biodatas” page, filter by gender, age, marital status, division and education. You can save biodatas you like to your favorites.' },
      { title: 'Contact the guardian', body: 'If you like a biodata, send a connection request. Once accepted, use credits to view the guardian’s contact details.' },
      { title: 'Make inquiries and get married', body: 'Make inquiries as a family, pray istikhara and then decide. We always advise verifying details yourself.' },
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const c = content[(await getLocale()) as keyof typeof content] ?? content.bn;
  return { title: c.title };
}

export default async function GuidePage() {
  const locale = await getLocale();
  const c = content[locale as keyof typeof content] ?? content.bn;
  const nf = new Intl.NumberFormat(intlLocale(locale));

  return (
    <ContentPage title={c.title} subtitle={c.subtitle}>
      <ol className="space-y-6">
        {c.steps.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-700 font-bold text-white">
              {nf.format(i + 1)}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{step.title}</h2>
              <p className="text-gray-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button asChild>
          <Link href="/register">{c.create}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/browse">{c.browse}</Link>
        </Button>
      </div>
    </ContentPage>
  );
}
