// Server-only: imported by server actions and server components
import { headers } from 'next/headers';
import { prisma } from './prisma';

// CodePay (codeblend.co) hosted checkout. Credentials are entered by an admin in Admin → Settings
// and stored in site_settings; they never live in the code or reach the browser.
export const CODEPAY_KEYS = {
  enabled: 'codepay_enabled',
  apiKey: 'codepay_api_key',
  apiSecret: 'codepay_api_secret',
  checkoutUrl: 'codepay_checkout_url',
} as const;

export const CODEPAY_DEFAULT_CHECKOUT_URL = 'https://codeblend.co/api/v1/codepay/checkout';

export interface CodePayConfig {
  apiKey: string;
  apiSecret: string;
  checkoutUrl: string;
}

/** The active CodePay config, or null when it is switched off or not fully set up */
export async function getCodePayConfig(): Promise<CodePayConfig | null> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: Object.values(CODEPAY_KEYS) } } });
  const get = (key: string) => rows.find(r => r.key === key)?.value.trim() ?? '';
  if (get(CODEPAY_KEYS.enabled) !== 'true' || !get(CODEPAY_KEYS.apiKey) || !get(CODEPAY_KEYS.apiSecret)) return null;
  return {
    apiKey: get(CODEPAY_KEYS.apiKey),
    apiSecret: get(CODEPAY_KEYS.apiSecret),
    checkoutUrl: get(CODEPAY_KEYS.checkoutUrl) || CODEPAY_DEFAULT_CHECKOUT_URL,
  };
}

/** Public base URL of this site, for the URL CodePay sends the visitor back to */
export async function siteBaseUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (configured) return configured.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export type CheckoutResult =
  | { ok: true; paymentUrl: string; response: Record<string, unknown> }
  | { ok: false; message: string; response?: Record<string, unknown> };

export async function createCodePayCheckout(
  config: CodePayConfig,
  order: { amount: number; orderId: string; customerName: string; customerEmail: string; redirectUrl: string }
): Promise<CheckoutResult> {
  try {
    const res = await fetch(config.checkoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CodePay-API-Key': config.apiKey,
        'X-CodePay-API-Secret': config.apiSecret,
      },
      body: JSON.stringify({
        amount: order.amount,
        order_id: order.orderId,
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        redirect_url: order.redirectUrl,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (typeof data.payment_url === 'string' && /^https:\/\//.test(data.payment_url)) {
      return { ok: true, paymentUrl: data.payment_url, response: data };
    }
    return { ok: false, message: typeof data.message === 'string' ? data.message : `HTTP ${res.status}`, response: data };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Network error' };
  }
}
