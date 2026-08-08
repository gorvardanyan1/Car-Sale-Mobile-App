import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTypingEmitter } from '@/lib/chat/typingEmitter';

describe('createTypingEmitter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(overrides: { refreshMs?: number; idleMs?: number } = {}) {
    const emit = vi.fn<(isTyping: boolean) => void>();
    const emitter = createTypingEmitter({
      emit,
      refreshMs: 2500,
      idleMs: 2000,
      now: () => Date.now(),
      ...overrides,
    });
    return { emit, emitter };
  }

  it('announces typing once for a burst of keystrokes', () => {
    const { emit, emitter } = setup();

    emitter.handleText('H');
    emitter.handleText('He');
    emitter.handleText('Hel');
    emitter.handleText('Hello');

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(true);
    expect(emitter.isTyping()).toBe(true);
  });

  it('re-announces once the refresh interval has elapsed, so the server state cannot expire', () => {
    const { emit, emitter } = setup();

    emitter.handleText('Hello');
    expect(emit).toHaveBeenCalledTimes(1);

    // Still inside the refresh window — nothing new goes out.
    vi.advanceTimersByTime(1000);
    emitter.handleText('Hello t');
    expect(emit).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1600); // 2600ms since the first announcement
    emitter.handleText('Hello there');

    expect(emit).toHaveBeenCalledTimes(2);
    expect(emit).toHaveBeenNthCalledWith(2, true);
    expect(emitter.isTyping()).toBe(true);
  });

  it('reports stopped after the idle timeout with no further input', () => {
    const { emit, emitter } = setup();

    emitter.handleText('Hello');
    emit.mockClear();

    vi.advanceTimersByTime(1999);
    expect(emit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(emit).toHaveBeenCalledExactlyOnceWith(false);
    expect(emitter.isTyping()).toBe(false);
  });

  it('keeps pushing the idle deadline out while the user keeps writing', () => {
    const { emit, emitter } = setup();

    emitter.handleText('Hello');
    emit.mockClear();

    for (let i = 0; i < 5; i += 1) {
      vi.advanceTimersByTime(1500);
      emitter.handleText(`Hello ${'x'.repeat(i + 1)}`);
    }

    // 7.5s of continuous writing: never reported as stopped.
    expect(emit).not.toHaveBeenCalledWith(false);

    vi.advanceTimersByTime(2000);
    expect(emit).toHaveBeenCalledWith(false);
  });

  it('reports stopped immediately when the composer is cleared', () => {
    const { emit, emitter } = setup();

    emitter.handleText('Hello');
    emit.mockClear();

    emitter.handleText('');

    expect(emit).toHaveBeenCalledExactlyOnceWith(false);
    expect(emitter.isTyping()).toBe(false);

    // The pending idle timer must not fire a second, duplicate stop.
    vi.advanceTimersByTime(5000);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('treats whitespace-only text as empty', () => {
    const { emit, emitter } = setup();

    emitter.handleText('   \n  ');

    expect(emit).not.toHaveBeenCalled();
    expect(emitter.isTyping()).toBe(false);
  });

  it('never emits a stop it did not start', () => {
    const { emit, emitter } = setup();

    emitter.stop();
    emitter.handleText('');
    emitter.stop();

    expect(emit).not.toHaveBeenCalled();
  });

  it('emits exactly one stop no matter how often stop is called', () => {
    const { emit, emitter } = setup();

    emitter.handleText('Hello');
    emit.mockClear();

    emitter.stop();
    emitter.stop();
    emitter.stop();

    expect(emit).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('announces again after a stop, because the server has forgotten the state', () => {
    const { emit, emitter } = setup();

    emitter.handleText('Hello');
    emitter.stop();
    emit.mockClear();

    // No time has passed, but the previous burst was explicitly ended — this
    // must not be swallowed by the refresh window.
    emitter.handleText('Hello again');

    expect(emit).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('dispose drops pending timers without announcing anything', () => {
    const { emit, emitter } = setup();

    emitter.handleText('Hello');
    emit.mockClear();

    emitter.dispose();
    vi.advanceTimersByTime(10_000);

    expect(emit).not.toHaveBeenCalled();
    expect(emitter.isTyping()).toBe(false);
  });

  it('honours custom refresh and idle windows', () => {
    const { emit, emitter } = setup({ refreshMs: 100, idleMs: 50 });

    emitter.handleText('a');
    expect(emit).toHaveBeenCalledExactlyOnceWith(true);

    vi.advanceTimersByTime(50);
    expect(emit).toHaveBeenLastCalledWith(false);

    emit.mockClear();
    emitter.handleText('ab');
    expect(emit).toHaveBeenCalledExactlyOnceWith(true);
  });
});
