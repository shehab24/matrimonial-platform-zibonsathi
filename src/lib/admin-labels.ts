// Bangla labels for the admin panel (admin UI is Bangla-only)
export const STATUS_LABELS = {
  DRAFT: 'খসড়া',
  PENDING_APPROVAL: 'রিভিউয়ের অপেক্ষায়',
  APPROVED: 'অনুমোদিত',
  REJECTED: 'প্রত্যাখ্যাত',
  SUSPENDED: 'স্থগিত',
} as const;

export const STATUS_STYLES = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-gray-700 text-white',
} as const;

export const GENDER_LABELS = { MALE: 'পাত্র', FEMALE: 'পাত্রী' } as const;

export const MARITAL_LABELS = { NEVER_MARRIED: 'অবিবাহিত', DIVORCED: 'তালাকপ্রাপ্ত', WIDOWED: 'বিধবা/বিপত্নীক' } as const;

export const bnNumber = (n: number) => n.toLocaleString('bn-BD');

export const bnDate = (d: Date | string | null) => (d ? new Date(d).toLocaleDateString('bn-BD') : '—');

export const REPORT_REASON_LABELS: Record<string, string> = {
  FAKE_PROFILE: 'ভুয়া প্রোফাইল',
  INAPPROPRIATE_CONTENT: 'অনুপযুক্ত তথ্য বা ছবি',
  HARASSMENT: 'হয়রানি বা অসদাচরণ',
  SCAM: 'প্রতারণা বা টাকা চাওয়া',
  OTHER: 'অন্যান্য',
};
