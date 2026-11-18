'use client';

import { useState, useTransition } from 'react';
import { Gift, Loader2 } from 'lucide-react';
import { grantCredits } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

const PRESETS = [1, 3, 5, 10];

/** Opens a dialog that gifts free connection credits to one user. */
export function GrantCreditsButton({
  userId,
  userLabel,
  onGranted,
}: {
  userId: string;
  userLabel: string;
  onGranted?: (balance: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('1');
  const [note, setNote] = useState('');
  const [isPending, startTransition] = useTransition();

  const reset = () => { setAmount('1'); setNote(''); };

  const submit = () =>
    startTransition(async () => {
      const result = await grantCredits(userId, Number(amount), note);
      if (result.success) {
        toast({
          variant: 'success',
          title: `${Number(amount).toLocaleString('bn-BD')}টি সংযোগ দেওয়া হয়েছে`,
          description: `${userLabel} এর বর্তমান ব্যালেন্স: ${(result.balance ?? 0).toLocaleString('bn-BD')}`,
        });
        onGranted?.(result.balance ?? 0);
        setOpen(false);
        reset();
      } else {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
      }
    });

  const valid = Number.isInteger(Number(amount)) && Number(amount) >= 1 && Number(amount) <= 100;

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="text-green-700 border-green-200 hover:bg-green-50">
        <Gift className="h-4 w-4" /> সংযোগ দিন
      </Button>
      <Dialog open={open} onOpenChange={(v) => { if (!isPending) { setOpen(v); if (!v) reset(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ফ্রি সংযোগ উপহার দিন</DialogTitle>
            <DialogDescription>
              <strong className="font-semibold">{userLabel}</strong> এর অ্যাকাউন্টে সংযোগ ক্রেডিট যোগ হবে। প্রতি সংযোগ অনুরোধে ১টি ক্রেডিট লাগে।
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gift-amount">সংযোগ সংখ্যা</Label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((n) => (
                  <Button
                    key={n}
                    type="button"
                    size="sm"
                    variant={Number(amount) === n ? 'default' : 'outline'}
                    onClick={() => setAmount(String(n))}
                  >
                    {n.toLocaleString('bn-BD')}
                  </Button>
                ))}
                <Input
                  id="gift-amount"
                  type="number"
                  min={1}
                  max={100}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-9 w-24"
                />
              </div>
              {!valid && <p className="text-xs text-red-600">১ থেকে ১০০ এর মধ্যে সংখ্যা দিন</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gift-note">নোট (ব্যবহারকারী দেখতে পাবেন)</Label>
              <Input
                id="gift-note"
                value={note}
                maxLength={200}
                onChange={(e) => setNote(e.target.value)}
                placeholder="অ্যাডমিনের পক্ষ থেকে উপহার"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" disabled={isPending} onClick={() => setOpen(false)}>বাতিল</Button>
            <Button disabled={isPending || !valid} onClick={submit}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />} দিন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
