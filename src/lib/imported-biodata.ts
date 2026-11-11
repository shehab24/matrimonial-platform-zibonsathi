/**
 * Biodatas created through the import API (/api/webhook/import-biodata) belong to a placeholder account
 * whose email ends with this domain. That is how they are told apart from biodatas members submit themselves.
 *
 * Imported biodatas are partially free: any logged-in member sees the contact numbers without a connection. Member-submitted biodatas still require an accepted connection.
 */
export const IMPORTED_EMAIL_DOMAIN = '@import.zibonsathi.local';

export function isImportedEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(IMPORTED_EMAIL_DOMAIN);
}
