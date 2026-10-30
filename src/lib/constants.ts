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
