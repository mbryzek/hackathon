/**
 * Repeating poll that pauses while the tab is hidden or the browser is offline and
 * resumes (with an immediate tick) when visible/online again. Ported from rallyd's
 * `src/lib/utils/polling.ts` per rules/sveltekit.data.loading.mdc.
 *
 * This is the one poller in this repo. Do not hand-roll `setInterval` + `visibilitychange`,
 * and do not add a second helper for the pause-predicate case — that is `isPaused` below.
 *
 * The same helper lives in playbook-admin, playbook-app and rallyd. The `dry-copy` markers
 * below declare that, and `dev repo copies` checks it every few hours — so a change here that
 * does not reach the other three is reported rather than merely regretted (ISS-3894).
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

export function visibilityAwareInterval(
  callback: () => void | Promise<void>,
  intervalMs: number,
  options: PollingOptions = {}
): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return () => {};
  }

  const { isPaused, immediate = true } = options;

  const isOnline = () => (typeof navigator !== 'undefined' ? navigator.onLine : true);

  // One tick at a time. A callback slower than its own interval would otherwise have a second
  // request in flight before the first answered, and two responses can land in either order — so
  // a tick is SKIPPED while the previous one is unsettled rather than queued behind it. Only an
  // async callback can be in flight; a synchronous one has already returned.
  let inflight = false;

  function safeCallback() {
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
  }

  let intervalId: ReturnType<typeof setInterval> | undefined;
  // Suspended by visibility or network state — distinct from `isPaused()`, which skips a tick
  // without stopping the timer.
  let suspended = false;

  function start(fireNow: boolean) {
    if (intervalId) return;
    suspended = false;
    if (fireNow) safeCallback();
    intervalId = setInterval(safeCallback, intervalMs);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
    suspended = true;
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      stop();
    } else if (suspended && isOnline()) {
      start(true);
    }
  }

  function handleOnline() {
    if (!document.hidden && suspended) {
      start(true);
    }
  }

  function handleOffline() {
    stop();
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  if (document.hidden || !isOnline()) {
    suspended = true;
  } else {
    start(immediate);
  }

  return () => {
    stop();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
// dry-copy-end
