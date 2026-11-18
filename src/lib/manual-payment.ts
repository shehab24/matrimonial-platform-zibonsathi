import { prisma } from './prisma';

// Manual mobile-banking payments: the member sends money to the admin's number, then submits the TrxID.
// An admin checks it against the bKash/Nagad/Rocket app and confirms, which adds the credits.
export const MANUAL_METHODS = ['bkash', 'nagad', 'rocket'] as const;
export type ManualMethod = (typeof MANUAL_METHODS)[number];

export const MANUAL_METHOD_LABELS: Record<ManualMethod, string> = { bkash: 'বিকাশ', nagad: 'নগদ', rocket: 'রকেট' };

export const MANUAL_KEYS = {
  enabled: 'manual_payment_enabled',
  instructions: 'manual_payment_instructions',
  bkash: 'manual_bkash_number',
  nagad: 'manual_nagad_number',
  rocket: 'manual_rocket_number',
} as const;

/** Payment.provider value for a manual payment */
export const manualProvider = (method: ManualMethod) => `manual_${method}`;

export interface ManualPaymentConfig {
  accounts: { method: ManualMethod; number: string }[];
  instructions: string;
}

/** The manual payment setup, or null when it is switched off or has no number to pay to */
export async function getManualPaymentConfig(): Promise<ManualPaymentConfig | null> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: Object.values(MANUAL_KEYS) } } });
  const get = (key: string) => rows.find((r) => r.key === key)?.value.trim() ?? '';
  if (get(MANUAL_KEYS.enabled) !== 'true') return null;
  const accounts = MANUAL_METHODS.map((method) => ({ method, number: get(MANUAL_KEYS[method]) })).filter((a) => a.number);
  if (accounts.length === 0) return null;
  return { accounts, instructions: get(MANUAL_KEYS.instructions) };
}
