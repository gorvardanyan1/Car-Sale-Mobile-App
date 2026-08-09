export type RegisterScreenInput = {
  /** Google sign-up is live and this account type supports it. */
  googleAvailable: boolean;
  /** Email/password signup is open (Settings → Authentication). */
  emailFormAvailable: boolean;
  /** A submit attempt has produced an error to show. */
  hasError: boolean;
};

export type RegisterScreenSlots = {
  showGoogleButton: boolean;
  /** The "or continue with email" rule — pointless without a form to continue to. */
  showDivider: boolean;
  showEmailForm: boolean;
  /**
   * A standalone error line, for when the email form (which carries its own
   * error slot above its submit button) is not on screen.
   */
  showStandaloneError: boolean;
  /** "Registration is closed" — nothing on this screen can create an account. */
  showClosedNotice: boolean;
};

/**
 * Which parts of the registration screen to render.
 *
 * Extracted from the screen so the one rule that actually matters can be
 * asserted: **every screen that offers a way to sign up must have somewhere to
 * put an error**. Getting that wrong is invisible in review and invisible at
 * runtime — the button simply appears dead — and it is exactly what happened
 * when the email form first became switchable off.
 */
export function resolveRegisterScreenSlots({
  googleAvailable,
  emailFormAvailable,
  hasError,
}: RegisterScreenInput): RegisterScreenSlots {
  return {
    showGoogleButton: googleAvailable,
    showDivider: googleAvailable && emailFormAvailable,
    showEmailForm: emailFormAvailable,
    showStandaloneError: !emailFormAvailable && hasError,
    showClosedNotice: !emailFormAvailable && !googleAvailable,
  };
}

/**
 * Whether this screen state can produce an error the user would never see.
 *
 * Exists purely to be asserted against in tests — a screen offering a sign-up
 * action with no error slot is a bug, whatever the combination that produced it.
 */
export function hasUnreachableErrorSlot(input: RegisterScreenInput): boolean {
  const slots = resolveRegisterScreenSlots({ ...input, hasError: true });
  const canAttemptSignUp = slots.showGoogleButton || slots.showEmailForm;
  const errorIsVisible = slots.showEmailForm || slots.showStandaloneError;

  return canAttemptSignUp && !errorIsVisible;
}
