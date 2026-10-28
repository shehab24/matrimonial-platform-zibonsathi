'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Runs before paint (inlined in <head>) so the page never flashes the wrong theme
export const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export function ThemeToggle() {
  const t = useTranslations('nav');

  const toggle = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {}
  };

  // Icon visibility is driven by the .dark class, so no client state or hydration mismatch
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('toggleTheme')}
      title={t('toggleTheme')}
      className="p-2 rounded-md text-gray-700 hover:text-green-700 hover:bg-gray-100 transition-colors"
    >
      <Moon className="h-5 w-5 dark:hidden" />
      <Sun className="h-5 w-5 hidden dark:block" />
    </button>
  );
}
