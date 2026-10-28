'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { LOCALE_COOKIE } from '@/i18n/config';

export function LanguageToggle() {
  const locale = useLocale();
  const t = useTranslations('nav');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const next = locale === 'bn' ? 'en' : 'bn';

  const switchLocale = () => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <button
      type="button"
      onClick={switchLocale}
      disabled={isPending}
      aria-label={t('switchLanguage')}
      title={t('switchLanguage')}
      className="flex items-center gap-1.5 px-2 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
    >
      <Globe className="h-4 w-4" />
      {next === 'en' ? 'ENG' : 'বাং'}
    </button>
  );
}
