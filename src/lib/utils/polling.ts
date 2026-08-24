/**
 * Repeating poll that pauses while the tab is hidden or the browser is offline and
 * resumes (with an immediate tick) when visible/online again. Ported from rallyd's
 * `src/lib/utils/polling.ts` per rules/sveltekit.data.loading.mdc.
 *
 * This is the one poller in this repo. Do not hand-roll `setInterval` + `visibilitychange`,
 * and do not add a second helper for the pause-predicate case — that is `isPaused` below.
 *
 * This helper is copied verbatim into the other SvelteKit repos. The `dry-copy` markers below
 * are the declaration — `dev repo copies` enumerates every copy carrying them and reports one
 * that has drifted, so a change here that does not reach the others is caught rather than
 * merely regretted (ISS-3894). Which repos those are is the marker's answer, not this
 * comment's: a hand-written list here is one more copy to keep true, and nothing checks it.
 *
 * Returns a cleanup function — call it (or return it from a `$effect`) to stop.
 * dry-copy: sveltekit/visibility-aware-interval — every copy of this region must match; `dev repo copies` checks it (ISS-3894)
 */
export interface PollingOptions {
  /**
   * Checked on every tick, and the tick is skipped while it returns true. For a condition
   * nothing notifies us about — a terminal status, a collapsed panel, an idle user — which is
   * why the timer keeps running rather than being cleared: the predicate can go false at any
   * moment and there is no event to restart on.
   *
   * Visibility and network state are NOT this: those have events, so they clear the timer.
   */
  isPaused?: () => boolean;
  /**
   * Whether to fire one tick as soon as polling starts. Default true. Pass false when the page
   * already has the data — an SSR `load`, or a fetch the component runs on mount — so the poll
   * does not duplicate that first request.
   *
   * Resuming from hidden/offline always fires a tick regardless: the data went stale while the
   * timer was stopped, which is the whole reason to resume.
   */
  immediate?: boolean;
}

/**
 * The callback, wrapped so a tick can neither overlap the one before it nor throw into the timer.
 *
 * A callback slower than its own interval would otherwise have a second request in flight before
 * the first answered, and two responses can land in either order — so a tick is SKIPPED while the
 * previous one is unsettled rather than queued behind it. Only an async callback can be in flight;
 * a synchronous one has already returned.
 */
function guardedTick(callback: () => void | Promise<void>, isPaused: (() => boolean) | undefined): () => void {
  let inflight = false;
  return () => {
    try {
      if (inflight || isPaused?.()) return;
      const result = callback();
      if (result && typeof result.catch === 'function') {
        inflight = true;
        result
          .catch((e) => console.debug('Polling callback error:', e))
          .finally(() => {
            inflight = false;
          });
      }
    } catch (e) {
      console.debug('Polling callback error:', e);
    }
  };
}

/**
 * A `setInterval` that can be stopped and restarted, and that remembers having been stopped.
 *
 * `suspended` is what tells a resume apart from a first start: a visibility or network event
 * arrives whether or not this timer was running, so the handler has to ask. It is distinct from
 * `PollingOptions.isPaused`, which skips a tick without stopping the timer.
 */
interface SuspendableTimer {
  start(fireNow: boolean): void;
  stop(): void;
  readonly suspended: boolean;
}

function suspendableTimer(tick: () => void, intervalMs: number): SuspendableTimer {
  let intervalId: ReturnType<typeof setInterval> | undefined;
  let suspended = false;
  return {
    start(fireNow: boolean): void {
      if (intervalId) return;
      suspended = false;
      if (fireNow) tick();
      intervalId = setInterval(tick, intervalMs);
    },
    stop(): void {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
      suspended = true;
    },
    get suspended(): boolean {
      return suspended;
    }
  };
}

export function visibilityAwareInterval(
  callback: () => void | Promise<void>,
  intervalMs: number,
  options: PollingOptions = {}
): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return () => {};
  }

  const { isPaused, immediate = true } = options;
  const isOnline = (): boolean => (typeof navigator !== 'undefined' ? navigator.onLine : true);
  const timer = suspendableTimer(guardedTick(callback, isPaused), intervalMs);

  function handleVisibilityChange(): void {
    if (document.hidden) {
      timer.stop();
    } else if (timer.suspended && isOnline()) {
      timer.start(true);
    }
  }

  function handleOnline(): void {
    if (!document.hidden && timer.suspended) {
      timer.start(true);
    }
  }

  function handleOffline(): void {
    timer.stop();
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  if (document.hidden || !isOnline()) {
    timer.stop();
  } else {
    timer.start(immediate);
  }

  return () => {
    timer.stop();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
// dry-copy-end
