import Link from 'next/link';
import { UserPlus, Search, Phone, HeartHandshake, ArrowRight, Users, User, UserRound, Heart } from 'lucide-react';
import { Gender, ProfileStatus, ConnectionStatus } from '@prisma/client';
import { getLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { intlLocale } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { QuickSearch } from '@/components/home/quick-search';

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    const approved = { status: ProfileStatus.APPROVED };
    const [total, male, female, matches] = await Promise.all([
      prisma.profile.count({ where: approved }),
      prisma.profile.count({ where: { ...approved, gender: Gender.MALE } }),
      prisma.profile.count({ where: { ...approved, gender: Gender.FEMALE } }),
      prisma.connection.count({ where: { status: ConnectionStatus.ACCEPTED } }),
    ]);
    return { total, male, female, matches };
  } catch (error) {
    console.error('home stats error:', error);
    return { total: 0, male: 0, female: 0, matches: 0 };
  }
}

export default async function HomePage() {
  const stats = await getStats();
  const t = await getTranslations('home');
  const nf = new Intl.NumberFormat(intlLocale(await getLocale()));

  const statCards = [
    { label: t('statTotal'), value: stats.total, icon: Users },
    { label: t('statMale'), value: stats.male, icon: User },
    { label: t('statFemale'), value: stats.female, icon: UserRound },
    { label: t('statMatches'), value: stats.matches, icon: Heart },
  ];

  const steps = [
    { icon: UserPlus, title: t('step1Title'), description: t('step1Body') },
    { icon: Search, title: t('step2Title'), description: t('step2Body') },
    { icon: Phone, title: t('step3Title'), description: t('step3Body') },
    { icon: HeartHandshake, title: t('step4Title'), description: t('step4Body') },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero + quick search */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-teal-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight">{t('heroTitle')}</h1>
          <p className="text-lg md:text-xl text-white/85 mb-3 max-w-3xl mx-auto">
            {t('heroSubtitle')}
          </p>
          <p className="text-white/75 text-sm md:text-base mb-10 max-w-2xl mx-auto">
            {t('hadith')}
          </p>
          <div className="max-w-5xl mx-auto">
            <QuickSearch />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-md p-5 text-center">
              <Icon className="h-7 w-7 text-green-700 mx-auto mb-2" />
              <p className="text-2xl md:text-3xl font-bold text-gray-900">{nf.format(value)}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Create biodata CTA */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-green-50 border border-green-100 p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{t('ctaTitle')}</h2>
              <p className="text-gray-600 mt-2">{t('ctaBody')}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button size="lg" asChild>
                <Link href="/register">{t('ctaButton')} <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/guide">{t('ctaHow')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{t('howTitle')}</h2>
            <p className="text-lg text-gray-500">{t('howSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ icon: Icon, title, description }, i) => (
              <div key={title} className="relative rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
                <span className="absolute top-3 right-4 text-sm font-semibold text-green-700/40">{nf.format(i + 1)}</span>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-700 text-white mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ayah */}
      <section className="py-16 bg-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-2xl md:text-3xl font-light mb-4 leading-relaxed" dir="rtl">وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا</p>
          <p className="text-white/75 text-lg">{t('ayahTranslation')}</p>
          <p className="text-white/60 text-sm mt-2">{t('ayahRef')}</p>
        </div>
      </section>
    </div>
  );
}
