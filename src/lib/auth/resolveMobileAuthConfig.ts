import type { MobileAuthConfig } from '@/services/authConfigService';

export type ResolvedMobileAuthConfig = {
  dealerAuthEnabled: boolean;
  registrationEnabled: boolean;
  googleEnabled: boolean;
  googleRegistrationEnabled: boolean;
};

/**
 * What the auth screens should offer, given what the server allows and what
 * this particular build can actually do.
 *
 * On a failed fetch every switch falls back to *off* except email/password
 * registration, which stays on. Deliberately asymmetric: showing a Google
 * button this build cannot complete, or a dealer flow the server will refuse,
 * strands the user at a dead end, whereas hiding the email signup form because
 * of one flaky request would take away the way in that always works.
 */
export const MOBILE_AUTH_CONFIG_FALLBACK: ResolvedMobileAuthConfig = {
  dealerAuthEnabled: false,
  registrationEnabled: true,
  googleEnabled: false,
  googleRegistrationEnabled: false,
};

/**
 * @param googleClientConfigured whether this build shipped Google client IDs.
 *        Both sides have to agree: the server may have Google switched on while
 *        the installed app has no client ID, and a button that cannot start a
 *        flow is worse than no button.
 */
export function resolveMobileAuthConfig(
  config: MobileAuthConfig | null,
  googleClientConfigured: boolean,
): ResolvedMobileAuthConfig {
  if (config === null) {
    return MOBILE_AUTH_CONFIG_FALLBACK;
  }

  return {
    dealerAuthEnabled: Boolean(config.dealer_auth_enabled),
    registrationEnabled: Boolean(config.registration_enabled),
    googleEnabled: Boolean(config.google_enabled) && googleClientConfigured,
    googleRegistrationEnabled:
      Boolean(config.google_registration_enabled) && googleClientConfigured,
  };
}
