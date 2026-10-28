'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { resetPassword } from '@/actions/auth';

const schema = z.object({
  password: z.string().min(8, 'passwordMin'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'passwordMismatch', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

function ResetForm() {
  const router = useRouter();
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const tc = useTranslations('common');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast({ variant: 'destructive', title: tc('error'), description: t('tokenMissing') });
      return;
    }
    setIsLoading(true);
    try {
      const result = await resetPassword(token, data.password);
      if (result.success) {
        toast({ variant: 'success', title: tc('success'), description: t('passwordChanged') });
        router.push('/login');
      } else {
        toast({ variant: 'destructive', title: tc('error'), description: result.error });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600">{t('invalidResetLink')}</p>
        <Link href="/forgot-password" className="text-green-700 hover:underline mt-2 block">{t('tryAgain')}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">{t('newPassword')}</Label>
        <Input id="password" type="password" placeholder={t('passwordMinPlaceholder')} {...register('password')} />
        {errors.password && <p className="text-sm text-red-600">{tv(errors.password.message ?? '')}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
        <Input id="confirmPassword" type="password" placeholder={t('confirmPasswordPlaceholder')} {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="text-sm text-red-600">{tv(errors.confirmPassword.message ?? '')}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? t('changing') : t('changePassword')}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{t('resetTitle')}</CardTitle>
            <CardDescription>{t('resetSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-center text-gray-500">{tc('loading')}</div>}>
              <ResetForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
