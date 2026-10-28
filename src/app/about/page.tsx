import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { ContentPage, ContentSection } from '@/components/layout/content-page';

const content = {
  bn: {
    title: 'আমাদের সম্পর্কে',
    subtitle: 'দ্বীনদার পরিবারের জন্য নিরাপদ বিবাহ সংযোগ',
    whatTitle: 'জীবনসাথী কী?',
    what: 'জীবনসাথী একটি ইসলামিক বিবাহ প্ল্যাটফর্ম, যেখানে পাত্র-পাত্রী ও তাদের অভিভাবকগণ ইসলামিক মূল্যবোধ বজায় রেখে উপযুক্ত জীবনসঙ্গী খুঁজে নিতে পারেন। আমরা বিশ্বাস করি বিবাহ একটি ইবাদত, তাই পুরো প্রক্রিয়াটি যেন হালাল ও স্বচ্ছ থাকে সেদিকে আমরা বিশেষ গুরুত্ব দিই।',
    missionTitle: 'আমাদের লক্ষ্য',
    mission: 'বিবাহকে সহজ করা এবং অপ্রয়োজনীয় জটিলতা, খরচ ও ফিতনা থেকে দূরে রেখে দ্বীনদার পরিবারগুলোর মধ্যে সংযোগ তৈরি করা।',
    howTitle: 'আমরা কীভাবে কাজ করি',
    how: [
      'প্রতিটি বায়োডাটা প্রকাশের আগে আমাদের টিম যাচাই করে।',
      'যোগাযোগের তথ্য গোপন থাকে; শুধুমাত্র অনুমোদিত সংযোগের পর অভিভাবকের তথ্য দেখা যায়।',
      'সরাসরি পাত্র-পাত্রীর পরিবর্তে অভিভাবকের মাধ্যমে যোগাযোগকে উৎসাহিত করা হয়।',
      'অনুপযুক্ত আচরণ রিপোর্ট করার সুবিধা রয়েছে এবং দ্রুত ব্যবস্থা নেওয়া হয়।',
    ],
  },
  en: {
    title: 'About Us',
    subtitle: 'Safe matchmaking for practising families',
    whatTitle: 'What is ZibonSathi?',
    what: 'ZibonSathi is an Islamic matrimony platform where prospective brides, grooms and their guardians can find a suitable life partner while upholding Islamic values. We believe marriage is an act of worship, so we take special care to keep the whole process halal and transparent.',
    missionTitle: 'Our mission',
    mission: 'To make marriage easy and to connect practising families while keeping away unnecessary complications, expense and fitnah.',
    howTitle: 'How we work',
    how: [
      'Our team reviews every biodata before it is published.',
      'Contact details stay private; guardian details are only visible after an approved connection.',
      'We encourage contact through guardians rather than directly between the bride and groom.',
      'Inappropriate behaviour can be reported, and we act on reports quickly.',
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const c = content[(await getLocale()) as keyof typeof content] ?? content.bn;
  return { title: c.title };
}

export default async function AboutPage() {
  const c = content[(await getLocale()) as keyof typeof content] ?? content.bn;

  return (
    <ContentPage title={c.title} subtitle={c.subtitle}>
      <ContentSection title={c.whatTitle}>
        <p>{c.what}</p>
      </ContentSection>
      <ContentSection title={c.missionTitle}>
        <p>{c.mission}</p>
      </ContentSection>
      <ContentSection title={c.howTitle}>
        <ul className="list-disc pl-6 space-y-1">
          {c.how.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </ContentSection>
    </ContentPage>
  );
}
