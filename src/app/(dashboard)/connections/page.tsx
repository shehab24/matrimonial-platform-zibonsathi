export const dynamic = 'force-dynamic';
'use client';

import { useState, useEffect } from 'react';
import { getMyConnections, respondToConnection } from '@/actions/connection';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { MapPin, GraduationCap } from 'lucide-react';

type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

interface Connection {
  id: string;
  status: ConnectionStatus;
  createdAt: string;
  senderProfile?: { id: string; displayName: string | null; division: string | null; district: string | null; education: string | null; photos: { url: string }[] };
  receiverProfile?: { id: string; displayName: string | null; division: string | null; district: string | null; education: string | null; photos: { url: string }[] };
}

const statusBadge = (status: ConnectionStatus) => {
  if (status === 'ACCEPTED') return <Badge variant="success">গৃহীত</Badge>;
  if (status === 'REJECTED') return <Badge variant="destructive">প্রত্যাখ্যাত</Badge>;
  return <Badge variant="warning">অপেক্ষমান</Badge>;
};

export default function ConnectionsPage() {
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('received');
  const [sent, setSent] = useState<Connection[]>([]);
  const [received, setReceived] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    const result = await getMyConnections();
    if (result.success) {
      setSent((result.sent ?? []) as unknown as Connection[]);
      setReceived((result.received ?? []) as unknown as Connection[]);
    }
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRespond = async (connectionId: string, action: 'ACCEPT' | 'REJECT') => {
    const result = await respondToConnection(connectionId, action);
    if (result.success) {
      toast({ variant: 'success', title: action === 'ACCEPT' ? 'সংযোগ গৃহীত হয়েছে' : 'সংযোগ প্রত্যাখ্যাত হয়েছে' });
      await load();
    } else {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
    }
  };

  const ConnectionCard = ({ conn, type }: { conn: Connection; type: 'sent' | 'received' }) => {
    const profile = type === 'sent' ? conn.receiverProfile : conn.senderProfile;
    if (!profile) return null;

    return (
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{(profile.displayName ?? '?').charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{profile.displayName ?? 'অজানা'}</p>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                  {(profile.division || profile.district) && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[profile.district, profile.division].filter(Boolean).join(', ')}</span>
                  )}
                  {profile.education && (
                    <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{profile.education}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {statusBadge(conn.status)}
              {type === 'received' && conn.status === 'PENDING' && (
                <>
                  <Button size="sm" onClick={() => handleRespond(conn.id, 'ACCEPT')}>গ্রহণ</Button>
                  <Button size="sm" variant="outline" onClick={() => handleRespond(conn.id, 'REJECT')}>প্রত্যাখ্যান</Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">লোড হচ্ছে...</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">সংযোগ</h1>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'received' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          প্রাপ্ত সংযোগ
          {received.filter(c => c.status === 'PENDING').length > 0 && (
            <Badge className="ml-2 h-5 min-w-5 text-xs">{received.filter(c => c.status === 'PENDING').length}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sent' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          পাঠানো সংযোগ ({sent.length})
        </button>
      </div>

      <div className="space-y-3">
        {activeTab === 'received' ? (
          received.length === 0 ? (
            <p className="text-center text-gray-500 py-12">কোনো সংযোগ পাওয়া যায়নি</p>
          ) : (
            received.map(conn => <ConnectionCard key={conn.id} conn={conn} type="received" />)
          )
        ) : (
          sent.length === 0 ? (
            <p className="text-center text-gray-500 py-12">কোনো সংযোগ পাঠানো হয়নি</p>
          ) : (
            sent.map(conn => <ConnectionCard key={conn.id} conn={conn} type="sent" />)
          )
        )}
      </div>
    </div>
  );
}
