import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { ContentPage, ContentSection, CONTACT_EMAIL } from '@/components/layout/content-page';

const content = {
  bn: {
    title: 'রিফান্ড নীতি',
    creditsTitle: 'ক্রেডিট ক্রয়',
    credits: 'ক্রেডিট দিয়ে অভিভাবকের যোগাযোগ তথ্য দেখা যায়। একবার ব্যবহৃত ক্রেডিট ফেরতযোগ্য নয়।',
    whenTitle: 'কখন রিফান্ড পাবেন',
    when: [
      'পেমেন্ট সফল হওয়ার পরও ক্রেডিট অ্যাকাউন্টে যোগ না হলে।',
      'ভুলবশত একই পেমেন্ট একাধিকবার কাটা হলে।',
      'দেখানো যোগাযোগ তথ্য সম্পূর্ণ ভুল প্রমাণিত হলে (সংশ্লিষ্ট ক্রেডিট ফেরত দেওয়া হবে)।',
    ],
    applyTitle: 'রিফান্ডের আবেদন',
    applyBefore: 'পেমেন্টের ৭ দিনের মধ্যে ট্রানজেকশন আইডিসহ',
    applyAfter: 'এ ইমেইল করুন। যাচাই শেষে ৭-১০ কার্যদিবসের মধ্যে রিফান্ড প্রক্রিয়া করা হবে।',
  },
  en: {
    title: 'Refund Policy',
    creditsTitle: 'Buying credits',
    credits: 'Credits are used to view guardian contact details. Credits that have been used are non-refundable.',
    whenTitle: 'When you can get a refund',
    when: [
      'Your payment succeeded but the credits were not added to your account.',
      'The same payment was charged more than once by mistake.',
      'The contact details shown turn out to be completely wrong (the related credits will be returned).',
    ],
    applyTitle: 'Requesting a refund',
    applyBefore: 'Within 7 days of payment, email your transaction ID to',
    applyAfter: '. After verification, refunds are processed within 7–10 working days.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const c = content[(await getLocale()) as keyof typeof content] ?? content.bn;
  return { title: c.title };
}

export default async function RefundPolicyPage() {
  const c = content[(await getLocale()) as keyof typeof content] ?? content.bn;

  return (
    <ContentPage title={c.title}>
      <ContentSection title={c.creditsTitle}>
        <p>{c.credits}</p>
      </ContentSection>
      <ContentSection title={c.whenTitle}>
        <ul className="list-disc pl-6 space-y-1">
          {c.when.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </ContentSection>
      <ContentSection title={c.applyTitle}>
        <p>
          {c.applyBefore} <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 hover:underline">{CONTACT_EMAIL}</a>{' '}
          {c.applyAfter}
        </p>
      </ContentSection>
    </ContentPage>
  );
}
