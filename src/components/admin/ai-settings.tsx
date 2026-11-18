'use client';

import { useState } from 'react';
import { Sparkles, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { PasswordInput } from '@/components/ui/password-input';

const DEFAULT_GEMINI_MODEL = 'gemini-flash-latest';

async function saveSetting(key: string, value: string) {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error(key);
}

/**
 * Gemini key and model for the biodata import page. The key is saved like the CodePay secret: never sent
 * back to the browser, and a blank field keeps the saved one. Rendered after the settings page has loaded.
 */
export function AiSettings({ settings }: { settings: Record<string, string> }) {
  const [apiKey, setApiKey] = useState('');
  const [keySet, setKeySet] = useState(settings.gemini_api_key_set === 'true');
  const [model, setModel] = useState(settings.gemini_model || DEFAULT_GEMINI_MODEL);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const save = async () => {
    setMessage(null);
    const key = apiKey.trim();
    if (!key && !keySet) {
      setMessage({ type: 'error', text: 'Gemini API কী দিন' });
      return;
    }
    // Google keys come in more than one format (AIza…, AQ.…), so only catch obvious copy mistakes
    if (key && (key.length < 20 || /\s/.test(key))) {
      setMessage({ type: 'error', text: 'API কী সঠিক মনে হচ্ছে না। পুরো কী-টি ঠিকমতো কপি হয়েছে কিনা দেখুন।' });
      return;
    }
    setSaving(true);
    try {
      if (key) await saveSetting('gemini_api_key', key);
      await saveSetting('gemini_model', model.trim() || DEFAULT_GEMINI_MODEL);
      if (key) setKeySet(true);
      setApiKey('');
      setMessage({ type: 'success', text: 'AI সেটিংস সংরক্ষণ হয়েছে! এখন বায়োডাটা ইমপোর্ট ব্যবহার করতে পারবেন।' });
    } catch {
      setMessage({ type: 'error', text: 'সংরক্ষণ করতে সমস্যা হয়েছে' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-green-600" />
          AI বায়োডাটা ইমপোর্ট (Google Gemini)
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          &quot;বায়োডাটা ইমপোর্ট&quot; পেজে পেস্ট করা লেখা Gemini দিয়ে পড়ার জন্য API কী। n8n এ যে কী ব্যবহার করছেন সেটাই দিতে পারেন।
        </p>
      </div>
      <div className="p-6 space-y-4">
        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}
        <div>
          <label htmlFor="gemini-key" className="block text-sm font-medium text-gray-700 mb-2">Gemini API Key</label>
          <PasswordInput
            id="gemini-key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={keySet ? '•••••••• (সংরক্ষিত আছে, পরিবর্তন করতে নতুন কী দিন)' : 'AIza... বা AQ....'}
            autoComplete="new-password"
          />
          {keySet ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> কী সংরক্ষিত আছে। নিরাপত্তার জন্য এটি আর দেখানো হয় না।
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-500">aistudio.google.com → Get API key থেকে নিন।</p>
          )}
        </div>
        <div>
          <label htmlFor="gemini-model" className="block text-sm font-medium text-gray-700 mb-2">Gemini মডেল</label>
          <input
            id="gemini-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={DEFAULT_GEMINI_MODEL}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <p className="mt-2 text-xs text-gray-500">n8n এ যে মডেল ব্যবহার করছেন সেটির নাম দিন (যেমন {DEFAULT_GEMINI_MODEL})।</p>
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
