import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTranslation } from 'react-i18next';

import {
  DOUBLE_TAP_SCALE,
  MAX_IMAGE_SCALE,
  MIN_IMAGE_SCALE,
  clampImageScale,
  getNextImageIndex,
  getPreviousImageIndex,
} from '@/lib/announcements/imageLightboxZoom';
import { colors, radii, spacing, typography } from '@/theme';

const ZOOM_STEP = 0.75;

type ImageLightboxProps = {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  altText?: string;
};

/**
 * Rendered by the caller only while open (no `visible` prop, no RN
 * `<Modal>`): mounting always starts fresh at the right image and at
 * MIN_IMAGE_SCALE, so there's no "sync on open" step needed at all. Gestures
 * work because this overlay lives inside the app's single root-level
 * GestureHandlerRootView (see app/_layout.tsx). A previous version used
 * `<Modal>` with its own nested GestureHandlerRootView — that combination is
 * a known crash source (Modal renders into a separate native surface that
 * gesture worklets can't safely attach to) and crashed the app on
 * double-tap. Plain full-screen positioning avoids that entirely.
 *
 * The gesture `.onUpdate`/`.onEnd` callbacks are auto-workletized and run on
 * the UI thread. On Reanimated 4 / New Architecture, calling a plain
 * non-worklet JS function from a worklet HARD-CRASHES the native app (it's
 * not a catchable JS error like it was on the old architecture), which is
 * why pinch/double-tap crashed while the JS-thread zoom buttons worked. So
 * the clamp/scale math is inlined inside the worklets here rather than
 * calling the shared imageLightboxZoom helpers, and JS is hopped back to via
 * `scheduleOnRN` (worklets' current replacement for the deprecated runOnJS).
 *
 * All shared-value (scale/translate) mutations below happen only from plain
 * event-handler functions (Pressable onPress, BackHandler) or gesture
 * worklets (.onUpdate/.onEnd) — never by directly *reading* a shared value's
 * `.value` inside a hook's own body/selector (useEffect, useAnimatedReaction,
 * useImperativeHandle). This project's React Compiler lint rule
 * (react-hooks/immutability) treats a shared value as hook-owned the moment
 * any hook's body reads or writes `.value` directly, and then rejects every
 * other direct mutation of that value elsewhere as a violation — so resist
 * the urge to "simplify" by reading `scale.value` inside a
 * `useAnimatedReaction` selector or a `useImperativeHandle` factory. Wrapping
 * the *gesture builder* itself in `useMemo` below is fine — the rule doesn't
 * trace into the worklet closures passed to `.onUpdate`/`.onEnd`.
 */
