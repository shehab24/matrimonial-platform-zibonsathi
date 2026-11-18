'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check, CheckCircle2, Copy, Loader2, Smartphone } from 'lucide-react';
import { submitManualPayment } from '@/actions/payment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Method = 'bkash' | 'nagad' | 'rocket';

const METHOD_STYLE: Record<Method, string> = {
  bkash: 'data-[active=true]:border-pink-500 data-[active=true]:bg-pink-50 data-[active=true]:text-pink-700',
  nagad: 'data-[active=true]:border-orange-500 data-[active=true]:bg-orange-50 data-[active=true]:text-orange-700',
  rocket: 'data-[active=true]:border-purple-500 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-700',
};

/** Pay for a package by sending money to the admin's bKash/Nagad/Rocket number, then submitting the TrxID */
export function ManualPayButton({
  pkg,
  accounts,
  instructions,
  priceLabel,
  variant = 'default',
}: {
  pkg: { id: string; name: string };
  accounts: { method: Method; number: string }[];
  instructions: string;
  priceLabel: string;
  variant?: 'default' | 'outline';
}) {
  const t = useTranslations('credits.manual');
  const tc = useTranslations('common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<Method>(accounts[0].method);
  const [sender, setSender] = useState('');
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const account = accounts.find((a) => a.method === method) ?? accounts[0];

  const close = (v: boolean) => {
    if (isPending) return;
    setOpen(v);
    if (!v) {
      setSender('');
      setTrxId('');
      setDone(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(account.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the number is still visible to copy by hand */
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitManualPayment({ packageId: pkg.id, method, senderNumber: sender, trxId });
      if (result.success) {
        setDone(true);
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: tc('error'), description: result.error });
      }
    });
  };

  return (
    <>
      <Button variant={variant} className="w-full mt-2" onClick={() => setOpen(true)}>
        <Smartphone className="h-4 w-4" /> {t('button')}
      </Button>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {done ? (
            <div className="py-4 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <DialogTitle className="mt-4">{t('doneTitle')}</DialogTitle>
              <DialogDescription className="mt-2">{t('doneBody')}</DialogDescription>
              <Button className="mt-6" onClick={() => close(false)}>{tc('close')}</Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t('title', { name: pkg.name })}</DialogTitle>
                <DialogDescription>{t('subtitle')}</DialogDescription>
              </DialogHeader>

              {accounts.length > 1 && (
                <div className="grid grid-cols-3 gap-2">
                  {accounts.map((a) => (
                    <button
                      key={a.method}
                      type="button"
                      data-active={a.method === method}
                      onClick={() => setMethod(a.method)}
                      className={cn('rounded-lg border-2 border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600', METHOD_STYLE[a.method])}
                    >
                      {t(`methods.${a.method}`)}
                    </button>
                  ))}
                </div>
              )}

              <ol className="list-decimal space-y-3 rounded-xl bg-gray-50 py-4 pl-8 pr-4 text-sm text-gray-700">
                <li>
                  {t('step1', { method: t(`methods.${method}`), amount: priceLabel })}
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <span className="font-mono text-lg font-bold tracking-wide text-gray-900">{account.number}</span>
                    <Button type="button" size="sm" variant="outline" onClick={copy}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? t('copied') : t('copy')}
                    </Button>
                  </div>
                </li>
                <li>{t('step2')}</li>
                {instructions && <li className="list-none -ml-4 whitespace-pre-line rounded-lg bg-yellow-50 px-3 py-2 text-yellow-900">{instructions}</li>}
              </ol>

              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="manual-sender">{t('senderLabel', { method: t(`methods.${method}`) })}</Label>
                  <Input id="manual-sender" inputMode="tel" required value={sender} onChange={(e) => setSender(e.target.value)} placeholder="01XXXXXXXXX" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="manual-trx">{t('trxLabel')}</Label>
                  <Input
                    id="manual-trx"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                    placeholder="8N7A6B5C4D"
                    className="font-mono uppercase"
                    autoComplete="off"
                  />
                  <p className="text-xs text-gray-500">{t('trxHint')}</p>
                </div>
                <Button type="submit" className="w-full" disabled={isPending || !sender.trim() || trxId.trim().length < 6}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('submit')}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
