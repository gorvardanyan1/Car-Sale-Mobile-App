import { describe, expect, it } from 'vitest';

import {
  MAX_DRAG_DISTANCE,
  REPLY_TRIGGER_DISTANCE,
  resolveSwipeOffset,
  shouldTriggerReply,
  swipeProgress,
} from '../swipeToReply';

describe('resolveSwipeOffset', () => {
  it('ignores left swipes so the gesture only ever pulls right', () => {
    expect(resolveSwipeOffset(-80)).toBe(0);
    expect(resolveSwipeOffset(-1)).toBe(0);
  });

  it('tracks the finger one-to-one up to the cap', () => {
    expect(resolveSwipeOffset(0)).toBe(0);
    expect(resolveSwipeOffset(30)).toBe(30);
    expect(resolveSwipeOffset(MAX_DRAG_DISTANCE)).toBe(MAX_DRAG_DISTANCE);
  });

  it('damps travel past the cap instead of stopping dead', () => {
    const overdragged = resolveSwipeOffset(MAX_DRAG_DISTANCE + 100);

    expect(overdragged).toBeGreaterThan(MAX_DRAG_DISTANCE);
    expect(overdragged).toBeLessThan(MAX_DRAG_DISTANCE + 100);
  });

  it('stays monotonic across the cap so the bubble never jumps backwards', () => {
    const before = resolveSwipeOffset(MAX_DRAG_DISTANCE - 1);
    const at = resolveSwipeOffset(MAX_DRAG_DISTANCE);
    const after = resolveSwipeOffset(MAX_DRAG_DISTANCE + 1);

    expect(before).toBeLessThan(at);
    expect(at).toBeLessThan(after);
  });
});

describe('shouldTriggerReply', () => {
  it('commits once the drag reaches the trigger distance', () => {
    expect(shouldTriggerReply(REPLY_TRIGGER_DISTANCE)).toBe(true);
    expect(shouldTriggerReply(REPLY_TRIGGER_DISTANCE + 20)).toBe(true);
  });

  it('does not commit on a short drag, so scrolling never fires a reply', () => {
    expect(shouldTriggerReply(0)).toBe(false);
    expect(shouldTriggerReply(REPLY_TRIGGER_DISTANCE - 1)).toBe(false);
  });

  it('commits before the bubble hits its travel cap', () => {
    expect(REPLY_TRIGGER_DISTANCE).toBeLessThan(MAX_DRAG_DISTANCE);
  });
});

describe('swipeProgress', () => {
  it('ramps from 0 to 1 over the trigger distance', () => {
    expect(swipeProgress(0)).toBe(0);
    expect(swipeProgress(REPLY_TRIGGER_DISTANCE / 2)).toBeCloseTo(0.5);
    expect(swipeProgress(REPLY_TRIGGER_DISTANCE)).toBe(1);
  });

  it('clamps at both ends so the arrow never over- or under-shoots', () => {
    expect(swipeProgress(-40)).toBe(0);
    expect(swipeProgress(MAX_DRAG_DISTANCE * 2)).toBe(1);
  });
});
