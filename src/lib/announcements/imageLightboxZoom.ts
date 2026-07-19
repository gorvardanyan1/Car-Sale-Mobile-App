export const MIN_IMAGE_SCALE = 1;
export const MAX_IMAGE_SCALE = 4;
export const DOUBLE_TAP_SCALE = 2.5;

export function clampImageScale(
  scale: number,
  min: number = MIN_IMAGE_SCALE,
  max: number = MAX_IMAGE_SCALE,
): number {
  return Math.min(max, Math.max(min, scale));
}

export function getNextImageIndex(currentIndex: number, total: number): number {
  if (total <= 0) return 0;
  return (currentIndex + 1) % total;
}

export function getPreviousImageIndex(currentIndex: number, total: number): number {
  if (total <= 0) return 0;
  return (currentIndex - 1 + total) % total;
}

export function getDoubleTapTargetScale(
  currentScale: number,
  min: number = MIN_IMAGE_SCALE,
  doubleTapScale: number = DOUBLE_TAP_SCALE,
): number {
  return currentScale > min ? min : doubleTapScale;
}

/**
 * Bounds a pan translation so a zoomed image can't be dragged past its edges.
 * boundsSize is the container's width or height in points.
 */
export function clampPanTranslation(
  translation: number,
  scale: number,
  boundsSize: number,
): number {
  if (scale <= MIN_IMAGE_SCALE || boundsSize <= 0) {
    return 0;
  }
  const maxOffset = (boundsSize * (scale - 1)) / 2;
  return Math.min(maxOffset, Math.max(-maxOffset, translation));
}
