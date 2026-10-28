'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { forgotPassword } from '@/actions/auth';

const schema = z.object({
  email: z.string().email('invalidEmail'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const tc = useTranslations('common');
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setSent(true);
      toast({ variant: 'success', title: tc('success'), description: t('resetLinkSent') });
    } catch {
      toast({ variant: 'destructive', title: tc('error'), description: t('genericError') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{t('forgotTitle')}</CardTitle>
            <CardDescription>{t('forgotSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-4">
                <p className="text-green-700 font-medium mb-2">{t('emailSent')}</p>
                <p className="text-sm text-gray-600 mb-4">{t('checkEmail')}</p>
                <Link href="/login" className="text-green-700 hover:underline text-sm">{t('backToLogin')}</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input id="email" type="email" placeholder={t('emailPlaceholder')} {...register('email')} />
                  {errors.email && <p className="text-sm text-red-600">{tv(errors.email.message ?? '')}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('sending') : t('sendResetLink')}
                </Button>
                <p className="text-center text-sm">
                  <Link href="/login" className="text-green-700 hover:underline">{t('backToLogin')}</Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
