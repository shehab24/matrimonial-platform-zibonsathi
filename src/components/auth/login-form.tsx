'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { GoogleButton, OrDivider } from './google-button';
import { Logo } from '@/components/layout/logo';

const loginSchema = z.object({
  email: z.string().email('invalidEmail'),
  password: z.string().min(1, 'passwordRequired'),
  remember: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

const inputClass =
  'h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-11 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600';

export function LoginForm({ googleEnabled, callbackUrl, oauthError }: { googleEnabled: boolean; callbackUrl: string; oauthError: string | null }) {
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const tc = useTranslations('common');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  });

  // Auth.js sends failed Google sign-ins back here with ?error=...
  useEffect(() => {
    if (!oauthError) return;
    toast({ variant: 'destructive', title: tc('error'), description: oauthError === 'AccessDenied' ? t('googleDenied') : t('googleFailed') });
  }, [oauthError, t, tc]);

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        remember: String(data.remember),
        redirect: false,
      });

      if (result?.error) {
        let errorMsg = t('loginFailed');
        if (result.error === 'EMAIL_NOT_VERIFIED') errorMsg = t('emailNotVerified');
        if (result.error === 'ACCOUNT_SUSPENDED') errorMsg = t('accountSuspended');
        if (result.error === 'CredentialsSignin') errorMsg = t('invalidCredentials');
        toast({ variant: 'destructive', title: tc('error'), description: errorMsg });
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex justify-center">
          <Logo alt={tc('brand')} className="h-12 w-auto" />
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">{t('loginTitle')}</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800">{t('emailLabel')}</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input id="email" type="email" autoComplete="email" placeholder={t('emailPlaceholder')} className={inputClass} {...register('email')} />
              </div>
              {errors.email && <p className="text-sm text-red-600">{tv(errors.email.message ?? '')}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800">{t('password')}</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={t('passwordPlaceholder')}
                  className={inputClass}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                  title={showPassword ? t('hidePassword') : t('showPassword')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:text-gray-800"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-600">{tv(errors.password.message ?? '')}</p>}
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="h-4 w-4 rounded accent-green-700" {...register('remember')} />
                {t('rememberMe')}
              </label>
              <Link href="/forgot-password" className="text-sm font-semibold text-green-700 hover:underline">
                {t('forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-700 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-green-900/20 transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
              {isLoading ? t('loggingIn') : t('loginButton')}
            </button>
          </form>

          <div className="my-6">
            <OrDivider />
          </div>

          <GoogleButton enabled={googleEnabled} callbackUrl={callbackUrl} />

          <p className="mt-6 text-center text-sm text-gray-600">
            {t('noAccountQ')}{' '}
            <Link href="/register" className="font-semibold text-green-700 hover:underline">
              {t('createAccount')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
