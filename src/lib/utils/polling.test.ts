import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { visibilityAwareInterval } from './polling';

describe('visibilityAwareInterval', () => {
  let docListeners: Record<string, EventListener>;
  let winListeners: Record<string, EventListener>;
  let hidden: boolean;
  let onLine: boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    docListeners = {};
    winListeners = {};
    hidden = false;
    onLine = true;

    vi.stubGlobal('document', {
      get hidden() {
        return hidden;
      },
      addEventListener: (event: string, handler: EventListener) => {
        docListeners[event] = handler;
      },
      removeEventListener: (event: string) => {
        delete docListeners[event];
      }
    });

    vi.stubGlobal('navigator', {
      get onLine() {
        return onLine;
      }
    });

    vi.stubGlobal('window', {
      addEventListener: (event: string, handler: EventListener) => {
        winListeners[event] = handler;
      },
      removeEventListener: (event: string) => {
        delete winListeners[event];
      }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function hide(): void {
    hidden = true;
    docListeners['visibilitychange']?.(new Event('visibilitychange'));
  }

  function show(): void {
    hidden = false;
    docListeners['visibilitychange']?.(new Event('visibilitychange'));
  }

  function goOffline(): void {
    onLine = false;
    winListeners['offline']?.(new Event('offline'));
  }

  function goOnline(): void {
    onLine = true;
    winListeners['online']?.(new Event('online'));
  }

  it('fires immediately and then on the interval when visible and online', () => {
    const callback = vi.fn();
    visibilityAwareInterval(callback, 1000);

    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(3000);
    expect(callback).toHaveBeenCalledTimes(4);
  });

  it('stops calling when the tab becomes hidden', () => {
    const callback = vi.fn();
    visibilityAwareInterval(callback, 1000);
    callback.mockClear();

    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(2);

    hide();

    vi.advanceTimersByTime(3000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('resumes with an immediate callback when the tab becomes visible', () => {
    const callback = vi.fn();
    visibilityAwareInterval(callback, 1000);
    callback.mockClear();

    hide();
    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();

    show();
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('stops when offline and resumes when online', () => {
    const callback = vi.fn();
    visibilityAwareInterval(callback, 1000);
    callback.mockClear();

    goOffline();
    vi.advanceTimersByTime(3000);
    expect(callback).not.toHaveBeenCalled();

    goOnline();
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('cleanup clears the interval and removes every listener', () => {
    const callback = vi.fn();
    const cleanup = visibilityAwareInterval(callback, 1000);
    callback.mockClear();

    cleanup();

    vi.advanceTimersByTime(3000);
    expect(callback).not.toHaveBeenCalled();
    expect(docListeners['visibilitychange']).toBeUndefined();
    expect(winListeners['online']).toBeUndefined();
    expect(winListeners['offline']).toBeUndefined();
  });

  it('never starts when the tab is already hidden at creation time', () => {
    hidden = true;
    const callback = vi.fn();
    visibilityAwareInterval(callback, 1000);

    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('does not resume on `online` while the tab is still hidden', () => {
    const callback = vi.fn();
    visibilityAwareInterval(callback, 1000);
    callback.mockClear();

    hide();
    goOffline();
    goOnline();

    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('does not resume on `visibilitychange` while still offline', () => {
    const callback = vi.fn();
    visibilityAwareInterval(callback, 1000);
    callback.mockClear();

    goOffline();
    hide();
    show();

    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('keeps polling when the callback throws', () => {
    const callback = vi.fn(() => {
      throw new Error('boom');
    });
    visibilityAwareInterval(callback, 1000);
    callback.mockClear();

    vi.advanceTimersByTime(2000);
    expect(callback).toHaveBeenCalledTimes(2);
  });
});
