import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Reply } from 'lucide-react-native';

import { colors, radii, spacing, typography } from '@/theme';
import { formatChatTime } from '@/lib/chat/conversationDisplay';
import { MAX_DRAG_DISTANCE, REPLY_TRIGGER_DISTANCE } from '@/lib/chat/swipeToReply';
import type { ChatMessageShape } from '@/types/chat';
import { ChatMessageTranslate } from './ChatMessageTranslate';
import { ChatQuotedMessage } from './ChatQuotedMessage';

type Props = {
  message: ChatMessageShape;
  isMine: boolean;
  /** Signed-in user id, so a quote can be attributed to "You". */
  currentUserId?: number | null;
  /** Swipe right (or long-press) to reply. Omit to render a non-interactive bubble. */
  onReply?: (message: ChatMessageShape) => void;
  onJumpToMessage?: (messageId: string) => void;
};

export function ChatMessageBubble({
  message,
  isMine,
  currentUserId,
  onReply,
  onJumpToMessage,
}: Props) {
  const time = formatChatTime(message.createdAt);
  const quotedIsMine =
    message.replyTo != null && Number(message.replyTo.senderId) === Number(currentUserId);

  const translateX = useSharedValue(0);

  const triggerReply = useCallback(() => {
    onReply?.(message);
  }, [onReply, message]);

  const [isTranslateVisible, setIsTranslateVisible] = useState(false);
  const [hasRevealedTranslate, setHasRevealedTranslate] = useState(false);

  const revealTranslate = useCallback(() => {
    setHasRevealedTranslate(true);
    setIsTranslateVisible((visible) => !visible);
  }, []);

  // Built once per mounted bubble. Rebuilding the gesture object makes
  // gesture-handler tear down and re-register the native recognizer, which
  // crashes if it happens mid-interaction — this codebase has already been
  // bitten by exactly that (see ImageLightbox). Capturing the first
  // `triggerReply` is safe here because the list keys items by `message._id`,
  // so an instance is bound to one message for its whole lifetime, and the
  // parent's `onReply` is a `useCallback([])`. The shared value is likewise
  // stable, and is kept out of the dep array so the React Compiler doesn't
  // treat it as hook-owned and reject the worklet's writes below.
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        // Only take over once the drag is clearly horizontal, so the message
        // list keeps its vertical scroll.
        .activeOffsetX([-12, 12])
        .failOffsetY([-12, 12])
        .onUpdate((event) => {
          // Right-swipe only, with the tail of the drag damped so the bubble
          // eases into the cap instead of stopping dead.
          const raw = Math.max(0, event.translationX);
          translateX.value =
            raw > MAX_DRAG_DISTANCE
              ? MAX_DRAG_DISTANCE + (raw - MAX_DRAG_DISTANCE) * 0.15
              : raw;
        })
        .onEnd(() => {
          if (translateX.value >= REPLY_TRIGGER_DISTANCE) {
            // Calling plain JS straight from a worklet hard-crashes on the New
            // Architecture; hop threads instead.
            scheduleOnRN(triggerReply);
          }
          translateX.value = withSpring(0, { damping: 20, stiffness: 220 });
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const bubbleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // The arrow sits behind the bubble and fades in as the drag approaches the
  // commit distance, so the gesture explains itself the first time.
  const replyHintStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, translateX.value / REPLY_TRIGGER_DISTANCE),
    transform: [{ scale: 0.7 + 0.3 * Math.min(1, translateX.value / REPLY_TRIGGER_DISTANCE) }],
  }));

  const bubble = (
    <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
      {message.replyTo ? (
        <ChatQuotedMessage
          replyTo={message.replyTo}
          quotedIsMine={quotedIsMine}
          isMine={isMine}
          onJump={onJumpToMessage}
        />
      ) : null}
      <Text style={[styles.text, isMine ? styles.textMine : styles.textTheirs]}>
        {message.text}
      </Text>
      <Text style={[styles.time, isMine ? styles.timeMine : styles.timeTheirs]}>{time}</Text>
    </View>
  );

  return (
    <View style={[styles.row, isMine ? styles.rowRight : styles.rowLeft]}>
      {/* The 78% cap lives here, on the one element that is a direct child of
          the full-width row. Percentages resolve against the parent's own
          width, so leaving it on the bubble measured it against the auto-width
          gesture wrappers instead and let bubbles run the full row. */}
      <View style={styles.bubbleWrap}>
        {onReply ? (
          <>
            <Animated.View style={[styles.replyHint, replyHintStyle]} pointerEvents="none">
              <Reply size={16} color={colors.textSubtle} />
            </Animated.View>

            <GestureDetector gesture={panGesture}>
              <Animated.View style={bubbleAnimatedStyle}>
                {/* Swipe replies; holding a message reveals its translate row,
                    which is otherwise hidden to keep the thread uncluttered. */}
                <Pressable
                  onLongPress={revealTranslate}
                  delayLongPress={250}
                  testID={`chat-message-${message._id}`}
                >
                  {bubble}
                </Pressable>
              </Animated.View>
            </GestureDetector>
          </>
        ) : (
          bubble
        )}
      </View>

      {/* Kept mounted once revealed, so hiding it again doesn't discard
          already-fetched translations and charge another AI call to get them
          back. `display: none` takes it out of layout entirely. */}
      {hasRevealedTranslate ? (
        <View style={isTranslateVisible ? styles.translateSlot : styles.hidden}>
          <ChatMessageTranslate text={message.text} align={isMine ? 'right' : 'left'} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs / 2,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowLeft: {
    alignItems: 'flex-start',
  },
  bubbleWrap: {
    maxWidth: '78%',
    justifyContent: 'center',
  },
  translateSlot: {
    maxWidth: '78%',
  },
  hidden: {
    display: 'none',
  },
  replyHint: {
    position: 'absolute',
    left: -28,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.button,
    gap: 2,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  text: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  textMine: {
    color: colors.white,
  },
  textTheirs: {
    color: colors.text,
  },
  time: {
    ...typography.caption,
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  timeMine: {
    color: 'rgba(255,255,255,0.65)',
  },
  timeTheirs: {
    color: colors.textSubtle,
  },
});