export function ImageLightbox({ images, initialIndex, onClose, altText }: ImageLightboxProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [index, setIndex] = useState(initialIndex);
  const [displayScale, setDisplayScale] = useState(MIN_IMAGE_SCALE);

  const scale = useSharedValue(MIN_IMAGE_SCALE);
  const savedScale = useSharedValue(MIN_IMAGE_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose]);

  function resetZoomState() {
    scale.value = withTiming(MIN_IMAGE_SCALE);
    savedScale.value = MIN_IMAGE_SCALE;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    setDisplayScale(MIN_IMAGE_SCALE);
  }

  function setScaleTo(target: number) {
    scale.value = withTiming(target);
    savedScale.value = target;
    if (target === MIN_IMAGE_SCALE) {
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
    setDisplayScale(target);
  }

  function handleZoomIn() {
    setScaleTo(clampImageScale(savedScale.value + ZOOM_STEP));
  }

  function handleZoomOut() {
    setScaleTo(clampImageScale(savedScale.value - ZOOM_STEP));
  }

  const total = images.length;
  const currentImage = images[index];

  function handleNext() {
    setIndex((prev) => getNextImageIndex(prev, total));
    resetZoomState();
  }

  function handlePrev() {
    setIndex((prev) => getPreviousImageIndex(prev, total));
    resetZoomState();
  }

  // The composed gesture is built once (re-built only if the screen
  // dimensions change) instead of on every render. react-native-gesture-
  // handler tears down and re-registers the native gesture recognizers
  // whenever the `gesture` object passed to GestureDetector changes
  // identity; recreating it on every state update (e.g. every time
  // setDisplayScale fires from inside a gesture callback) tore down the
  // in-flight recognizer mid-interaction and crashed the app on a repeated
  // double-tap. Every value captured below (shared values, setDisplayScale,
  // handleNext/handlePrev) is stable or closure-safe — see the note above
  // this component — so memoizing here doesn't introduce staleness.
  const composedGesture = useMemo(() => {
    const pinch = Gesture.Pinch()
      .onUpdate((event) => {
        // Math is inlined (not calling the shared imageLightboxZoom helpers)
        // on purpose: these callbacks are auto-workletized and run on the UI
        // thread, and calling a plain non-worklet JS function from a worklet
        // hard-crashes the app on the New Architecture. The helpers stay for
        // the JS-thread button handlers and the unit tests.
        const raw = savedScale.value * event.scale;
        scale.value = Math.min(MAX_IMAGE_SCALE, Math.max(MIN_IMAGE_SCALE, raw));
      })
      .onEnd(() => {
        savedScale.value = scale.value;
        if (scale.value <= MIN_IMAGE_SCALE) {
          translateX.value = withTiming(0);
          translateY.value = withTiming(0);
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
        }
        // Sync the React-state mirror once, at gesture end — never per frame
        // (a per-onUpdate JS hop would re-render React ~60x/sec).
        scheduleOnRN(setDisplayScale, scale.value);
      });

    // Only pans the image while zoomed in; navigation is handled by the
    // dedicated prev/next buttons rather than a swipe gesture here, to keep
    // the composed gesture (and its crash surface) as small as possible.
    const pan = Gesture.Pan()
      .onUpdate((event) => {
        if (scale.value <= MIN_IMAGE_SCALE) {
          return;
        }
        const maxX = (width * (scale.value - 1)) / 2;
        const maxY = (height * (scale.value - 1)) / 2;
        const nextX = savedTranslateX.value + event.translationX;
        const nextY = savedTranslateY.value + event.translationY;
        translateX.value = Math.min(maxX, Math.max(-maxX, nextX));
        translateY.value = Math.min(maxY, Math.max(-maxY, nextY));
      })
      .onEnd(() => {
        if (scale.value > MIN_IMAGE_SCALE) {
          savedTranslateX.value = translateX.value;
          savedTranslateY.value = translateY.value;
        }
      });

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        const target = savedScale.value > MIN_IMAGE_SCALE ? MIN_IMAGE_SCALE : DOUBLE_TAP_SCALE;
        scale.value = withTiming(target);
        savedScale.value = target;
        if (target === MIN_IMAGE_SCALE) {
          translateX.value = withTiming(0);
          translateY.value = withTiming(0);
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
        }
        scheduleOnRN(setDisplayScale, target);
      });

    return Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!currentImage) {
    return null;
  }

  return (
    <View style={styles.backdrop} testID="image-lightbox">
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) + spacing.sm }]}>
        <Text style={styles.counter} testID="lightbox-counter">
          {total > 0 ? `${index + 1} / ${total}` : ''}
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('actions.zoom_out')}
            onPress={handleZoomOut}
            style={[styles.iconButton, displayScale <= MIN_IMAGE_SCALE && styles.iconButtonDisabled]}
            testID="lightbox-zoom-out"
          >
            <ZoomOut color={colors.white} size={20} />
          </Pressable>
          <Text style={styles.zoomLevel} testID="lightbox-zoom-level">
            {Math.round(displayScale * 100)}%
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('actions.zoom_in')}
            onPress={handleZoomIn}
            style={[styles.iconButton, displayScale >= MAX_IMAGE_SCALE && styles.iconButtonDisabled]}
            testID="lightbox-zoom-in"
          >
            <ZoomIn color={colors.white} size={20} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('actions.close')}
            onPress={onClose}
            style={[styles.iconButton, styles.closeButton]}
            testID="lightbox-close"
          >
            <X color={colors.white} size={20} />
          </Pressable>
        </View>
      </View>

      <View style={styles.imageArea}>
        {total > 1 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('actions.previous')}
            onPress={handlePrev}
            style={[styles.navButton, styles.navButtonLeft]}
            testID="lightbox-prev"
          >
            <ChevronLeft color={colors.white} size={28} />
          </Pressable>
        ) : null}

        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.imageWrapper, imageAnimatedStyle]}>
            <Image
              source={{ uri: currentImage }}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel={altText ? `${altText} ${index + 1}` : t('gallery.image')}
              testID="lightbox-image"
            />
          </Animated.View>
        </GestureDetector>

        {total > 1 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('actions.next')}
            onPress={handleNext}
            style={[styles.navButton, styles.navButtonRight]}
            testID="lightbox-next"
          >
            <ChevronRight color={colors.white} size={28} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    zIndex: 20,
    elevation: 20,
  },
  counter: {
    ...typography.body,
    color: colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  zoomLevel: {
    ...typography.caption,
    color: colors.white,
    minWidth: 40,
    textAlign: 'center',
  },
  closeButton: {
    marginLeft: spacing.xs,
  },
  imageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  navButtonLeft: {
    left: spacing.md,
  },
  navButtonRight: {
    right: spacing.md,
  },
});
