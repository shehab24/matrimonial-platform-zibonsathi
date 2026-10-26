import type { Metadata } from 'next';
import { Hind_Siliguri } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toast';
import SessionProvider from '@/components/auth/session-provider';
import { auth } from '@/lib/auth';

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-hind-siliguri',
});

export const metadata: Metadata = {
  title: 'জীবনসাথী - ইসলামিক বিবাহ প্ল্যাটফর্ম',
  description: 'নিরাপদ ইসলামিক বিবাহ সংযোগ প্ল্যাটফর্ম',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  void session; // used for SSR auth context

  return (
    <html lang="bn" className={`${hindSiliguri.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-gray-50" style={{ fontFamily: 'var(--font-hind-siliguri), sans-serif' }}>
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
