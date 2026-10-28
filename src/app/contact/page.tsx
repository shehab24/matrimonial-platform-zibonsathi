import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { Mail, Clock, HelpCircle } from 'lucide-react';
import { ContentPage, CONTACT_EMAIL } from '@/components/layout/content-page';

const content = {
  bn: {
    title: 'যোগাযোগ',
    subtitle: 'যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন',
    email: 'ইমেইল',
    hoursTitle: 'সাপোর্ট সময়',
    hours: 'শনিবার - বৃহস্পতিবার, সকাল ১০টা - রাত ৮টা',
    faqTitle: 'সাধারণ প্রশ্ন',
    faqBefore: 'আগে',
    faqLink: 'জিজ্ঞাসা',
    faqAfter: 'পাতাটি দেখে নিন।',
    note: 'ইমেইলে আপনার বায়োডাটা আইডি (যদি থাকে) উল্লেখ করলে আমরা দ্রুত সাহায্য করতে পারব।',
  },
  en: {
    title: 'Contact',
    subtitle: 'Get in touch with us for anything you need',
    email: 'Email',
    hoursTitle: 'Support hours',
    hours: 'Saturday – Thursday, 10 AM – 8 PM',
    faqTitle: 'Common questions',
    faqBefore: 'Please check the',
    faqLink: 'FAQ',
    faqAfter: 'page first.',
    note: 'Mention your biodata ID (if you have one) in your email so we can help you faster.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const c = content[(await getLocale()) as keyof typeof content] ?? content.bn;
  return { title: c.title };
}

export default async function ContactPage() {
  const c = content[(await getLocale()) as keyof typeof content] ?? content.bn;

  return (
    <ContentPage title={c.title} subtitle={c.subtitle}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 p-5">
          <Mail className="h-6 w-6 text-green-700 mb-2" />
          <h2 className="font-semibold text-gray-900">{c.email}</h2>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 hover:underline break-all">{CONTACT_EMAIL}</a>
        </div>
        <div className="rounded-lg border border-gray-200 p-5">
          <Clock className="h-6 w-6 text-green-700 mb-2" />
          <h2 className="font-semibold text-gray-900">{c.hoursTitle}</h2>
          <p className="text-gray-600">{c.hours}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-5">
          <HelpCircle className="h-6 w-6 text-green-700 mb-2" />
          <h2 className="font-semibold text-gray-900">{c.faqTitle}</h2>
          <p className="text-gray-600">
            {c.faqBefore} <Link href="/faq" className="text-green-700 hover:underline">{c.faqLink}</Link> {c.faqAfter}
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-500">{c.note}</p>
    </ContentPage>
  );
}
