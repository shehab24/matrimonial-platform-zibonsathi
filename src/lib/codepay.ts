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
  // Signs CodePay's webhook calls (Dashboard → CodePay → Developer API → Webhooks). Not the API secret.
  webhookSecret: 'codepay_webhook_secret',
} as const;

export const CODEPAY_DEFAULT_CHECKOUT_URL = 'https://codeblend.co/api/v1/codepay/checkout';

export interface CodePayConfig {
  apiKey: string;
  apiSecret: string;
  checkoutUrl: string;
  webhookSecret: string;
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
    webhookSecret: get(CODEPAY_KEYS.webhookSecret),
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
  order: { amount: number; orderId: string; customerName: string; customerEmail: string; redirectUrl: string; webhookUrl?: string }
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
        ...(order.webhookUrl ? { webhook_url: order.webhookUrl } : {}),
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

/** A payment as CodePay's status endpoint reports it */
export interface CodePayPayment {
  payment_id: string;
  order_id: string;
  // Only COMPLETED means the money was received (TrxID matched a payment SMS)
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  amount: number;
  paid_amount: number | null;
  currency: string;
  method: string | null;
  trx_id: string | null;
  sender_number: string | null;
  paid_at: string | null;
  created_at: string;
}

export type CodePayLookup =
  | { ok: true; payment: CodePayPayment }
  | { ok: false; notFound: boolean; message: string };

/**
 * Ask CodePay for a payment's real status, by our order id (CodePay returns the COMPLETED checkout for it
 * if there is one, else the latest). This is the only thing trusted for crediting: never the return URL.
 */
export async function getCodePayPayment(config: CodePayConfig, orderId: string): Promise<CodePayLookup> {
  const base = config.checkoutUrl.replace(/\/checkout\/?$/, '');
  try {
    const res = await fetch(`${base}/payments?order_id=${encodeURIComponent(orderId)}`, {
      headers: { 'X-CodePay-API-Key': config.apiKey, 'X-CodePay-API-Secret': config.apiSecret },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => null)) as (Partial<CodePayPayment> & { success?: boolean; message?: string }) | null;
    if (res.ok && data?.success && typeof data.status === 'string' && typeof data.order_id === 'string') {
      return { ok: true, payment: data as CodePayPayment };
    }
    return { ok: false, notFound: res.status === 404, message: data?.message ?? `HTTP ${res.status}` };
  } catch (error) {
    return { ok: false, notFound: false, message: error instanceof Error ? error.message : 'Network error' };
  }
}
