/**
 * Hands call-notification taps from PushNotificationsProvider (which sits
 * above the chat socket) to CallProvider (which owns it).
 *
 * A tap that cold-starts the app arrives before CallProvider has mounted, so
 * the latest event is held until someone subscribes. Only the newest one is
 * kept: an older ring is either the same call or already over.
 */
export type CallPushAction = 'open' | 'accept' | 'decline';

export type CallPushEvent = {
  callId: string;
  conversationId: string | null;
  callType: 'voice' | 'video';
  action: CallPushAction;
};

type Listener = (event: CallPushEvent) => void;

let pending: CallPushEvent | null = null;
const listeners = new Set<Listener>();

export function publishCallPushEvent(event: CallPushEvent): void {
  if (listeners.size === 0) {
    pending = event;
    return;
  }
  listeners.forEach((listener) => listener(event));
}

export function subscribeCallPushEvents(listener: Listener): () => void {
  listeners.add(listener);
  if (pending) {
    const event = pending;
    pending = null;
    listener(event);
  }
  return () => {
    listeners.delete(listener);
  };
}

/** Maps a notification response's action id to what the user asked for. */
export function callActionFromResponse(
  actionIdentifier: string | null,
  acceptId: string,
  declineId: string,
): CallPushAction {
  if (actionIdentifier === acceptId) return 'accept';
  if (actionIdentifier === declineId) return 'decline';
  return 'open';
}

/** Test-only reset of module state. */
export function __resetCallPushEvents(): void {
  pending = null;
  listeners.clear();
}
