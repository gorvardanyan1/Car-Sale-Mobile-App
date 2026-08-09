import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';

import { buildRedirectUri } from '@/lib/auth/googleAuth';

const { platform } = vi.hoisted(() => ({ platform: { OS: 'android' as string } }));

// Hoisted by vitest above the imports, so googleAuth loads against these.
vi.mock('react-native', () => ({ Platform: platform }));
vi.mock('expo-constants', () => ({ default: { expoGoConfig: null } }));
vi.mock('expo-auth-session', () => ({
  AuthRequest: class {},
  exchangeCodeAsync: vi.fn(),
  makeRedirectUri: vi.fn(() => 'car-sale-rn://oauthredirect'),
  ResponseType: { Code: 'code' },
  CodeChallengeMethod: { S256: 'S256' },
}));
vi.mock('@/lib/env/publicEnv', () => ({ readPublicEnv: () => undefined }));

// app.config.js is CommonJS and lives outside src/, so it is required rather
// than imported. Only its pure scheme helpers are exercised here.
const require_ = createRequire(import.meta.url);
const { appSchemes, reversedClientIdScheme } = require_('../../../../app.config.js');

const ANDROID_CLIENT_ID = '91785907520-2ia9spi5b4rg97epil523u96tgfhsnsa.apps.googleusercontent.com';
const IOS_CLIENT_ID = '91785907520-iosabcdef.apps.googleusercontent.com';

describe('reversedClientIdScheme', () => {
  it('derives the scheme Google actually redirects to', () => {
    expect(reversedClientIdScheme(ANDROID_CLIENT_ID)).toBe(
      'com.googleusercontent.apps.91785907520-2ia9spi5b4rg97epil523u96tgfhsnsa',
    );
  });

  it('registers nothing for an unset client id', () => {
    expect(reversedClientIdScheme('')).toBeNull();
    expect(reversedClientIdScheme(undefined)).toBeNull();
  });
});

describe('appSchemes', () => {
  /**
   * The bug this guards: with the reversed scheme registered for only one
   * platform, Google's consent screen succeeds and the redirect then lands
   * nowhere on the other — a failure that shows up only on a real device,
   * after the user has already picked an account.
   */
  it('registers a reversed scheme for every configured Google client', () => {
    expect(appSchemes('car-sale-rn', [ANDROID_CLIENT_ID, IOS_CLIENT_ID])).toEqual([
      'car-sale-rn',
      'com.googleusercontent.apps.91785907520-2ia9spi5b4rg97epil523u96tgfhsnsa',
      'com.googleusercontent.apps.91785907520-iosabcdef',
    ]);
  });

  /**
   * The scheme the app *declares* must be the one the sign-in flow *asks Google
   * to use*, or the redirect is unroutable. These two live in different files
   * and different module systems, which is exactly how they drifted apart.
   */
  it('declares exactly the scheme the sign-in flow builds its redirect from', () => {
    const schemes = appSchemes('car-sale-rn', [ANDROID_CLIENT_ID]);
    const redirectUri = buildRedirectUri(ANDROID_CLIENT_ID);
    const redirectScheme = redirectUri.slice(0, redirectUri.indexOf(':'));

    expect(redirectScheme).toBe(
      'com.googleusercontent.apps.91785907520-2ia9spi5b4rg97epil523u96tgfhsnsa',
    );
    expect(schemes).toContain(redirectScheme);
  });

  it('keeps the app scheme alone when no Google client is configured', () => {
    expect(appSchemes('car-sale-rn', ['', undefined])).toEqual(['car-sale-rn']);
  });

  it('does not register the same scheme twice', () => {
    expect(appSchemes('car-sale-rn', [ANDROID_CLIENT_ID, ANDROID_CLIENT_ID])).toEqual([
      'car-sale-rn',
      'com.googleusercontent.apps.91785907520-2ia9spi5b4rg97epil523u96tgfhsnsa',
    ]);
  });

  it('accepts a base scheme that is already a list', () => {
    expect(appSchemes(['car-sale-rn', 'autohayq'], [ANDROID_CLIENT_ID])).toEqual([
      'car-sale-rn',
      'autohayq',
      'com.googleusercontent.apps.91785907520-2ia9spi5b4rg97epil523u96tgfhsnsa',
    ]);
  });
});
