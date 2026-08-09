import { describe, expect, it } from 'vitest';

import {
  MOBILE_AUTH_CONFIG_FALLBACK,
  resolveMobileAuthConfig,
} from '@/lib/auth/resolveMobileAuthConfig';
import type { MobileAuthConfig } from '@/services/authConfigService';

const serverConfig = (overrides: Partial<MobileAuthConfig> = {}): MobileAuthConfig => ({
  dealer_auth_enabled: true,
  registration_enabled: true,
  google_enabled: true,
  google_registration_enabled: true,
  ...overrides,
});

describe('resolveMobileAuthConfig', () => {
  it('passes every server switch through when the build supports Google', () => {
    expect(resolveMobileAuthConfig(serverConfig(), true)).toEqual({
      dealerAuthEnabled: true,
      registrationEnabled: true,
      googleEnabled: true,
      googleRegistrationEnabled: true,
    });
  });

  it('honours the server switching Google off', () => {
    const resolved = resolveMobileAuthConfig(
      serverConfig({ google_enabled: false, google_registration_enabled: false }),
      true,
    );

    expect(resolved.googleEnabled).toBe(false);
    expect(resolved.googleRegistrationEnabled).toBe(false);
    // Closing Google must not close the email form as a side effect.
    expect(resolved.registrationEnabled).toBe(true);
  });

  /**
   * A build shipped without client IDs cannot complete a Google flow whatever
   * the server allows, and a button that dead-ends is worse than no button.
   */
  it('keeps Google hidden when this build has no client ids, even if the server allows it', () => {
    const resolved = resolveMobileAuthConfig(serverConfig(), false);

    expect(resolved.googleEnabled).toBe(false);
    expect(resolved.googleRegistrationEnabled).toBe(false);
    expect(resolved.registrationEnabled).toBe(true);
  });

  it('can allow Google sign-in while refusing Google sign-up', () => {
    const resolved = resolveMobileAuthConfig(
      serverConfig({ google_registration_enabled: false }),
      true,
    );

    expect(resolved.googleEnabled).toBe(true);
    expect(resolved.googleRegistrationEnabled).toBe(false);
  });

  it('reports registration closed when the server says so', () => {
    expect(
      resolveMobileAuthConfig(serverConfig({ registration_enabled: false }), true)
        .registrationEnabled,
    ).toBe(false);
  });

  /**
   * The asymmetric fallback: a flaky request must not strand someone behind a
   * Google button that cannot work, but must also not remove the email form,
   * which always can.
   */
  it('falls back to Google off and email signup on when the config is unavailable', () => {
    expect(resolveMobileAuthConfig(null, true)).toEqual(MOBILE_AUTH_CONFIG_FALLBACK);
    expect(MOBILE_AUTH_CONFIG_FALLBACK.googleEnabled).toBe(false);
    expect(MOBILE_AUTH_CONFIG_FALLBACK.dealerAuthEnabled).toBe(false);
    expect(MOBILE_AUTH_CONFIG_FALLBACK.registrationEnabled).toBe(true);
  });
});
