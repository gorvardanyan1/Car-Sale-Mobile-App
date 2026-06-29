import type { Href } from 'expo-router';

type PaymentReturnRouter = {
  dismissTo: (href: Href) => void;
  replace: (href: Href) => void;
  canDismiss?: () => boolean;
};

const MY_ANNOUNCEMENTS_AFTER_PAYMENT: Href =
  '/settings/my-announcements?paymentDone=1';

/**
 * Pops payment / duplicate screens and lands on a single My Announcements instance.
 */
export function navigateToMyAnnouncementsAfterPayment(router: PaymentReturnRouter): void {
  try {
    if (router.canDismiss?.()) {
      router.dismissTo(MY_ANNOUNCEMENTS_AFTER_PAYMENT);
      return;
    }
  } catch {
    // Fall through to replace when dismiss is unavailable.
  }

  router.replace(MY_ANNOUNCEMENTS_AFTER_PAYMENT);
}

const WANTED_SEARCHES_AFTER_PAYMENT: Href =
  '/settings/wanted-searches?paymentDone=1';

export function navigateToWantedSearchesAfterPayment(router: PaymentReturnRouter): void {
  try {
    if (router.canDismiss?.()) {
      router.dismissTo(WANTED_SEARCHES_AFTER_PAYMENT);
      return;
    }
  } catch {
    // Fall through to replace when dismiss is unavailable.
  }

  router.replace(WANTED_SEARCHES_AFTER_PAYMENT);
}
