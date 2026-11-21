'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { confirmPayment, markPaymentFailed, recheckCodePayPayment } from '@/actions/payment';

const RECHECK_MESSAGES = {
  completed: 'CodePay নিশ্চিত করেছে: পেমেন্ট সম্পন্ন, ক্রেডিট যোগ হয়েছে',
  failed: 'CodePay অনুযায়ী পেমেন্ট বাতিল/মেয়াদোত্তীর্ণ, ব্যর্থ হিসেবে চিহ্নিত হয়েছে',
  pending: 'CodePay অনুযায়ী এখনো পরিশোধিত নয় (বা টাকার পরিমাণ মেলেনি)',
  unavailable: 'CodePay থেকে উত্তর পাওয়া যায়নি, পরে আবার চেষ্টা করুন',
} as const;

export function PaymentActions({ paymentId, isCodePay = false }: { paymentId: string; isCodePay?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'confirm' | 'fail' | 'recheck' | null>(null);

  const recheck = async () => {
    setBusy('recheck');
    const res = await recheckCodePayPayment(paymentId);
    setBusy(null);
    if (res.success && res.result) {
      const ok = res.result === 'completed' || res.result === 'failed';
      toast({ variant: ok ? 'success' : 'destructive', title: RECHECK_MESSAGES[res.result] });
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: res.error });
    }
  };

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
    <div className="flex flex-wrap gap-2">
      {isCodePay && (
        <Button size="sm" variant="secondary" onClick={recheck} disabled={!!busy}>
          {busy === 'recheck' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          CodePay-তে যাচাই
        </Button>
      )}
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
