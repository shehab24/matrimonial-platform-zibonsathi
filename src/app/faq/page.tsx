import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { ChevronDown } from 'lucide-react';
import { ContentPage } from '@/components/layout/content-page';

const content = {
  bn: {
    title: 'সচরাচর জিজ্ঞাসা',
    subtitle: 'আপনার প্রশ্নের উত্তর এখানে খুঁজুন',
    more: 'আরও প্রশ্ন থাকলে',
    contact: 'আমাদের সাথে যোগাযোগ করুন',
    end: '।',
    faqs: [
      { q: 'জীবনসাথীতে বায়োডাটা তৈরি করতে কি টাকা লাগে?', a: 'না, অ্যাকাউন্ট খোলা ও বায়োডাটা তৈরি সম্পূর্ণ বিনামূল্যে। শুধুমাত্র অন্য কারো অভিভাবকের যোগাযোগ তথ্য দেখতে ক্রেডিট প্রয়োজন হয়।' },
      { q: 'আমার বায়োডাটা কখন প্রকাশিত হবে?', a: 'বায়োডাটা জমা দেওয়ার পর আমাদের টিম তথ্য যাচাই করে। সাধারণত ২৪-৪৮ ঘণ্টার মধ্যে অনুমোদন দেওয়া হয়।' },
      { q: 'বায়োডাটা আইডি কী?', a: 'প্রতিটি অনুমোদিত বায়োডাটাকে একটি স্বতন্ত্র আইডি দেওয়া হয় (যেমন ZBM-00001 পাত্রের জন্য, ZBF-00001 পাত্রীর জন্য)। এই আইডি দিয়ে সহজে বায়োডাটা খুঁজে পাওয়া যায়।' },
      { q: 'আমার ছবি ও যোগাযোগের তথ্য কি সবাই দেখতে পাবে?', a: 'না। যোগাযোগের তথ্য গোপন থাকে এবং শুধুমাত্র সংযোগ অনুমোদিত হলে দেখা যায়। আপনার গোপনীয়তা আমাদের সর্বোচ্চ অগ্রাধিকার।' },
      { q: 'কীভাবে কারো সাথে যোগাযোগ করব?', a: 'পছন্দের বায়োডাটায় সংযোগ অনুরোধ পাঠান। অপর পক্ষ অনুরোধ গ্রহণ করলে আপনি অভিভাবকের যোগাযোগ তথ্য দেখতে পাবেন।' },
      { q: 'বিয়ে হয়ে গেলে বায়োডাটা কী করব?', a: 'আপনার প্রোফাইল থেকে বায়োডাটা লুকিয়ে রাখতে পারেন অথবা আমাদের সাথে যোগাযোগ করে অ্যাকাউন্ট মুছে ফেলতে পারেন।' },
      { q: 'কেউ অনুপযুক্ত আচরণ করলে কী করব?', a: 'সংশ্লিষ্ট বায়োডাটা থেকে রিপোর্ট করুন। আমাদের টিম দ্রুত বিষয়টি পর্যালোচনা করে প্রয়োজনীয় ব্যবস্থা নেবে।' },
    ],
  },
  en: {
    title: 'Frequently Asked Questions',
    subtitle: 'Find answers to your questions here',
    more: 'Have more questions?',
    contact: 'Contact us',
    end: '.',
    faqs: [
      { q: 'Does it cost anything to create a biodata?', a: 'No. Opening an account and creating a biodata is completely free. Credits are only needed to view another person’s guardian contact details.' },
      { q: 'When will my biodata be published?', a: 'After you submit your biodata, our team reviews it. Approval usually takes 24–48 hours.' },
      { q: 'What is a biodata ID?', a: 'Every approved biodata gets a unique ID (for example ZBM-00001 for grooms and ZBF-00001 for brides), which makes it easy to find.' },
      { q: 'Can everyone see my photos and contact details?', a: 'No. Contact details stay private and are only shown after a connection is approved. Your privacy is our top priority.' },
      { q: 'How do I contact someone?', a: 'Send a connection request from the biodata you like. Once the other side accepts, you can see their guardian’s contact details.' },
      { q: 'What should I do with my biodata after I get married?', a: 'You can hide your biodata from your profile, or contact us to delete your account.' },
      { q: 'What if someone behaves inappropriately?', a: 'Report them from their biodata. Our team will review it quickly and take the necessary action.' },
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const c = content[(await getLocale()) as keyof typeof content] ?? content.bn;
  return { title: c.title };
}

export default async function FaqPage() {
  const c = content[(await getLocale()) as keyof typeof content] ?? content.bn;

  return (
    <ContentPage title={c.title} subtitle={c.subtitle}>
      <div className="divide-y divide-gray-200">
        {c.faqs.map(({ q, a }) => (
          <details key={q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-gray-900">
              {q}
              <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-gray-600">{a}</p>
          </details>
        ))}
      </div>
      <p className="text-sm text-gray-500">
        {c.more} <Link href="/contact" className="text-green-700 hover:underline">{c.contact}</Link>{c.end}
      </p>
    </ContentPage>
  );
}
