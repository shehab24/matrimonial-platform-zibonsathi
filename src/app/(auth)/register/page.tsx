'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { registerUser } from '@/actions/auth';

const registerSchema = z.object({
  name: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
  email: z.string().email('সঠিক ইমেইল দিন'),
  password: z.string().min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে'),
  confirmPassword: z.string(),
  gender: z.enum(['MALE', 'FEMALE'], { message: 'লিঙ্গ নির্বাচন করুন' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'পাসওয়ার্ড মিলছে না',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
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
          title: 'সফল!',
          description: 'নিবন্ধন সম্পন্ন। আপনার ইমেইল যাচাই করুন।',
        });
        router.push('/login');
      } else {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
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
            <CardTitle>নিবন্ধন করুন</CardTitle>
            <CardDescription>একটি নতুন অ্যাকাউন্ট তৈরি করুন</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">নাম</Label>
                <Input id="name" placeholder="আপনার পূর্ণ নাম" {...register('name')} />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল</Label>
                <Input id="email" type="email" placeholder="আপনার ইমেইল" {...register('email')} />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">পাসওয়ার্ড</Label>
                <Input id="password" type="password" placeholder="কমপক্ষে ৮ অক্ষর" {...register('password')} />
                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
                <Input id="confirmPassword" type="password" placeholder="পাসওয়ার্ড পুনরায় দিন" {...register('confirmPassword')} />
                {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>লিঙ্গ</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="MALE" {...register('gender')} className="text-green-700" />
                    <span className="text-sm">পুরুষ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="FEMALE" {...register('gender')} className="text-green-700" />
                    <span className="text-sm">মহিলা</span>
                  </label>
                </div>
                {errors.gender && <p className="text-sm text-red-600">{errors.gender.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'নিবন্ধন হচ্ছে...' : 'নিবন্ধন করুন'}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-4">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <Link href="/login" className="text-green-700 hover:underline font-medium">লগইন করুন</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
