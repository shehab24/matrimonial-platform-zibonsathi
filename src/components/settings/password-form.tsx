'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Lock, Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { changePassword } from '@/actions/account';

/** Password row on the settings page; expands into a change form. Google-only accounts set a first password. */
export function PasswordForm({ hasPassword: initialHasPassword }: { hasPassword: boolean }) {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && next !== confirm;

  const close = () => {
    setOpen(false);
    setCurrent('');
    setNext('');
    setConfirm('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) return;
    setSaving(true);
    const result = await changePassword({ currentPassword: hasPassword ? current : undefined, newPassword: next });
    setSaving(false);
    if (result.success) {
      toast({ variant: 'success', title: t('passwordChanged') });
      setHasPassword(true);
      close();
    } else {
      toast({ variant: 'destructive', title: tc('error'), description: result.error });
    }
  };

  return (
    <div className="py-4">
      <div className="flex items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
          <Lock className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <dt className="text-xs text-gray-500">{t('password')}</dt>
          <dd className="font-semibold tracking-[0.3em] text-gray-900">
            {hasPassword ? '••••••••' : <span className="font-normal tracking-normal text-gray-400">{t('noPassword')}</span>}
          </dd>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:underline"
          >
            <Pencil className="h-3.5 w-3.5" />
            {hasPassword ? t('change') : t('setPassword')}
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={onSubmit} className="mt-4 grid gap-4 rounded-lg bg-gray-50 p-4 sm:ml-14 sm:max-w-md">
          {hasPassword && (
            <div className="space-y-1.5">
              <Label htmlFor="current-password">{t('currentPassword')}</Label>
              <Input id="current-password" type="password" autoComplete="current-password" required value={current} onChange={e => setCurrent(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="new-password">{t('newPassword')}</Label>
            <Input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={next} onChange={e => setNext(e.target.value)} />
            <p className="text-xs text-gray-500">{t('passwordHint')}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
            <Input id="confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} />
            {mismatch && <p className="text-xs text-red-600">{t('mismatch')}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving || mismatch || next.length < 8}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {tc('save')}
            </Button>
            <Button type="button" variant="outline" onClick={close}>{tc('cancel')}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
