'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertTriangle, HandHeart, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { deleteMyBiodata } from '@/actions/account';

export function DeleteBiodataPanel({ oderId, hadiaPledge }: { oderId: string | null; hadiaPledge: number | null }) {
  const t = useTranslations('deleteBiodata');
  const tc = useTranslations('common');
  const router = useRouter();
  const [understood, setUnderstood] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    setDeleting(true);
    const result = await deleteMyBiodata();
    setDeleting(false);
    if (result.success) {
      setConfirmOpen(false);
      toast({ variant: 'success', title: t('deleted'), description: t('deletedBody') });
      router.push('/dashboard');
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: tc('error'), description: result.error });
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900">{oderId ? t('whatHappensNo', { no: oderId }) : t('whatHappens')}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-700">
          <li>{t('effectHidden')}</li>
          <li>{t('effectErased')}</li>
          <li>{t('effectConnections')}</li>
          <li>{t('effectAccount')}</li>
        </ul>
      </section>

      <section className="rounded-xl border border-green-200 bg-green-50/60 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900">
          <HandHeart className="h-5 w-5 text-green-700" />
          {t('marriedTitle')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">
          {hadiaPledge != null ? t('marriedPledge', { amount: hadiaPledge }) : t('marriedNoPledge')}
        </p>
      </section>

      <section className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <p className="flex items-start gap-2 text-sm leading-relaxed text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {t('irreversible')}
        </p>
        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-red-600"
            checked={understood}
            onChange={e => setUnderstood(e.target.checked)}
          />
          <span className="text-sm font-medium text-gray-900">{t('understand')}</span>
        </label>
        <Button variant="destructive" className="mt-4" disabled={!understood} onClick={() => setConfirmOpen(true)}>
          <Trash2 className="h-4 w-4" />
          {t('deleteButton')}
        </Button>
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmTitle')}</DialogTitle>
            <DialogDescription>{t('confirmBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleting}>{tc('cancel')}</Button>
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
