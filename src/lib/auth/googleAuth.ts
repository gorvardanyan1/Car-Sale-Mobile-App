import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  AuthRequest,
  CodeChallengeMethod,
  exchangeCodeAsync,
  makeRedirectUri,
  ResponseType,
} from 'expo-auth-session';

import { readPublicEnv } from '@/lib/env/publicEnv';

/**
 * Native "Sign in with Google" — the OAuth 2.0 authorization-code flow with
 * PKCE, run in the system browser as RFC 8252 ("OAuth 2.0 for Native Apps")
 * requires.
 *
 * Two things make this safe to do from an app that anyone can decompile:
 *
 *  - The OAuth client is a **public client**: it has no secret, so there is no
 *    secret to leak. Only client *IDs* live here, and those are public by
 *    design.
 *  - **PKCE** binds the authorization code to this specific request. A code
 *    intercepted on its way back (a malicious app claiming the same redirect
 *    scheme, for instance) is useless without the matching `code_verifier`,
 *    which never leaves the device.
 *
 * The flow ends with an ID token, which is sent to our API. Nothing here is
 * trusted as proof of identity: the server verifies the token's signature
 * against Google's published keys and checks that its audience is one of our
 * own client IDs before it will issue a session.
 */

/** Google's OIDC endpoints. Hard-coded rather than discovered to save a round trip. */
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
} as const;

/** Identity only — no Gmail, Drive or contacts access is ever requested. */
const SCOPES = ['openid', 'email', 'profile'];

export type GoogleSignInResult =
  | { type: 'success'; idToken: string }
  | { type: 'cancelled' }
  | { type: 'error'; code: GoogleAuthErrorCode };

export type GoogleAuthErrorCode =
  | 'not_configured'
  | 'no_id_token'
  | 'exchange_failed'
  | 'unknown';

/**
 * The OAuth client ID for the current platform.
 *
 * Google issues a separate client per platform and validates the redirect
 * against it, so these are not interchangeable. The web client is the fallback
 * for Expo Go and the web build, which have no native client of their own.
 */
export function getGoogleClientId(): string | undefined {
  const platformId =
    Platform.OS === 'ios'
      ? readPublicEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID')
      : Platform.OS === 'android'
        ? readPublicEnv('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID')
        : undefined;

  return platformId ?? readPublicEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
}

/**
 * Whether the JS is running inside the Expo Go sandbox rather than our own
 * binary.
 *
 * `Constants.expoGoConfig` is only ever populated by Expo Go — unlike
 * `executionEnvironment`, which reports `storeClient` for a development build
 * too and so cannot tell the two apart.
 */
export function isExpoGo(): boolean {
  return Constants.expoGoConfig != null;
}

/**
 * Whether this build can start a Google sign-in at all.
 *
 * Expo Go can never complete one. Google's native OAuth clients authorise the
 * *calling app*: Android matches package name + signing certificate, iOS
 * matches the bundle id, and inside Expo Go the caller is Expo's own client
 * (`host.exp.exponent`, signed by Expo), not ours. Google therefore refuses the
 * request outright — the "Access blocked: this request is invalid" screen —
 * before the user can pick an account. Nor can Expo Go receive the reversed
 * client ID redirect, since that scheme belongs to our binary.
 *
 * So the button is hidden rather than offered and then broken. Running the
 * feature needs a development build (`npx expo run:android` / `run:ios`, or an
 * EAS development build).
 */
export function isGoogleAuthConfigured(): boolean {
  if (isExpoGo()) {
    // `typeof` guard because __DEV__ is a Metro global that does not exist
    // under the node test runner — same pattern as constants/config.ts.
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(
        '[auth] Google sign-in is hidden because this is Expo Go, which cannot complete it: ' +
          "Google authorises the calling app by package/bundle id and signature, and in Expo Go that is Expo's " +
          'client rather than com.autohayq.carsale. Use a development build (npx expo run:android) to test it.',
      );
    }

    return false;
  }

  return Boolean(getGoogleClientId());
}

/**
 * Where Google sends the authorization code back to.
 *
 * Native Google clients redirect to the "reversed client ID" scheme, which is
 * the only redirect they will accept; anything else is rejected by Google with
 * `redirect_uri_mismatch`. Web/Expo Go builds fall back to the app scheme,
 * which is what a web client expects.
 */
export function buildRedirectUri(clientId: string): string {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const suffix = clientId.replace(/\.apps\.googleusercontent\.com$/, '');

    if (suffix && suffix !== clientId) {
      return `com.googleusercontent.apps.${suffix}:/oauthredirect`;
    }
  }

  return makeRedirectUri({ scheme: 'car-sale-rn', path: 'oauthredirect' });
}

/**
 * Run the consent flow and return the resulting Google ID token.
 *
 * Never throws for an ordinary outcome — a cancelled sign-in and a failed
 * exchange both come back as values, so callers do not have to tell an expected
 * "user changed their mind" apart from a real fault.
 */
export async function signInWithGoogleAsync(): Promise<GoogleSignInResult> {
  const clientId = getGoogleClientId();

  // Re-checked here, not just where the button is drawn: a caller that reaches
  // this directly must not be sent to a Google error page either.
  if (!clientId || isExpoGo()) {
    return { type: 'error', code: 'not_configured' };
  }

  const redirectUri = buildRedirectUri(clientId);

  const request = new AuthRequest({
    clientId,
    redirectUri,
    scopes: [...SCOPES],
    responseType: ResponseType.Code,
    // Explicit rather than relying on the default: this is the property the
    // whole flow's safety rests on, and it should be obvious in review.
    usePKCE: true,
    codeChallengeMethod: CodeChallengeMethod.S256,
  });

  let result;

  try {
    result = await request.promptAsync(GOOGLE_DISCOVERY);
  } catch {
    return { type: 'error', code: 'unknown' };
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { type: 'cancelled' };
  }

  if (result.type !== 'success' || !result.params.code) {
    return { type: 'error', code: 'unknown' };
  }

  try {
    const tokens = await exchangeCodeAsync(
      {
        clientId,
        redirectUri,
        code: result.params.code,
        extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
      },
      { tokenEndpoint: GOOGLE_DISCOVERY.tokenEndpoint },
    );

    if (!tokens.idToken) {
      return { type: 'error', code: 'no_id_token' };
    }

    return { type: 'success', idToken: tokens.idToken };
  } catch {
    // Deliberately no token or response detail in the message — this can end up
    // in a crash report, and an ID token is a credential until it expires.
    return { type: 'error', code: 'exchange_failed' };
  }
}
