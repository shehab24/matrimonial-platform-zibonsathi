'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { forgotPassword } from '@/actions/auth';

const schema = z.object({
  email: z.string().email('সঠিক ইমেইল দিন'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setSent(true);
      toast({ variant: 'success', title: 'সফল!', description: 'পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।' });
    } catch {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: 'একটি সমস্যা হয়েছে, আবার চেষ্টা করুন।' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>পাসওয়ার্ড ভুলে গেছেন?</CardTitle>
            <CardDescription>আপনার ইমেইল দিন, আমরা রিসেট লিংক পাঠাবো।</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-4">
                <p className="text-green-700 font-medium mb-2">ইমেইল পাঠানো হয়েছে!</p>
                <p className="text-sm text-gray-600 mb-4">আপনার ইমেইল চেক করুন এবং লিংকে ক্লিক করুন।</p>
                <Link href="/login" className="text-green-700 hover:underline text-sm">লগইনে ফিরুন</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">ইমেইল</Label>
                  <Input id="email" type="email" placeholder="আপনার ইমেইল" {...register('email')} />
                  {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'পাঠানো হচ্ছে...' : 'রিসেট লিংক পাঠান'}
                </Button>
                <p className="text-center text-sm">
                  <Link href="/login" className="text-green-700 hover:underline">লগইনে ফিরুন</Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
