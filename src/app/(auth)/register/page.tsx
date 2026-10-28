'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { registerUser } from '@/actions/auth';

const registerSchema = z.object({
  name: z.string().min(2, 'nameMin'),
  email: z.string().email('invalidEmail'),
  password: z.string().min(8, 'passwordMin'),
  confirmPassword: z.string(),
  gender: z.enum(['MALE', 'FEMALE'], { message: 'genderRequired' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'passwordMismatch',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const tc = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const result = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        gender: data.gender,
      });

      if (result.success) {
        toast({
          variant: 'success',
          title: tc('success'),
          description: t('registerSuccess'),
        });
        router.push('/login');
      } else {
        toast({ variant: 'destructive', title: tc('error'), description: result.error });
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
            <CardTitle>{t('register')}</CardTitle>
            <CardDescription>{t('registerSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input id="name" placeholder={t('namePlaceholder')} {...register('name')} />
                {errors.name && <p className="text-sm text-red-600">{tv(errors.name.message ?? '')}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" type="email" placeholder={t('emailPlaceholder')} {...register('email')} />
                {errors.email && <p className="text-sm text-red-600">{tv(errors.email.message ?? '')}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input id="password" type="password" placeholder={t('passwordMinPlaceholder')} {...register('password')} />
                {errors.password && <p className="text-sm text-red-600">{tv(errors.password.message ?? '')}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                <Input id="confirmPassword" type="password" placeholder={t('confirmPasswordPlaceholder')} {...register('confirmPassword')} />
                {errors.confirmPassword && <p className="text-sm text-red-600">{tv(errors.confirmPassword.message ?? '')}</p>}
              </div>

              <div className="space-y-2">
                <Label>{t('gender')}</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="MALE" {...register('gender')} className="text-green-700" />
                    <span className="text-sm">{tc('male')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="FEMALE" {...register('gender')} className="text-green-700" />
                    <span className="text-sm">{tc('female')}</span>
                  </label>
                </div>
                {errors.gender && <p className="text-sm text-red-600">{tv(errors.gender.message ?? '')}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('registering') : t('register')}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-4">
              {t('haveAccount')}{' '}
              <Link href="/login" className="text-green-700 hover:underline font-medium">{t('loginTitle')}</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
