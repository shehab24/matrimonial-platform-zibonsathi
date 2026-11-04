'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { confirmPayment, markPaymentFailed } from '@/actions/payment';

export function PaymentActions({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'confirm' | 'fail' | null>(null);

  const run = async (kind: 'confirm' | 'fail') => {
    const question = kind === 'confirm'
      ? 'CodePay ড্যাশবোর্ডে এই পেমেন্টটি পাওয়া গেছে? নিশ্চিত করলে সদস্যের অ্যাকাউন্টে ক্রেডিট যোগ হবে।'
      : 'এই পেমেন্টটি ব্যর্থ হিসেবে চিহ্নিত করবেন?';
    if (!window.confirm(question)) return;
    setBusy(kind);
    const result = kind === 'confirm' ? await confirmPayment(paymentId) : await markPaymentFailed(paymentId);
    setBusy(null);
    if (result.success) {
      toast({ variant: 'success', title: kind === 'confirm' ? 'পেমেন্ট নিশ্চিত হয়েছে, ক্রেডিট যোগ হয়েছে' : 'ব্যর্থ হিসেবে চিহ্নিত হয়েছে' });
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
    }
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => run('confirm')} disabled={!!busy}>
        {busy === 'confirm' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        নিশ্চিত করুন
      </Button>
      <Button size="sm" variant="outline" onClick={() => run('fail')} disabled={!!busy}>
        {busy === 'fail' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        ব্যর্থ
      </Button>
    </div>
  );
}
