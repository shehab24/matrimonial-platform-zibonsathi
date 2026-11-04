'use client';

import { useState } from 'react';
import { CreditCard, Save, Loader2, CheckCircle2 } from 'lucide-react';

const DEFAULT_CHECKOUT_URL = 'https://codeblend.co/api/v1/codepay/checkout';

async function saveSetting(key: string, value: string) {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error(key);
}

/**
 * CodePay credentials. The saved secret is never sent back here; leaving the field blank keeps it.
 * Rendered only after the settings page has loaded, so `settings` seeds the form once.
 */
export function CodePaySettings({ settings }: { settings: Record<string, string> }) {
  const [enabled, setEnabled] = useState(settings.codepay_enabled === 'true');
  const [apiKey, setApiKey] = useState(settings.codepay_api_key ?? '');
  const [apiSecret, setApiSecret] = useState('');
  const [secretSet, setSecretSet] = useState(settings.codepay_api_secret_set === 'true');
  const [checkoutUrl, setCheckoutUrl] = useState(settings.codepay_checkout_url || DEFAULT_CHECKOUT_URL);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canEnable = !!apiKey.trim() && (secretSet || !!apiSecret.trim());

  const save = async () => {
    setMessage(null);
    if (enabled && !canEnable) {
      setMessage({ type: 'error', text: 'চালু করতে API Key ও API Secret দুটোই দিন' });
      return;
    }
    if (!/^https:\/\//.test(checkoutUrl.trim())) {
      setMessage({ type: 'error', text: 'Checkout URL অবশ্যই https:// দিয়ে শুরু হতে হবে' });
      return;
    }
    setSaving(true);
    try {
      await saveSetting('codepay_api_key', apiKey.trim());
      if (apiSecret.trim()) await saveSetting('codepay_api_secret', apiSecret.trim());
      await saveSetting('codepay_checkout_url', checkoutUrl.trim());
      await saveSetting('codepay_enabled', String(enabled));
      if (apiSecret.trim()) setSecretSet(true);
      setApiSecret('');
      setMessage({ type: 'success', text: 'পেমেন্ট সেটিংস সংরক্ষণ হয়েছে!' });
    } catch {
      setMessage({ type: 'error', text: 'সংরক্ষণ করতে সমস্যা হয়েছে' });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            পেমেন্ট গেটওয়ে (CodePay)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            চালু থাকলে সদস্যরা ক্রেডিট প্যাকেজ CodePay দিয়ে কিনতে পারবেন। Key ও Secret CodePay ড্যাশবোর্ড থেকে নিন।
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="CodePay চালু করুন"
          onClick={() => setEnabled(v => !v)}
          className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${enabled ? 'bg-green-600' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className="p-6 space-y-4">
        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}
        <div>
          <label htmlFor="codepay-key" className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
          <input id="codepay-key" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="cp_key_..." autoComplete="off" className={inputClass} />
        </div>
        <div>
          <label htmlFor="codepay-secret" className="block text-sm font-medium text-gray-700 mb-2">API Secret</label>
          <input
            id="codepay-secret"
            type="password"
            value={apiSecret}
            onChange={e => setApiSecret(e.target.value)}
            placeholder={secretSet ? '•••••••• (সংরক্ষিত আছে, পরিবর্তন করতে নতুন দিন)' : 'cp_sec_...'}
            autoComplete="new-password"
            className={inputClass}
          />
          {secretSet && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Secret সংরক্ষিত আছে। নিরাপত্তার জন্য এটি আর দেখানো হয় না।
            </p>
          )}
        </div>
        <div>
          <label htmlFor="codepay-url" className="block text-sm font-medium text-gray-700 mb-2">Checkout URL</label>
          <input id="codepay-url" value={checkoutUrl} onChange={e => setCheckoutUrl(e.target.value)} className={inputClass} />
          <p className="mt-2 text-xs text-gray-500">সাধারণত পরিবর্তন করার দরকার নেই।</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          সংরক্ষণ করুন
        </button>
      </div>
    </div>
  );
}
