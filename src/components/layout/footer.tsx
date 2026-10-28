import Link from 'next/link';
import { Mail } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { intlLocale } from '@/i18n/config';
import { CONTACT_EMAIL } from '@/components/layout/content-page';
import { SOCIAL_LINKS } from '@/lib/constants';
import { Logo } from '@/components/layout/logo';

// Brand icons (lucide-react no longer ships brand logos)
const socialIcons = {
  facebook: {
    label: 'Facebook',
    path: 'M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07',
  },
  youtube: {
    label: 'YouTube',
    path: 'M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81M9.55 15.57V8.43L15.82 12z',
  },
  instagram: {
    label: 'Instagram',
    path: 'M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.27 16.95.07 15.67.01 15.26 0 12 0m0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88',
  },
} as const;

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <ul className="space-y-2 text-sm">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} className="hover:text-green-400 transition-colors">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function Footer() {
  const t = await getTranslations('footer');
  const tn = await getTranslations('nav');
  const tc = await getTranslations('common');
  const locale = await getLocale();
  const year = new Date().getFullYear().toLocaleString(intlLocale(locale), { useGrouping: false });
  const socials = (Object.keys(socialIcons) as (keyof typeof socialIcons)[]).filter((key) => SOCIAL_LINKS[key]);

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Logo alt={tc('brand')} tone="onDark" className="h-11 w-auto" />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">{t('tagline')}</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-4 inline-flex items-center gap-2 text-sm hover:text-green-400 transition-colors break-all">
              <Mail className="h-4 w-4 shrink-0" />
              {CONTACT_EMAIL}
            </a>
          </div>

          <FooterColumn
            title={t('usefulLinks')}
            links={[
              { href: '/browse', label: t('allBiodatas') },
              { href: '/about', label: tn('about') },
              { href: '/faq', label: tn('faq') },
              { href: '/guide', label: tn('guide') },
              { href: '/contact', label: tn('contact') },
            ]}
          />

          <FooterColumn
            title={t('services')}
            links={[
              { href: '/register', label: t('createBiodata') },
              { href: '/browse', label: t('searchBiodata') },
              { href: '/favorites', label: t('favorites') },
              { href: '/credits', label: t('creditPackages') },
            ]}
          />

          <FooterColumn
            title={t('policies')}
            links={[
              { href: '/privacy', label: t('privacy') },
              { href: '/terms', label: t('terms') },
              { href: '/refund-policy', label: t('refund') },
            ]}
          />

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('social')}</h3>
            <p className="text-sm text-slate-400 mb-4">{t('stayConnected')}</p>
            {socials.length > 0 ? (
              <div className="flex gap-3">
                {socials.map((key) => (
                  <a
                    key={key}
                    href={SOCIAL_LINKS[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={socialIcons[key].label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 hover:bg-green-700 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                      <path d={socialIcons[key].path} />
                    </svg>
                  </a>
                ))}
              </div>
            ) : (
              <Link href="/contact" className="text-sm text-green-400 hover:underline">{t('contactUs')} →</Link>
            )}
          </div>
        </div>

        <div className="border-t border-slate-700 mt-10 pt-6 text-center text-sm text-slate-500">
          <p>{t('copyright', { year })}</p>
        </div>
      </div>
    </footer>
  );
}
