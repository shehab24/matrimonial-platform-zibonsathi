'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Phone, Loader2, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Logo } from '@/components/layout/logo';
import { completeAccount } from '@/actions/account';
import { normalizePhone } from '@/lib/phone';

export function CompleteAccountForm({ hasGender }: { hasGender: boolean }) {
  const t = useTranslations('completeAccount');
  const ta = useTranslations('auth');
  const tv = useTranslations('validation');
  const tc = useTranslations('common');
  const router = useRouter();
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('');
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const phoneError = touched && !normalizePhone(phone) ? tv('phoneInvalid') : null;
  const genderError = touched && !hasGender && !gender ? tv('genderRequired') : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!normalizePhone(phone) || (!hasGender && !gender)) return;
    setSaving(true);
    const result = await completeAccount({ gender: gender || undefined, phone });
    if (result.success) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setSaving(false);
      toast({ variant: 'destructive', title: tc('error'), description: result.error });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex justify-center">
          <Logo alt={tc('brand')} className="h-12 w-auto" />
        </Link>
        <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
          </div>

          {!hasGender && (
            <fieldset>
              <legend className="mb-2 block text-sm font-semibold text-gray-800">{ta('genderIdentity')}</legend>
              <div className="grid grid-cols-2 gap-3">
                {(['MALE', 'FEMALE'] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    aria-pressed={gender === g}
                    className={`h-12 rounded-xl border text-sm font-semibold transition-colors ${
                      gender === g ? 'border-green-700 bg-green-50 text-green-700 ring-1 ring-green-700' : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {g === 'MALE' ? tc('male') : tc('female')}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">{t('genderFixed')}</p>
              {genderError && <p className="mt-1 text-sm text-red-600">{genderError}</p>}
            </fieldset>
          )}

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-800">{ta('phone')}</label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <p className="text-xs text-gray-500">{ta('phoneHint')}</p>
            {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-700 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-green-900/20 transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {t('continue')}
          </button>
        </form>
      </div>
    </div>
  );
}
