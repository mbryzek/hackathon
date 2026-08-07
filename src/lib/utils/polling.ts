/**
 * Repeating poll that pauses while the tab is hidden or the browser is offline and
 * resumes (with an immediate tick) when visible/online again. Ported verbatim from rallyd's
 * `src/lib/utils/polling.ts` per rules/sveltekit.data.loading.mdc, which says to port it rather
 * than hand-roll `setInterval` + `visibilitychange` listeners. Kept byte-identical to the rallyd
 * and playbook-admin copies so the three stay diffable — change all of them or none.
 *
 * Returns a cleanup function — call it (or return it from a `$effect`) to stop.
 */
export function visibilityAwareInterval(callback: () => void | Promise<void>, intervalMs: number): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return () => {};
  }

  const isOnline = () => (typeof navigator !== 'undefined' ? navigator.onLine : true);

  function safeCallback() {
    try {
      const result = callback();
      if (result && typeof result.catch === 'function') {
        result.catch((e) => console.debug('Polling callback error:', e));
      }
    } catch (e) {
      console.debug('Polling callback error:', e);
    }
  }

  let intervalId: ReturnType<typeof setInterval> | undefined;
  let paused = false;

  function start() {
    if (intervalId) return;
    paused = false;
    safeCallback();
    intervalId = setInterval(safeCallback, intervalMs);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
    paused = true;
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      stop();
    } else if (paused && isOnline()) {
      start();
    }
  }

  function handleOnline() {
    if (!document.hidden && paused) {
      start();
    }
  }

  function handleOffline() {
    stop();
  }

  if (!document.hidden && isOnline()) {
    safeCallback();
  }
  intervalId = setInterval(safeCallback, intervalMs);

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  if (document.hidden || !isOnline()) {
    stop();
  }

  return () => {
    stop();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
