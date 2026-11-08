'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { deleteProfile } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

/**
 * Admin-only permanent delete. `redirectTo` is where to go afterwards (the detail page no longer exists);
 * without it the current page is refreshed (e.g. the list).
 */
export function DeleteBiodataButton({
  profileId,
  label,
  redirectTo,
  size = 'default',
  className,
}: {
  profileId: string;
  label?: string | null;
  redirectTo?: string;
  size?: 'default' | 'sm';
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const result = await deleteProfile(profileId);
      if (result.success) {
        toast({ variant: 'success', title: 'বায়োডাটা মুছে ফেলা হয়েছে' });
        setOpen(false);
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
      }
    });

  return (
    <>
      <Button variant="destructive" size={size} className={className} onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" /> {size === 'sm' ? null : 'বায়োডাটা মুছে ফেলুন'}
        {size === 'sm' && <span className="sr-only">মুছে ফেলুন</span>}
      </Button>
      <Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>বায়োডাটা স্থায়ীভাবে মুছে ফেলবেন?</DialogTitle>
            <DialogDescription>
              {label ? <strong className="font-semibold">{label}</strong> : 'এই বায়োডাটা'} এর সকল তথ্য, ছবি এবং এর সাথে যুক্ত সব সংযোগ ও মেসেজ
              মুছে যাবে। এটি আর ফেরত আনা যাবে না। ব্যবহারকারীর অ্যাকাউন্ট থাকবে এবং তিনি নতুন বায়োডাটা লিখতে পারবেন।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={isPending} onClick={() => setOpen(false)}>বাতিল</Button>
            <Button variant="destructive" disabled={isPending} onClick={confirm}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} মুছে ফেলুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
