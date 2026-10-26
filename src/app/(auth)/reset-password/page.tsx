'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { resetPassword } from '@/actions/auth';

const schema = z.object({
  password: z.string().min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'পাসওয়ার্ড মিলছে না', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: 'টোকেন পাওয়া যায়নি।' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await resetPassword(token, data.password);
      if (result.success) {
        toast({ variant: 'success', title: 'সফল!', description: 'পাসওয়ার্ড পরিবর্তন হয়েছে।' });
        router.push('/login');
      } else {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600">অবৈধ লিংক। পুনরায় পাসওয়ার্ড রিসেটের অনুরোধ করুন।</p>
        <Link href="/forgot-password" className="text-green-700 hover:underline mt-2 block">পুনরায় চেষ্টা করুন</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">নতুন পাসওয়ার্ড</Label>
        <Input id="password" type="password" placeholder="কমপক্ষে ৮ অক্ষর" {...register('password')} />
        {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
        <Input id="confirmPassword" type="password" placeholder="পাসওয়ার্ড পুনরায় দিন" {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>নতুন পাসওয়ার্ড সেট করুন</CardTitle>
            <CardDescription>আপনার নতুন পাসওয়ার্ড দিন।</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-center text-gray-500">লোড হচ্ছে...</div>}>
              <ResetForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
