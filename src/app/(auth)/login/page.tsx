'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('invalidEmail'),
  password: z.string().min(1, 'passwordRequired'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const tc = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        let errorMsg = t('loginFailed');
        if (result.error === 'EMAIL_NOT_VERIFIED') errorMsg = t('emailNotVerified');
        if (result.error === 'ACCOUNT_SUSPENDED') errorMsg = t('accountSuspended');
        if (result.error === 'CredentialsSignin') errorMsg = t('invalidCredentials');

        toast({ variant: 'destructive', title: tc('error'), description: errorMsg });
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-700 rounded-full p-3">
              <Heart className="h-8 w-8 text-white fill-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{tc('brand')}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('loginTitle')}</CardTitle>
            <CardDescription>{t('loginSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  {...register('email')}
                />
                {errors.email && <p className="text-sm text-red-600">{tv(errors.email.message ?? '')}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('passwordPlaceholder')}
                  {...register('password')}
                />
                {errors.password && <p className="text-sm text-red-600">{tv(errors.password.message ?? '')}</p>}
              </div>

              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-green-700 hover:underline">
                  {t('forgotPassword')}
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('loggingIn') : t('loginTitle')}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-4">
              {t('noAccount')}{' '}
              <Link href="/register" className="text-green-700 hover:underline font-medium">
                {t('register')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
