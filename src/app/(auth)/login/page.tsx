import { googleEnabled } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form';

type SearchParams = Promise<{ callbackUrl?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { callbackUrl, error } = await searchParams;
  // Only follow same-site paths after login, never an external URL
  const safeCallback = callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//') ? callbackUrl : '/dashboard';

  return <LoginForm googleEnabled={googleEnabled} callbackUrl={safeCallback} oauthError={error ?? null} />;
}
