import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { ContentPage, ContentSection, CONTACT_EMAIL } from '@/components/layout/content-page';

const content = {
  bn: {
    title: 'গোপনীয়তা নীতি',
    collectTitle: 'আমরা কী তথ্য সংগ্রহ করি',
    collect: 'নিবন্ধনের সময় নাম, ইমেইল ও পাসওয়ার্ড এবং বায়োডাটায় আপনি যে ব্যক্তিগত, পারিবারিক, শিক্ষাগত ও যোগাযোগের তথ্য দেন সেগুলো আমরা সংরক্ষণ করি।',
    useTitle: 'তথ্য কীভাবে ব্যবহার হয়',
    use: [
      'আপনার বায়োডাটা অন্যান্য ব্যবহারকারীদের কাছে প্রদর্শন করতে।',
      'বায়োডাটা যাচাই ও প্ল্যাটফর্মের নিরাপত্তা নিশ্চিত করতে।',
      'অ্যাকাউন্ট সংক্রান্ত প্রয়োজনীয় বার্তা পাঠাতে।',
    ],
    protectTitle: 'তথ্যের সুরক্ষা',
    protect: 'পাসওয়ার্ড এনক্রিপ্ট করে রাখা হয়। যোগাযোগের তথ্য শুধুমাত্র অনুমোদিত সংযোগের পর দেখানো হয়। আমরা আপনার তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রি করি না।',
    rightsTitle: 'আপনার অধিকার',
    rights: 'আপনি যেকোনো সময় বায়োডাটা লুকিয়ে রাখতে, তথ্য সংশোধন করতে অথবা অ্যাকাউন্ট মুছে ফেলার অনুরোধ করতে পারেন। এজন্য যোগাযোগ করুন:',
  },
  en: {
    title: 'Privacy Policy',
    collectTitle: 'What we collect',
    collect: 'We store your name, email and password from registration, plus the personal, family, educational and contact details you add to your biodata.',
    useTitle: 'How we use it',
    use: [
      'To show your biodata to other users.',
      'To review biodatas and keep the platform safe.',
      'To send you necessary account-related messages.',
    ],
    protectTitle: 'How we protect it',
    protect: 'Passwords are stored encrypted. Contact details are only shown after an approved connection. We never sell your information to third parties.',
    rightsTitle: 'Your rights',
    rights: 'You can hide your biodata, correct your information or ask us to delete your account at any time. Contact:',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const c = content[(await getLocale()) as keyof typeof content] ?? content.bn;
  return { title: c.title };
}

export default async function PrivacyPage() {
  const c = content[(await getLocale()) as keyof typeof content] ?? content.bn;

  return (
    <ContentPage title={c.title}>
      <ContentSection title={c.collectTitle}>
        <p>{c.collect}</p>
      </ContentSection>
      <ContentSection title={c.useTitle}>
        <ul className="list-disc pl-6 space-y-1">
          {c.use.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </ContentSection>
      <ContentSection title={c.protectTitle}>
        <p>{c.protect}</p>
      </ContentSection>
      <ContentSection title={c.rightsTitle}>
        <p>
          {c.rights} <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 hover:underline">{CONTACT_EMAIL}</a>
        </p>
      </ContentSection>
    </ContentPage>
  );
}
