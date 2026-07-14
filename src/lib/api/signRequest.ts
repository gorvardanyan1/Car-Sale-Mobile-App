import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

import { readPublicEnv } from '@/lib/env/publicEnv';

let cachedSecret: string | undefined;

function getSecret(): string {
  if (cachedSecret === undefined) {
    cachedSecret = readPublicEnv('EXPO_PUBLIC_MOBILE_APP_SECRET') ?? '';

    if (!cachedSecret && __DEV__) {
      console.warn(
        '[api] EXPO_PUBLIC_MOBILE_APP_SECRET is not set — requests will be rejected with 403 ' +
          'by the API. Set it in your local .env to match the server MOBILE_APP_SECRET.',
      );
    }
  }

  return cachedSecret;
}

/**
 * Signs a request the same way `VerifyMobileAppSignature` on the API verifies it:
 * HMAC-SHA256 of `METHOD\npath+query\ntimestamp\nbody`, using the shared app secret.
 *
 * `body` must be omitted (not empty string) for multipart/form-data requests — PHP
 * cannot read the raw body for that content type, so the server signs against ''
 * for those requests too.
 */
export function signRequest(method: string, url: string, body?: string): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const { pathname, search } = new URL(url);
  const payload = `${method.toUpperCase()}\n${pathname}${search}\n${timestamp}\n${body ?? ''}`;
  const signature = bytesToHex(hmac(sha256, utf8ToBytes(getSecret()), utf8ToBytes(payload)));

  return {
    'X-App-Timestamp': timestamp,
    'X-App-Signature': signature,
  };
}
