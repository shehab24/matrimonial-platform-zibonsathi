'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('সঠিক ইমেইল দিন'),
  password: z.string().min(1, 'পাসওয়ার্ড দিন'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
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
        let errorMsg = 'লগইন ব্যর্থ হয়েছে';
        if (result.error === 'EMAIL_NOT_VERIFIED') errorMsg = 'আপনার ইমেইল যাচাই করুন';
        if (result.error === 'ACCOUNT_SUSPENDED') errorMsg = 'আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে';
        if (result.error === 'CredentialsSignin') errorMsg = 'ইমেইল বা পাসওয়ার্ড সঠিক নয়';

        toast({ variant: 'destructive', title: 'ত্রুটি', description: errorMsg });
      } else {
        router.push('/profile');
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
          <h1 className="text-2xl font-bold text-gray-900">জীবনসাথী</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>লগইন করুন</CardTitle>
            <CardDescription>আপনার অ্যাকাউন্টে প্রবেশ করুন</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="আপনার ইমেইল"
                  {...register('email')}
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">পাসওয়ার্ড</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="আপনার পাসওয়ার্ড"
                  {...register('password')}
                />
                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
              </div>

              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-green-700 hover:underline">
                  পাসওয়ার্ড ভুলে গেছেন?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-4">
              অ্যাকাউন্ট নেই?{' '}
              <Link href="/register" className="text-green-700 hover:underline font-medium">
                নিবন্ধন করুন
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
