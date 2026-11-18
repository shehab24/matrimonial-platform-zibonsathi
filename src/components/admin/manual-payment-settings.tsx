'use client';

import { useState } from 'react';
import { Smartphone, Save, Loader2 } from 'lucide-react';
import { normalizePhone } from '@/lib/phone';

const KEYS = {
  enabled: 'manual_payment_enabled',
  instructions: 'manual_payment_instructions',
  bkash: 'manual_bkash_number',
  nagad: 'manual_nagad_number',
  rocket: 'manual_rocket_number',
} as const;

const METHODS = [
  { key: 'bkash', label: 'বিকাশ নম্বর' },
  { key: 'nagad', label: 'নগদ নম্বর' },
  { key: 'rocket', label: 'রকেট নম্বর' },
] as const;

async function saveSetting(key: string, value: string) {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error(key);
}

/** Numbers members send money to for manual (bKash/Nagad/Rocket) credit purchases. Blank number = method hidden. */
export function ManualPaymentSettings({ settings }: { settings: Record<string, string> }) {
  const [enabled, setEnabled] = useState(settings[KEYS.enabled] === 'true');
  const [numbers, setNumbers] = useState({
    bkash: settings[KEYS.bkash] ?? '',
    nagad: settings[KEYS.nagad] ?? '',
    rocket: settings[KEYS.rocket] ?? '',
  });
  const [instructions, setInstructions] = useState(settings[KEYS.instructions] ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const save = async () => {
    setMessage(null);
    const cleaned = { ...numbers };
    for (const { key, label } of METHODS) {
      if (!numbers[key].trim()) continue;
      const n = normalizePhone(numbers[key]);
      if (!n) {
        setMessage({ type: 'error', text: `${label} সঠিক নয় (যেমন: 01XXXXXXXXX)` });
        return;
      }
      cleaned[key] = n;
    }
    if (enabled && !Object.values(cleaned).some(Boolean)) {
      setMessage({ type: 'error', text: 'চালু করতে অন্তত একটি নম্বর দিন' });
      return;
    }
    setSaving(true);
    try {
      for (const { key } of METHODS) await saveSetting(KEYS[key], cleaned[key]);
      await saveSetting(KEYS.instructions, instructions.trim());
      await saveSetting(KEYS.enabled, String(enabled));
      setNumbers(cleaned);
      setMessage({ type: 'success', text: 'ম্যানুয়াল পেমেন্ট সেটিংস সংরক্ষণ হয়েছে!' });
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
            <Smartphone className="w-5 h-5 text-green-600" />
            ম্যানুয়াল পেমেন্ট (বিকাশ / নগদ / রকেট)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            সদস্যরা এই নম্বরে সেন্ড মানি করে ট্রানজেকশন আইডি জমা দেবেন। &quot;পেমেন্ট&quot; পেজ থেকে যাচাই করে নিশ্চিত করলে ক্রেডিট যোগ হবে।
            যে নম্বর খালি রাখবেন সেই মাধ্যম দেখানো হবে না।
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="ম্যানুয়াল পেমেন্ট চালু করুন"
          onClick={() => setEnabled((v) => !v)}
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
        <div className="grid gap-4 sm:grid-cols-3">
          {METHODS.map(({ key, label }) => (
            <div key={key}>
              <label htmlFor={`manual-${key}`} className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
              <input
                id={`manual-${key}`}
                inputMode="tel"
                value={numbers[key]}
                onChange={(e) => setNumbers((n) => ({ ...n, [key]: e.target.value }))}
                placeholder="01XXXXXXXXX"
                className={inputClass}
              />
            </div>
          ))}
        </div>
        <div>
          <label htmlFor="manual-instructions" className="block text-sm font-medium text-gray-700 mb-2">অতিরিক্ত নির্দেশনা (ঐচ্ছিক)</label>
          <textarea
            id="manual-instructions"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="যেমন: এটি পার্সোনাল নম্বর, শুধু সেন্ড মানি করুন। রেফারেন্সে আপনার বায়োডাটা নং লিখুন।"
            className={inputClass}
          />
          <p className="mt-2 text-xs text-gray-500">পেমেন্ট ফর্মে সদস্যদের দেখানো হবে।</p>
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
