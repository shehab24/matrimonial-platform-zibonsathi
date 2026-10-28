'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, PauseCircle } from 'lucide-react';
import { approveProfile, rejectProfile, suspendProfile } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

type Status = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export function BiodataReviewActions({ profileId, status }: { profileId: string; status: Status }) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<{ success: boolean; error?: string }>, done: string) =>
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast({ variant: 'success', title: done });
        setReason('');
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
      }
    });

  const needReason = (fn: () => void) => () => {
    if (!reason.trim()) {
      toast({ variant: 'destructive', title: 'কারণ লিখুন', description: 'ব্যবহারকারীকে জানানোর জন্য একটি কারণ লিখুন।' });
      return;
    }
    fn();
  };

  return (
    <div className="space-y-3">
      {status !== 'APPROVED' && (
        <Button className="w-full" disabled={isPending} onClick={() => run(() => approveProfile(profileId), 'বায়োডাটা অনুমোদিত হয়েছে')}>
          <CheckCircle2 className="h-4 w-4" /> {status === 'SUSPENDED' ? 'পুনরায় চালু করুন' : 'অনুমোদন করুন'}
        </Button>
      )}

      {status !== 'DRAFT' && (
        <>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="প্রত্যাখ্যান/স্থগিতের কারণ (ব্যবহারকারী দেখতে পাবেন)"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <div className="grid grid-cols-2 gap-2">
            {status !== 'REJECTED' && (
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={needReason(() => run(() => rejectProfile(profileId, reason.trim()), 'বায়োডাটা প্রত্যাখ্যাত হয়েছে'))}
              >
                <XCircle className="h-4 w-4" /> প্রত্যাখ্যান
              </Button>
            )}
            {status !== 'SUSPENDED' && (
              <Button
                variant="outline"
                disabled={isPending}
                onClick={needReason(() => run(() => suspendProfile(profileId, reason.trim()), 'বায়োডাটা স্থগিত হয়েছে'))}
              >
                <PauseCircle className="h-4 w-4" /> স্থগিত
              </Button>
            )}
          </div>
        </>
      )}

      {status === 'DRAFT' && (
        <p className="text-sm text-gray-500">ব্যবহারকারী এখনো বায়োডাটা জমা দেননি। জমা দিলে এখানে অনুমোদন করতে পারবেন।</p>
      )}
    </div>
  );
}
