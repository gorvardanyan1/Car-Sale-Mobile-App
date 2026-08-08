/**
 * Decides *when* to tell the server "I am typing", independently of React and
 * of the socket.
 *
 * Two competing pressures: the chat service expires a typing state after
 * TYPING_TIMEOUT_MS (6s by default) so a dropped stop can never strand the
 * indicator, which means a still-writing user has to re-announce periodically;
 * but emitting on every keystroke would flood the socket and burn through the
 * per-socket typing allowance. So only transitions and periodic refreshes go
 * out, and going quiet is reported by a timer rather than by another keystroke.
 */

/** Re-announce cadence. Must stay well under the server's typing timeout. */
export const TYPING_REFRESH_MS = 2500;
/** Report "stopped" this long after the last keystroke. */
export const TYPING_IDLE_MS = 2000;

export type TypingEmitterOptions = {
  /** Called only on a genuine transition or refresh — never per keystroke. */
  emit: (isTyping: boolean) => void;
  refreshMs?: number;
  idleMs?: number;
  now?: () => number;
};

export type TypingEmitter = {
  /** Feed the composer's current text on every change. */
  handleText: (text: string) => void;
  /** Announce "stopped" now (send, blur, leaving the screen). */
  stop: () => void;
  /** Drop pending timers without announcing anything. */
  dispose: () => void;
  /** Whether we currently believe the server sees us as typing. */
  isTyping: () => boolean;
};

export function createTypingEmitter(options: TypingEmitterOptions): TypingEmitter {
  const {
    emit,
    refreshMs = TYPING_REFRESH_MS,
    idleMs = TYPING_IDLE_MS,
    now = Date.now,
  } = options;

  let typing = false;
  let lastAnnouncedAt = 0;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const clearIdleTimer = () => {
    if (idleTimer !== null) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  };

  const stop = () => {
    clearIdleTimer();
    if (!typing) return;
    typing = false;
    lastAnnouncedAt = 0;
    emit(false);
  };

  return {
    handleText(text: string) {
      // An emptied composer is the same signal as going idle, and the user
      // clearly is not mid-sentence — say so at once rather than making the
      // other side wait out the idle timer.
      if (text.trim() === '') {
        stop();
        return;
      }

      const at = now();
      if (!typing || at - lastAnnouncedAt >= refreshMs) {
        typing = true;
        lastAnnouncedAt = at;
        emit(true);
      }

      clearIdleTimer();
      idleTimer = setTimeout(() => {
        idleTimer = null;
        if (!typing) return;
        typing = false;
        lastAnnouncedAt = 0;
        emit(false);
      }, idleMs);
    },

    stop,

    dispose() {
      clearIdleTimer();
      typing = false;
      lastAnnouncedAt = 0;
    },

    isTyping() {
      return typing;
    },
  };
}
