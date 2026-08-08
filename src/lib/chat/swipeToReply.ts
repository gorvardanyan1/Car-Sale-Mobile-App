/**
 * Geometry for the swipe-to-reply gesture on chat bubbles.
 *
 * These live outside the component for the same reason the image-lightbox zoom
 * helpers do: the gesture callbacks in ChatMessageBubble are auto-workletized
 * and run on the UI thread, where calling a plain JS function hard-crashes on
 * the New Architecture. So the worklets inline this math, and these exported
 * versions exist to pin the thresholds down in tests. Keep the two in sync.
 */

/** Drag distance, in px, at which releasing commits to a reply. */
export const REPLY_TRIGGER_DISTANCE = 44;

/** How far the bubble may travel before the drag starts resisting. */
export const MAX_DRAG_DISTANCE = 72;

/** Fraction of movement still applied past MAX_DRAG_DISTANCE. */
const OVERDRAG_RESISTANCE = 0.15;

/**
 * Maps a raw horizontal pan translation to the bubble's offset: left-swipes are
 * ignored (replies pull right only) and travel past the cap is damped so the
 * bubble eases into the limit instead of stopping dead against it.
 */
export function resolveSwipeOffset(translationX: number): number {
  const raw = Math.max(0, translationX);

  if (raw <= MAX_DRAG_DISTANCE) {
    return raw;
  }

  return MAX_DRAG_DISTANCE + (raw - MAX_DRAG_DISTANCE) * OVERDRAG_RESISTANCE;
}

/** Whether releasing at this offset should open the reply composer. */
export function shouldTriggerReply(offset: number): boolean {
  return offset >= REPLY_TRIGGER_DISTANCE;
}

/** 0→1 progress used to fade and scale the reply arrow behind the bubble. */
export function swipeProgress(offset: number): number {
  return Math.min(1, Math.max(0, offset) / REPLY_TRIGGER_DISTANCE);
}
