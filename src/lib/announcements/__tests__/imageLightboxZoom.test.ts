import { describe, expect, it } from 'vitest';

import {
  DOUBLE_TAP_SCALE,
  MAX_IMAGE_SCALE,
  MIN_IMAGE_SCALE,
  clampImageScale,
  clampPanTranslation,
  getDoubleTapTargetScale,
  getNextImageIndex,
  getPreviousImageIndex,
} from '@/lib/announcements/imageLightboxZoom';

describe('clampImageScale', () => {
  it('clamps below the minimum up to MIN_IMAGE_SCALE', () => {
    expect(clampImageScale(0.2)).toBe(MIN_IMAGE_SCALE);
  });

  it('clamps above the maximum down to MAX_IMAGE_SCALE', () => {
    expect(clampImageScale(10)).toBe(MAX_IMAGE_SCALE);
  });

  it('passes through values already within bounds', () => {
    expect(clampImageScale(2.5)).toBe(2.5);
  });

  it('honors custom min/max bounds', () => {
    expect(clampImageScale(1.5, 2, 6)).toBe(2);
    expect(clampImageScale(8, 2, 6)).toBe(6);
  });
});

describe('getNextImageIndex / getPreviousImageIndex', () => {
  it('advances forward and wraps past the last image', () => {
    expect(getNextImageIndex(0, 3)).toBe(1);
    expect(getNextImageIndex(2, 3)).toBe(0);
  });

  it('advances backward and wraps before the first image', () => {
    expect(getPreviousImageIndex(1, 3)).toBe(0);
    expect(getPreviousImageIndex(0, 3)).toBe(2);
  });

  it('returns 0 for an empty gallery instead of dividing by zero', () => {
    expect(getNextImageIndex(0, 0)).toBe(0);
    expect(getPreviousImageIndex(0, 0)).toBe(0);
  });
});

describe('getDoubleTapTargetScale', () => {
  it('zooms in to DOUBLE_TAP_SCALE when currently at the minimum', () => {
    expect(getDoubleTapTargetScale(MIN_IMAGE_SCALE)).toBe(DOUBLE_TAP_SCALE);
  });

  it('resets to the minimum when already zoomed in', () => {
    expect(getDoubleTapTargetScale(3)).toBe(MIN_IMAGE_SCALE);
  });
});

describe('clampPanTranslation', () => {
  it('returns 0 when not zoomed in, regardless of the requested translation', () => {
    expect(clampPanTranslation(500, MIN_IMAGE_SCALE, 300)).toBe(0);
  });

  it('returns 0 when the bounds size is not positive', () => {
    expect(clampPanTranslation(50, 2, 0)).toBe(0);
  });

  it('clamps the translation to the scaled overhang on either side', () => {
    // boundsSize=300, scale=2 => maxOffset = 300 * (2-1) / 2 = 150
    expect(clampPanTranslation(500, 2, 300)).toBe(150);
    expect(clampPanTranslation(-500, 2, 300)).toBe(-150);
  });

  it('passes through translations already within the allowed range', () => {
    expect(clampPanTranslation(40, 2, 300)).toBe(40);
  });
});
