import { Suspense } from 'react';
import { verifyEmail } from '@/actions/auth';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

async function VerifyContent({ token }: { token: string | undefined }) {
  if (!token) {
    return (
      <div className="text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">অবৈধ লিংক</h2>
        <p className="text-gray-600 mb-6">যাচাইকরণ টোকেন পাওয়া যায়নি।</p>
        <Button asChild><Link href="/login">লগইনে যান</Link></Button>
      </div>
    );
  }

  const result = await verifyEmail(token);

  if (result.success) {
    return (
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ইমেইল যাচাই সম্পন্ন!</h2>
        <p className="text-gray-600 mb-6">আপনার ইমেইল সফলভাবে যাচাই হয়েছে। এখন লগইন করুন।</p>
        <Button asChild><Link href="/login">লগইন করুন</Link></Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">যাচাইকরণ ব্যর্থ</h2>
      <p className="text-gray-600 mb-6">{result.error ?? 'টোকেনটি মেয়াদোত্তীর্ণ বা অবৈধ।'}</p>
      <Button asChild><Link href="/register">পুনরায় নিবন্ধন করুন</Link></Button>
    </div>
  );
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <Suspense fallback={<div className="text-center text-gray-500">যাচাই করা হচ্ছে...</div>}>
            <VerifyContent token={params.token} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
