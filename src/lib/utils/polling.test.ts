// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { visibilityAwareInterval } from './polling';
// dry-copy: sveltekit/visibility-aware-interval-test — every copy of this region must match; `dev repo copies` checks it (ISS-3894)

const INTERVAL = 1000;

let hidden = false;
let online = true;

/**
 * Every poller started by a test is stopped after it, because jsdom's `document` and `window`
 * outlive the test: a poller left running keeps its listeners attached and fires again on the
 * next test's visibility/network events.
 */
const running: Array<() => void> = [];

function poller(callback: () => void | Promise<void>, options?: Parameters<typeof visibilityAwareInterval>[2]): () => void {
  const stop = visibilityAwareInterval(callback, INTERVAL, options);
  running.push(stop);
  return stop;
}

function setHidden(next: boolean): void {
  hidden = next;
  document.dispatchEvent(new Event('visibilitychange'));
}

function setOnline(next: boolean): void {
  online = next;
  window.dispatchEvent(new Event(next ? 'online' : 'offline'));
}

beforeEach(() => {
  vi.useFakeTimers();
  hidden = false;
  online = true;
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
  vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
});

afterEach(() => {
  while (running.length) running.pop()?.();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('visibilityAwareInterval', () => {
  it('fires immediately and then on every interval', () => {
    const tick = vi.fn();
    poller(tick);
    expect(tick).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(INTERVAL * 3);
    expect(tick).toHaveBeenCalledTimes(4);
  });

  it('skips the first tick when immediate is false, but keeps the interval', () => {
    const tick = vi.fn();
    poller(tick, { immediate: false });
    expect(tick).not.toHaveBeenCalled();
    vi.advanceTimersByTime(INTERVAL);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it('stops the timer while the tab is hidden and re-fires on return', () => {
    const tick = vi.fn();
    poller(tick);
    tick.mockClear();

    setHidden(true);
    vi.advanceTimersByTime(INTERVAL * 5);
    expect(tick).not.toHaveBeenCalled();

    setHidden(false);
    expect(tick).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(INTERVAL);
    expect(tick).toHaveBeenCalledTimes(2);
  });

  /**
   * The behaviour the two pollers disagreed about (ISS-3820): a page on the losing helper kept
   * hitting an unreachable endpoint every interval for as long as the laptop was off the network.
   */
  it('stops the timer while the browser is offline and re-fires when it comes back', () => {
    const tick = vi.fn();
    poller(tick);
    tick.mockClear();

    setOnline(false);
    vi.advanceTimersByTime(INTERVAL * 5);
    expect(tick).not.toHaveBeenCalled();

    setOnline(true);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it('resumes on return only once both conditions are met', () => {
    const tick = vi.fn();
    poller(tick);
    tick.mockClear();

    setHidden(true);
    setOnline(false);

    // Coming back online while still hidden must not restart the timer.
    setOnline(true);
    vi.advanceTimersByTime(INTERVAL * 2);
    expect(tick).not.toHaveBeenCalled();

    setHidden(false);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it('does not start while hidden at mount, and starts on the first return', () => {
    hidden = true;
    const tick = vi.fn();
    poller(tick);
    vi.advanceTimersByTime(INTERVAL * 3);
    expect(tick).not.toHaveBeenCalled();

    setHidden(false);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it('does not start while offline at mount', () => {
    online = false;
    const tick = vi.fn();
    poller(tick, { immediate: false });
    vi.advanceTimersByTime(INTERVAL * 3);
    expect(tick).not.toHaveBeenCalled();

    setOnline(true);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  describe('isPaused', () => {
    it('skips ticks while the predicate is true and resumes without any event', () => {
      let paused = true;
      const tick = vi.fn();
      poller(tick, { isPaused: () => paused });

      expect(tick).not.toHaveBeenCalled();
      vi.advanceTimersByTime(INTERVAL * 3);
      expect(tick).not.toHaveBeenCalled();

      paused = false;
      vi.advanceTimersByTime(INTERVAL);
      expect(tick).toHaveBeenCalledTimes(1);
    });

    it('is re-read on every tick, so a run going terminal stops the polling', () => {
      let done = false;
      const tick = vi.fn(() => {
        done = true;
      });
      poller(tick, { isPaused: () => done });

      expect(tick).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(INTERVAL * 5);
      expect(tick).toHaveBeenCalledTimes(1);
    });

    it('suppresses the resume tick too', () => {
      const tick = vi.fn();
      poller(tick, { isPaused: () => true });
      setHidden(true);
      setHidden(false);
      expect(tick).not.toHaveBeenCalled();
    });
  });

  /**
   * A tick slower than its own interval. Stacking a second request on top of the first is not
   * merely wasteful: the two responses can land in either order, so the state the page ends up
   * showing is whichever request happened to answer last, not the newer one.
   */
  describe('one tick at a time', () => {
    it('skips every interval while an async tick is still unsettled', async () => {
      let settle: (() => void) | undefined;
      const tick = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            settle = resolve;
          })
      );
      poller(tick, { immediate: false });

      await vi.advanceTimersByTimeAsync(INTERVAL);
      expect(tick).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(INTERVAL * 5);
      expect(tick).toHaveBeenCalledTimes(1);

      settle?.();
      await vi.advanceTimersByTimeAsync(INTERVAL);
      expect(tick).toHaveBeenCalledTimes(2);
    });

    it('skips the resume tick while one is still unsettled', async () => {
      let settle: (() => void) | undefined;
      const tick = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            settle = resolve;
          })
      );
      poller(tick);
      expect(tick).toHaveBeenCalledTimes(1);

      setHidden(true);
      setHidden(false);
      expect(tick).toHaveBeenCalledTimes(1);

      settle?.();
      await vi.advanceTimersByTimeAsync(INTERVAL);
      expect(tick).toHaveBeenCalledTimes(2);
    });

    it('releases the guard when the tick rejects, so polling continues', async () => {
      vi.spyOn(console, 'debug').mockImplementation(() => {});
      const tick = vi.fn(() => Promise.reject(new Error('boom')));
      poller(tick);
      await vi.advanceTimersByTimeAsync(INTERVAL * 2);
      expect(tick).toHaveBeenCalledTimes(3);
    });

    it('never guards a synchronous callback, which has already returned', () => {
      const tick = vi.fn();
      poller(tick);
      vi.advanceTimersByTime(INTERVAL * 3);
      expect(tick).toHaveBeenCalledTimes(4);
    });
  });

  describe('errors', () => {
    beforeEach(() => {
      vi.spyOn(console, 'debug').mockImplementation(() => {});
    });

    it('keeps polling after the callback throws', () => {
      const tick = vi.fn(() => {
        throw new Error('boom');
      });
      poller(tick);
      expect(() => vi.advanceTimersByTime(INTERVAL * 2)).not.toThrow();
      expect(tick).toHaveBeenCalledTimes(3);
      expect(console.debug).toHaveBeenCalledTimes(3);
    });

    it('swallows a rejected promise from an async callback', async () => {
      const tick = vi.fn(() => Promise.reject(new Error('boom')));
      poller(tick);
      await vi.advanceTimersByTimeAsync(INTERVAL);
      expect(tick).toHaveBeenCalledTimes(2);
      expect(console.debug).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanup', () => {
    it('clears the timer and detaches every listener', () => {
      const tick = vi.fn();
      const stop = poller(tick);
      tick.mockClear();

      stop();
      vi.advanceTimersByTime(INTERVAL * 5);
      expect(tick).not.toHaveBeenCalled();

      // A visibility or network event after cleanup must not restart it.
      setHidden(true);
      setHidden(false);
      setOnline(false);
      setOnline(true);
      vi.advanceTimersByTime(INTERVAL * 5);
      expect(tick).not.toHaveBeenCalled();
    });
  });
});
// dry-copy-end
