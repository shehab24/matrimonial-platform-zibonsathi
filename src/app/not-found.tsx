import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  const tc = await getTranslations('common');

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-6xl font-bold text-green-700">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('title')}</h1>
      <p className="mt-2 text-gray-500">{t('body')}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild>
          <Link href="/">{tc('backHome')}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/browse">{t('browse')}</Link>
        </Button>
      </div>
    </div>
  );
}
