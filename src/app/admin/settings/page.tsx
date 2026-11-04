'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, MessageCircle, BarChart3 } from 'lucide-react';
import { CodePaySettings } from '@/components/admin/codepay-settings';

export default function AdminSettingsPage() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [showHomeStats, setShowHomeStats] = useState(true);
  const [savingStats, setSavingStats] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allSettings, setAllSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setWhatsappNumber(data.whatsapp_number || '');
        setShowHomeStats(data.show_home_stats !== 'false');
        setAllSettings(data);
      } catch {
        setMessage({ type: 'error', text: 'সেটিংস লোড করতে সমস্যা হয়েছে' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const saveWhatsapp = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'whatsapp_number', value: whatsappNumber }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'সফলভাবে সংরক্ষণ হয়েছে!' });
      } else {
        throw new Error();
      }
    } catch {
      setMessage({ type: 'error', text: 'সংরক্ষণ করতে সমস্যা হয়েছে' });
    } finally {
      setSaving(false);
    }
  };

  const toggleHomeStats = async () => {
    const next = !showHomeStats;
    setSavingStats(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'show_home_stats', value: String(next) }),
      });
      if (res.ok) {
        setShowHomeStats(next);
        setMessage({ type: 'success', text: 'সফলভাবে সংরক্ষণ হয়েছে!' });
      } else {
        throw new Error();
      }
    } catch {
      setMessage({ type: 'error', text: 'সংরক্ষণ করতে সমস্যা হয়েছে' });
    } finally {
      setSavingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-900">সেটিংস</h1>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            সাপোর্ট সেটিংস
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            গ্রাহক সাপোর্টের জন্য WhatsApp নম্বর সেট করুন
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp নম্বর
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+8801XXXXXXXXX"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={saveWhatsapp}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                সংরক্ষণ করুন
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              দেশের কোড সহ নম্বর দিন (যেমন: +8801977757486)। সাপোর্ট বাটনে ক্লিক করলে এই নম্বরে WhatsApp চ্যাট খুলবে।
            </p>
          </div>
        </div>
      </div>

      <CodePaySettings settings={allSettings} />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            হোমপেজ সেটিংস
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            হোমপেজে কী দেখানো হবে তা নিয়ন্ত্রণ করুন
          </p>
        </div>

        <div className="p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">পরিসংখ্যান দেখান</p>
            <p className="mt-1 text-xs text-gray-500">
              মোট বায়োডাটা, পাত্রের বায়োডাটা, পাত্রীর বায়োডাটা ও সফল সংযোগের সংখ্যা হোমপেজে দেখাবে। সংখ্যা কম থাকলে লুকিয়ে রাখতে পারেন।
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showHomeStats}
            aria-label="পরিসংখ্যান দেখান"
            onClick={toggleHomeStats}
            disabled={savingStats}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              showHomeStats ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                showHomeStats ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
