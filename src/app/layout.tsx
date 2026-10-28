import type { Metadata } from 'next';
import { Inter, Noto_Sans_Bengali } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import './globals.css';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toast';
import SessionProvider from '@/components/auth/session-provider';
import { themeInitScript } from '@/components/theme/theme-toggle';
import { auth } from '@/lib/auth';


// Inter renders Latin text (emails, IDs, English UI); Bangla glyphs fall through to Noto Sans Bengali
// (its round ০ stays distinct from Latin 0, unlike some Bangla fonts)
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoBengali = Noto_Sans_Bengali({ subsets: ['bengali'], variable: '--font-noto-bengali' });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: t('title'), description: t('description') };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Load the session on the server so the navbar renders the right state on first paint
  const session = await auth();
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${inter.variable} ${notoBengali.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-gray-50" style={{ fontFamily: 'var(--font-inter), var(--font-noto-bengali), sans-serif' }}>
        <NextIntlClientProvider>
          <SessionProvider session={session}>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster />
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
