import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { ContentPage, ContentSection } from '@/components/layout/content-page';

const content = {
  bn: {
    title: 'শর্তাবলী',
    sections: [
      { title: 'ব্যবহারের যোগ্যতা', body: 'শুধুমাত্র বিবাহের উদ্দেশ্যে, প্রাপ্তবয়স্ক ব্যক্তি বা তাদের অভিভাবকগণ এই প্ল্যাটফর্ম ব্যবহার করতে পারবেন।' },
      { title: 'সঠিক তথ্য প্রদান', body: 'বায়োডাটায় দেওয়া সকল তথ্য সত্য ও হালনাগাদ হতে হবে। মিথ্যা বা বিভ্রান্তিকর তথ্য প্রমাণিত হলে অ্যাকাউন্ট স্থগিত বা মুছে ফেলা হতে পারে।' },
      {
        title: 'আচরণবিধি',
        list: [
          'ইসলামিক শিষ্টাচার বজায় রেখে যোগাযোগ করতে হবে।',
          'অন্যের তথ্য অনুমতি ছাড়া প্রকাশ বা অপব্যবহার করা যাবে না।',
          'বিবাহ ব্যতীত অন্য কোনো উদ্দেশ্যে প্ল্যাটফর্ম ব্যবহার নিষিদ্ধ।',
        ],
      },
      { title: 'দায়বদ্ধতা', body: 'জীবনসাথী শুধুমাত্র সংযোগের মাধ্যম। বিবাহের আগে পাত্র/পাত্রী ও পরিবার সম্পর্কে নিজ দায়িত্বে খোঁজ-খবর নেওয়া আবশ্যক।' },
      { title: 'শর্তাবলী পরিবর্তন', body: 'প্রয়োজনে আমরা এই শর্তাবলী হালনাগাদ করতে পারি। প্ল্যাটফর্ম ব্যবহার চালিয়ে গেলে হালনাগাদ শর্তাবলী মেনে নেওয়া হয়েছে বলে গণ্য হবে।' },
    ],
  },
  en: {
    title: 'Terms & Conditions',
    sections: [
      { title: 'Eligibility', body: 'Only adults, or their guardians, may use this platform, and only for the purpose of marriage.' },
      { title: 'Accurate information', body: 'All information in your biodata must be true and up to date. Accounts found to contain false or misleading information may be suspended or deleted.' },
      {
        title: 'Code of conduct',
        list: [
          'Communicate with Islamic etiquette.',
          'Do not publish or misuse anyone else’s information without permission.',
          'Using the platform for any purpose other than marriage is prohibited.',
        ],
      },
      { title: 'Liability', body: 'ZibonSathi is only a means of connecting people. Before marriage, you are responsible for making your own inquiries about the bride or groom and their family.' },
      { title: 'Changes to these terms', body: 'We may update these terms when needed. Continuing to use the platform means you accept the updated terms.' },
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const c = content[(await getLocale()) as keyof typeof content] ?? content.bn;
  return { title: c.title };
}

export default async function TermsPage() {
  const c = content[(await getLocale()) as keyof typeof content] ?? content.bn;

  return (
    <ContentPage title={c.title}>
      {c.sections.map((section) => (
        <ContentSection key={section.title} title={section.title}>
          {section.list ? (
            <ul className="list-disc pl-6 space-y-1">
              {section.list.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : (
            <p>{section.body}</p>
          )}
        </ContentSection>
      ))}
    </ContentPage>
  );
}
