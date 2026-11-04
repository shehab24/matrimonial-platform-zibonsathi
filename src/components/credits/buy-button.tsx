'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { startCodePayCheckout } from '@/actions/payment';

/** Starts a CodePay checkout and sends the member to the hosted payment page */
export function BuyButton({ packageId, enabled }: { packageId: string; enabled: boolean }) {
  const t = useTranslations('credits');
  const tc = useTranslations('common');
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    const result = await startCodePayCheckout(packageId);
    if (result.success && result.paymentUrl) {
      window.location.href = result.paymentUrl;
      return;
    }
    setLoading(false);
    toast({ variant: 'destructive', title: tc('error'), description: result.error });
  };

  return (
    <Button className="w-full mt-4" onClick={onClick} disabled={!enabled || loading}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? t('redirecting') : enabled ? t('buy') : t('paymentSoon')}
    </Button>
  );
}
