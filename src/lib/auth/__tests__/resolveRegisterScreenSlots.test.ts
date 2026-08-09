import { describe, expect, it } from 'vitest';

import {
  hasUnreachableErrorSlot,
  resolveRegisterScreenSlots,
} from '@/lib/auth/resolveRegisterScreenSlots';

const BOOLEANS = [true, false];

describe('resolveRegisterScreenSlots', () => {
  /**
   * The invariant this module exists for. A screen that offers a way to sign up
   * but has nowhere to render an error leaves the user tapping a button that
   * looks broken — which is precisely what happened when the email form first
   * became switchable off and took the only error slot with it.
   */
  it('never offers a sign-up action without somewhere to show an error', () => {
    for (const googleAvailable of BOOLEANS) {
      for (const emailFormAvailable of BOOLEANS) {
        const input = { googleAvailable, emailFormAvailable, hasError: true };

        expect(
          hasUnreachableErrorSlot(input),
          `unreachable error slot for ${JSON.stringify(input)}`,
        ).toBe(false);
      }
    }
  });

  it('shows a standalone error when Google is the only way in', () => {
    const slots = resolveRegisterScreenSlots({
      googleAvailable: true,
      emailFormAvailable: false,
      hasError: true,
    });

    expect(slots.showGoogleButton).toBe(true);
    expect(slots.showEmailForm).toBe(false);
    expect(slots.showStandaloneError).toBe(true);
  });

  it('leaves the error to the email form when that form is on screen', () => {
    const slots = resolveRegisterScreenSlots({
      googleAvailable: true,
      emailFormAvailable: true,
      hasError: true,
    });

    // Exactly one error slot — never both, or the message renders twice.
    expect(slots.showEmailForm).toBe(true);
    expect(slots.showStandaloneError).toBe(false);
  });

  it('drops the "or continue with email" rule when there is no email form', () => {
    expect(
      resolveRegisterScreenSlots({
        googleAvailable: true,
        emailFormAvailable: false,
        hasError: false,
      }).showDivider,
    ).toBe(false);

    expect(
      resolveRegisterScreenSlots({
        googleAvailable: true,
        emailFormAvailable: true,
        hasError: false,
      }).showDivider,
    ).toBe(true);
  });

  it('shows no divider when Google is unavailable, form or not', () => {
    for (const emailFormAvailable of BOOLEANS) {
      expect(
        resolveRegisterScreenSlots({
          googleAvailable: false,
          emailFormAvailable,
          hasError: false,
        }).showDivider,
      ).toBe(false);
    }
  });

  it('announces a closed screen only when neither route can create an account', () => {
    expect(
      resolveRegisterScreenSlots({
        googleAvailable: false,
        emailFormAvailable: false,
        hasError: false,
      }).showClosedNotice,
    ).toBe(true);

    for (const [googleAvailable, emailFormAvailable] of [
      [true, false],
      [false, true],
      [true, true],
    ] as const) {
      expect(
        resolveRegisterScreenSlots({ googleAvailable, emailFormAvailable, hasError: false })
          .showClosedNotice,
        `closed notice wrongly shown for google=${googleAvailable} email=${emailFormAvailable}`,
      ).toBe(false);
    }
  });

  it('hides the standalone error when there is nothing to report', () => {
    expect(
      resolveRegisterScreenSlots({
        googleAvailable: true,
        emailFormAvailable: false,
        hasError: false,
      }).showStandaloneError,
    ).toBe(false);
  });
});
