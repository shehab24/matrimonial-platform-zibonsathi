import { Suspense } from 'react';
import { verifyEmail } from '@/actions/auth';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

async function VerifyContent({ token }: { token: string | undefined }) {
  const t = await getTranslations('auth');
  if (!token) {
    return (
      <div className="text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('invalidLink')}</h2>
        <p className="text-gray-600 mb-6">{t('verifyTokenMissing')}</p>
        <Button asChild><Link href="/login">{t('goToLogin')}</Link></Button>
      </div>
    );
  }

  const result = await verifyEmail(token);

  if (result.success) {
    return (
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('verifySuccessTitle')}</h2>
        <p className="text-gray-600 mb-6">{t('verifySuccessBody')}</p>
        <Button asChild><Link href="/login">{t('loginTitle')}</Link></Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('verifyFailedTitle')}</h2>
      <p className="text-gray-600 mb-6">{result.error ?? t('verifyExpired')}</p>
      <Button asChild><Link href="/register">{t('registerAgain')}</Link></Button>
    </div>
  );
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations('auth');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <Suspense fallback={<div className="text-center text-gray-500">{t('verifying')}</div>}>
            <VerifyContent token={params.token} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
