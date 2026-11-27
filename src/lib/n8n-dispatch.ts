import 'server-only';
import { after } from 'next/server';

export type WebhookDispatchOptions = {
  requireSecret?: boolean;
};

/**
 * Dispatches an outbound webhook to n8n after the HTTP response is sent using
 * Next.js `after()` so serverless runtimes do not freeze before delivery.
 */
export function dispatchN8nWebhook(
  webhookUrl: string | undefined,
  payload: Record<string, unknown>,
  options: WebhookDispatchOptions = {}
): void {
  if (!webhookUrl) return;
  const secret = process.env.AUTOMATION_SECRET;
  if (options.requireSecret && !secret) return;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(webhookUrl);
  } catch {
    return;
  }
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return;
  }

  const send = async () => {
    try {
      const res = await fetch(parsedUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret ? { 'X-AgencyDesk-Signature': secret, Authorization: `Bearer ${secret}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        console.warn('n8n webhook dispatch returned non-2xx status', {
          status: res.status,
          path: parsedUrl.pathname,
        });
      }
    } catch (error) {
      console.warn('n8n webhook dispatch failed', {
        path: parsedUrl.pathname,
        message: error instanceof Error ? error.message : 'unknown error',
      });
    }
  };

  try {
    after(send);
  } catch {
    // Unit tests call route handlers outside a Next.js request store.
    void send();
  }
}
