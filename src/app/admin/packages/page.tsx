'use client';

import { useState, useEffect } from 'react';
import { listCreditPackages, createCreditPackage, toggleCreditPackage } from '@/actions/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Package } from 'lucide-react';

interface CreditPackage {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  price: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', credits: '', price: '' });
  const [isCreating, setIsCreating] = useState(false);

  const show = (result: Awaited<ReturnType<typeof listCreditPackages>>) => {
    if (result.success) setPackages((result.packages ?? []) as unknown as CreditPackage[]);
    setIsLoading(false);
  };

  // Refreshes in place after an action; isLoading only covers the first load
  const load = async () => show(await listCreditPackages());

  useEffect(() => { listCreditPackages().then(show); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.credits || !form.price) {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: 'সকল তথ্য দিন।' });
      return;
    }
    setIsCreating(true);
    const result = await createCreditPackage({
      name: form.name,
      description: form.description || undefined,
      credits: parseInt(form.credits),
      price: parseFloat(form.price),
    });
    if (result.success) {
      toast({ variant: 'success', title: 'প্যাকেজ তৈরি হয়েছে' });
      setForm({ name: '', description: '', credits: '', price: '' });
      setShowForm(false);
      await load();
    } else {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
    }
    setIsCreating(false);
  };

  const handleToggle = async (id: string, current: boolean) => {
    const result = await toggleCreditPackage(id, !current);
    if (result.success) {
      toast({ variant: 'success', title: current ? 'প্যাকেজ নিষ্ক্রিয় হয়েছে' : 'প্যাকেজ সক্রিয় হয়েছে' });
      await load();
    } else {
      toast({ variant: 'destructive', title: 'ত্রুটি', description: result.error });
    }
  };

  if (isLoading) return <div className="py-16 text-center text-gray-500">লোড হচ্ছে...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ক্রেডিট প্যাকেজ</h1>
          <p className="text-gray-500 mt-1">মোট {packages.length} টি প্যাকেজ</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> নতুন প্যাকেজ
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader><CardTitle>নতুন প্যাকেজ তৈরি করুন</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>প্যাকেজের নাম</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="যেমন: ১০ ক্রেডিট" />
              </div>
              <div className="space-y-2">
                <Label>ক্রেডিট সংখ্যা</Label>
                <Input type="number" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: e.target.value }))} placeholder="10" />
              </div>
              <div className="space-y-2">
                <Label>মূল্য (BDT)</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="500" />
              </div>
              <div className="space-y-2">
                <Label>বিবরণ (ঐচ্ছিক)</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="বিবরণ" />
              </div>
              <div className="col-span-2 md:col-span-4 flex gap-2">
                <Button type="submit" disabled={isCreating}>{isCreating ? 'তৈরি হচ্ছে...' : 'তৈরি করুন'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>বাতিল</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {packages.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p>কোনো প্যাকেজ নেই। একটি তৈরি করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages.map(pkg => (
            <Card key={pkg.id} className={pkg.isActive ? '' : 'opacity-60'}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                  <Badge variant={pkg.isActive ? 'success' : 'secondary'}>{pkg.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</Badge>
                </div>
                <div className="text-3xl font-bold text-green-700 mb-1">{pkg.credits} <span className="text-lg text-gray-500">ক্রেডিট</span></div>
                <div className="text-xl font-semibold text-gray-900 mb-3">৳{Number(pkg.price).toLocaleString()}</div>
                {pkg.description && <p className="text-sm text-gray-500 mb-3">{pkg.description}</p>}
                <Button
                  size="sm"
                  variant={pkg.isActive ? 'outline' : 'default'}
                  className="w-full"
                  onClick={() => handleToggle(pkg.id, pkg.isActive)}
                >
                  {pkg.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
