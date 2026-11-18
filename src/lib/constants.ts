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
