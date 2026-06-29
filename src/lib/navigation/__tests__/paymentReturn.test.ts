import { describe, expect, it, vi } from 'vitest';

import {
  navigateToMyAnnouncementsAfterPayment,
  navigateToWantedSearchesAfterPayment,
} from '@/lib/navigation/paymentReturn';

describe('navigateToMyAnnouncementsAfterPayment', () => {
  it('uses dismissTo when the stack can dismiss', () => {
    const dismissTo = vi.fn();
    const replace = vi.fn();

    navigateToMyAnnouncementsAfterPayment({
      dismissTo,
      replace,
      canDismiss: () => true,
    });

    expect(dismissTo).toHaveBeenCalledWith('/settings/my-announcements?paymentDone=1');
    expect(replace).not.toHaveBeenCalled();
  });

  it('falls back to replace when dismiss is unavailable', () => {
    const dismissTo = vi.fn();
    const replace = vi.fn();

    navigateToMyAnnouncementsAfterPayment({
      dismissTo,
      replace,
      canDismiss: () => false,
    });

    expect(replace).toHaveBeenCalledWith('/settings/my-announcements?paymentDone=1');
    expect(dismissTo).not.toHaveBeenCalled();
  });

  it('navigates to wanted searches after payment', () => {
    const dismissTo = vi.fn();
    const replace = vi.fn();

    navigateToWantedSearchesAfterPayment({
      dismissTo,
      replace,
      canDismiss: () => true,
    });

    expect(dismissTo).toHaveBeenCalledWith('/settings/wanted-searches?paymentDone=1');
  });
});
