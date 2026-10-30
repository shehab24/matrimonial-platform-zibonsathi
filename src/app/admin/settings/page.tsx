'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, MessageCircle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setWhatsappNumber(data.whatsapp_number || '');
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
    </div>
  );
}
