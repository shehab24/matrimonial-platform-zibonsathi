// Mobile numbers are stored normalized: Bangladeshi numbers as 01XXXXXXXXX (any +88/88 prefix dropped),
// numbers from abroad as + and 8-15 digits. Spaces and dashes are ignored. Shared by client and server.
const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';

export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const ascii = input.replace(/[০-৯]/g, d => String(BANGLA_DIGITS.indexOf(d)));
  const compact = ascii.replace(/[\s\-()]/g, '');
  const bd = compact.match(/^(?:\+?88)?(01[3-9]\d{8})$/);
  if (bd) return bd[1];
  if (/^\+\d{8,15}$/.test(compact)) return compact;
  return null;
}
