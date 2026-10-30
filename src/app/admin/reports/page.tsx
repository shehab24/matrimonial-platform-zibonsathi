'use client';

import { useState, useEffect } from 'react';
import { listReports, resolveReport } from '@/actions/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { REPORT_REASON_LABELS } from '@/lib/admin-labels';

interface Report {
  id: string;
  reason: string;
  details: string | null;
  createdAt: string;
  submitter: { email: string; name: string | null };
  target: { email: string; name: string | null };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const show = (result: Awaited<ReturnType<typeof listReports>>) => {
    if (result.success) setReports((result.reports ?? []) as unknown as Report[]);
    setIsLoading(false);
  };

  // Refreshes in place after an action; isLoading only covers the first load
  const load = async () => show(await listReports());

  useEffect(() => { listReports().then(show); }, []);

  const handleResolve = async (reportId: string) => {
    const result = await resolveReport(reportId, notes[reportId] ?? '');
    if (result.success) {
      toast({ variant: 'success', title: 'রিপোর্ট সমাধান করা হয়েছে' });
      await load();
    } else {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
    }
  };

  if (isLoading) return <div className="py-16 text-center text-gray-500">লোড হচ্ছে...</div>;

  return (
    <div>
      <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900">রিপোর্ট</h1>
        <p className="text-gray-500 mt-1">মোট {reports.length} টি খোলা রিপোর্ট</p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">কোনো খোলা রিপোর্ট নেই</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{REPORT_REASON_LABELS[report.reason] ?? report.reason}</p>
                    <p className="text-sm text-gray-500">
                      রিপোর্টকারী: {report.submitter.name ?? report.submitter.email} → অভিযুক্ত: {report.target.name ?? report.target.email}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleDateString('bn-BD')}</p>
                </div>
                {report.details && <p className="text-sm text-gray-700">{report.details}</p>}
                <div className="flex gap-2">
                  <Input
                    placeholder="অ্যাডমিন নোট"
                    value={notes[report.id] ?? ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [report.id]: e.target.value }))}
                  />
                  <Button onClick={() => handleResolve(report.id)}>সমাধান</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
