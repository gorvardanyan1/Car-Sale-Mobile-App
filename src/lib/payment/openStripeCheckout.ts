import * as WebBrowser from 'expo-web-browser';

import { isSafeHttpUrl } from '@/lib/security/isSafeHttpUrl';

export type StripeCheckoutOutcome = 'success' | 'cancel' | 'dismiss';

export type StripeCheckoutResult = {
  outcome: StripeCheckoutOutcome;
  sessionId?: string;
};

function parseReturnUrl(returnUrl: string | undefined): {
  outcome: StripeCheckoutOutcome | null;
  sessionId?: string;
} {
  if (!returnUrl) {
    return { outcome: null };
  }

  try {
    const parsed = new URL(returnUrl);
    const outcome = parsed.searchParams.get('outcome');
    const sessionId = parsed.searchParams.get('session_id') ?? undefined;

    if (outcome === 'cancel') {
      return { outcome: 'cancel', sessionId };
    }

    if (outcome === 'success') {
      return { outcome: 'success', sessionId };
    }
  } catch {
    return { outcome: null };
  }

  return { outcome: null };
}

/**
 * Opens Stripe Checkout in a secure in-app browser session.
 * Card data never touches the app — Stripe hosts the payment page.
 * The session completes when Stripe loads our HTTPS /stripe/mobile-return page.
 */
export async function openStripeCheckout(
  checkoutUrl: string,
  returnUrl: string,
): Promise<StripeCheckoutResult> {
  if (!isSafeHttpUrl(checkoutUrl)) {
    throw new Error('Invalid checkout URL.');
  }

  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl, {
    preferEphemeralSession: false,
    showInRecents: false,
  });

  if (result.type === 'success') {
    const parsed = parseReturnUrl(result.url);

    return {
      outcome: parsed.outcome ?? 'success',
      sessionId: parsed.sessionId,
    };
  }

  if (result.type === 'cancel') {
    return { outcome: 'cancel' };
  }

  return { outcome: 'dismiss' };
}
