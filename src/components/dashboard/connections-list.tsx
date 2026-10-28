'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Inbox, Send } from 'lucide-react';
import { getMyConnections, respondToConnection } from '@/actions/connection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { BiodataCard, type BiodataSummary } from './biodata-card';
import { DashboardEmptyState, DashboardListSkeleton, DashboardPageHeader } from './page-parts';

type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

interface Connection {
  id: string;
  status: ConnectionStatus;
  senderProfile?: BiodataSummary;
  receiverProfile?: BiodataSummary;
}

const statusVariant = { ACCEPTED: 'success', REJECTED: 'destructive', PENDING: 'warning' } as const;
const statusKey = { ACCEPTED: 'accepted', REJECTED: 'rejected', PENDING: 'pending' } as const;

/** Proposals sent or received, shown as biodata cards with status and accept/reject actions */
export function ConnectionsList({ type }: { type: 'sent' | 'received' }) {
  const t = useTranslations('dashboard');
  const tconn = useTranslations('connections');
  const tc = useTranslations('common');
  const [items, setItems] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const result = await getMyConnections();
    if (result.success) setItems(((type === 'sent' ? result.sent : result.received) ?? []) as unknown as Connection[]);
    setIsLoading(false);
  }, [type]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  const respond = async (connectionId: string, action: 'ACCEPT' | 'REJECT') => {
    const result = await respondToConnection(connectionId, action);
    if (result.success) {
      toast({ variant: 'success', title: action === 'ACCEPT' ? tconn('acceptedToast') : tconn('rejectedToast') });
      await load();
    } else {
      toast({ variant: 'destructive', title: tc('error'), description: result.error });
    }
  };

  const Icon = type === 'sent' ? Send : Inbox;
  const visible = items.filter((c) => (type === 'sent' ? c.receiverProfile : c.senderProfile));

  return (
    <>
      <DashboardPageHeader
        icon={Icon}
        iconClassName={type === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
        title={t(type === 'sent' ? 'nav.proposalsSent' : 'nav.proposalsReceived')}
        summary={isLoading ? undefined : t(`lists.${type}.summary`, { count: visible.length })}
      />
      {isLoading ? (
        <DashboardListSkeleton />
      ) : visible.length === 0 ? (
        <DashboardEmptyState icon={Icon} title={t(`lists.${type}.empty`)} hint={t(`lists.${type}.emptyHint`)} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {visible.map((conn) => (
            <BiodataCard
              key={conn.id}
              profile={(type === 'sent' ? conn.receiverProfile : conn.senderProfile)!}
              footer={
                <>
                  <Badge variant={statusVariant[conn.status]}>{tconn(statusKey[conn.status])}</Badge>
                  {type === 'received' && conn.status === 'PENDING' && (
                    <>
                      <Button size="sm" onClick={() => respond(conn.id, 'ACCEPT')}>{tconn('accept')}</Button>
                      <Button size="sm" variant="outline" onClick={() => respond(conn.id, 'REJECT')}>{tconn('reject')}</Button>
                    </>
                  )}
                </>
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
