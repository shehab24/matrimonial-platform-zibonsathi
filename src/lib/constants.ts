// Division names are stored in Bengali in the database; translate for display via the `divisions` messages
export const DIVISIONS = ['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ'] as const;

// Footer social links — an icon is only shown once its URL is filled in
export const SOCIAL_LINKS: { facebook: string; youtube: string; instagram: string } = {
  facebook: '',
  youtube: '',
  instagram: '',
};

// Reasons a member can pick when reporting a biodata (labels live in messages/*.json and admin-labels.ts)
export const REPORT_REASONS = ['FAKE_PROFILE', 'INAPPROPRIATE_CONTENT', 'HARASSMENT', 'SCAM', 'OTHER'] as const;

// Biodata form choices, stored as these Bengali strings and translated via the `options` messages.
// The browse filters match against the same values, so keep the two in sync by editing only here.
export const EDUCATION_OPTIONS = ['এসএসসি', 'এইচএসসি', 'ডিপ্লোমা', 'স্নাতক', 'স্নাতকোত্তর', 'পিএইচডি', 'হাফেজ', 'আলিম', 'ফাজিল', 'কামিল'] as const;
export const OCCUPATION_OPTIONS = ['চাকরি', 'ব্যবসা', 'শিক্ষক', 'ডাক্তার', 'ইঞ্জিনিয়ার', 'আইনজীবী', 'ছাত্র/ছাত্রী', 'গৃহিণী', 'প্রবাসী', 'অন্যান্য'] as const;
export const MAZHAB_OPTIONS = ['হানাফি', 'মালিকি', 'শাফেয়ী', 'হাম্বলি', 'আহলে হাদিস'] as const;
export const FAMILY_STATUS_OPTIONS = ['উচ্চবিত্ত', 'মধ্যবিত্ত', 'নিম্নমধ্যবিত্ত'] as const;
export const MARITAL_STATUSES = ['NEVER_MARRIED', 'DIVORCED', 'WIDOWED'] as const;

// Dropdown values in the biodata forms (stored verbatim, so imports must use exactly these)
export const INCOME_OPTIONS = ['১০,০০০ এর কম', '১০,০০০-২০,০০০', '২০,০০০-৪০,০০০', '৪০,০০০-৬০,০০০', '৬০,০০০-১,০০,০০০', '১,০০,০০০ এর বেশি'] as const;
export const FAMILY_TYPE_OPTIONS = ['একক পরিবার', 'যৌথ পরিবার'] as const;
export const PRAYER_OPTIONS = ['পাঁচ ওয়াক্ত নামাজ পড়ি', 'মাঝে মাঝে পড়ি', 'জুমার নামাজ পড়ি', 'চেষ্টা করছি'] as const;
export const BEARD_HIJAB_OPTIONS = ['হ্যাঁ, সম্পূর্ণরূপে', 'হ্যাঁ, আংশিকভাবে', 'না', 'চেষ্টা করছি'] as const;
export const SKIN_TONE_OPTIONS = ['উজ্জ্বল ফর্সা', 'ফর্সা', 'উজ্জ্বল শ্যামলা', 'শ্যামলা', 'কালো'] as const;

// Height choices in total inches: 4' 0" to 7' 0"
export const HEIGHT_MIN_INCHES = 48;
export const HEIGHT_MAX_INCHES = 84;
export const HEIGHT_INCHES = Array.from({ length: HEIGHT_MAX_INCHES - HEIGHT_MIN_INCHES + 1 }, (_, i) => HEIGHT_MIN_INCHES + i);
export const WEIGHT_MIN_KG = 25;
export const WEIGHT_MAX_KG = 250;

const toLatinDigits = (s: string) => s.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
const inRange = (n: number, min: number, max: number) => (Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : null);

/** Free-form height (5'7", ৫ ফুট ৭ ইঞ্চি, 170 cm, or total inches) → total inches, or null */
export function parseHeight(value: unknown): number | null {
  if (typeof value === 'number') return inRange(value, HEIGHT_MIN_INCHES, HEIGHT_MAX_INCHES);
  if (typeof value !== 'string' || !value.trim()) return null;
  const s = toLatinDigits(value).toLowerCase();
  // "5.2", "5.2 ft", "৫.১১ ফুট": in Bangladeshi biodatas the part after the dot is inches, not a fraction of a foot
  const dotted = s.match(/^\s*(\d)\.(\d{1,2})\s*(?:ft|feet|foot|ফুট|ফিট)?\s*$/);
  if (dotted) return Number(dotted[2]) < 12 ? inRange(Number(dotted[1]) * 12 + Number(dotted[2]), HEIGHT_MIN_INCHES, HEIGHT_MAX_INCHES) : null;
  const feet = s.match(/(\d+)\s*(?:'|’|′|ft|feet|foot|ফুট|ফিট)\s*(?:(\d+(?:\.\d+)?)\s*(?:"|”|″|in|inch|ইঞ্চি)?)?/);
  if (feet) return inRange(Number(feet[1]) * 12 + Number(feet[2] ?? 0), HEIGHT_MIN_INCHES, HEIGHT_MAX_INCHES);
  const cm = s.match(/(\d{3}(?:\.\d+)?)\s*(?:cm|সেমি|সে\.মি)/);
  if (cm) return inRange(Number(cm[1]) / 2.54, HEIGHT_MIN_INCHES, HEIGHT_MAX_INCHES);
  return inRange(Number(s.trim()), HEIGHT_MIN_INCHES, HEIGHT_MAX_INCHES);
}

/** Free-form weight (60, "৬০ কেজি", "60kg") → kg, or null */
export function parseWeight(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(toLatinDigits(value).replace(/[^\d.]/g, '')) : NaN;
  return inRange(n, WEIGHT_MIN_KG, WEIGHT_MAX_KG);
}

/** 67 → 5' 7"; pass a locale number formatter to get Bangla digits */
export function formatHeight(inches: number, num: (n: number) => string = String) {
  return `${num(Math.floor(inches / 12))}' ${num(inches % 12)}"`;
}
