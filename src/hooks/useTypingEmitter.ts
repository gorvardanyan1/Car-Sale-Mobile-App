import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useChatSocket } from '@/contexts/ChatSocketContext';
import { createTypingEmitter, type TypingEmitter } from '@/lib/chat/typingEmitter';

type UseTypingEmitterReturn = {
  /** Feed the composer's text on every change. */
  handleTextChange: (text: string) => void;
  /** Announce "stopped" now — on send, on blur, on leaving the thread. */
  stopTyping: () => void;
};

/**
 * Wires the pure typing emitter to the socket for one conversation.
 *
 * All the timing logic lives in lib/chat/typingEmitter (and is unit-tested
 * there); this only owns the React lifecycle — rebuilding the emitter when the
 * conversation changes, and making sure the other side is never left staring
 * at an indicator we stopped maintaining.
 */
export function useTypingEmitter(conversationId: string | null): UseTypingEmitterReturn {
  const { emitTyping, chatSettings } = useChatSocket();
  const enabled = chatSettings.typingIndicatorEnabled;

  const emitterRef = useRef<TypingEmitter | null>(null);

  useEffect(() => {
    if (!conversationId || !enabled) {
      emitterRef.current = null;
      return undefined;
    }

    const emitter = createTypingEmitter({
      emit: (isTyping) => emitTyping(conversationId, isTyping),
    });
    emitterRef.current = emitter;

    return () => {
      // Leaving the thread (or the conversation changing under us) must not
      // strand the indicator on the other side.
      emitter.stop();
      emitter.dispose();
      emitterRef.current = null;
    };
  }, [conversationId, enabled, emitTyping]);

  // Backgrounding the app keeps the socket alive for a while, so without this
  // the partner would keep seeing "typing…" from someone who has switched away.
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state !== 'active') {
        emitterRef.current?.stop();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, []);

  const handleTextChange = useCallback((text: string) => {
    emitterRef.current?.handleText(text);
  }, []);

  const stopTyping = useCallback(() => {
    emitterRef.current?.stop();
  }, []);

  return { handleTextChange, stopTyping };
}
