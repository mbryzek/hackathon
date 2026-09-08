/**
 * THE SERVER HALF OF DETERMINISM (ISS-9327). `node --import` this into the server under capture.
 *
 * `capture.ts` pins everything that can move a pixel INSIDE the browser, and on a server-rendered
 * site that is only half of it. This site shuffles its photo and video galleries with
 * `Math.random()` (`src/lib/utils/shuffle.ts`, reached from `PhotoGallery` and `VideoGallery` with
 * `shuffleOnMount`), and that call runs during SSR — so `/Y25/photos` serves a DIFFERENT DOCUMENT
 * to every request and nothing the browser does can reach it. The A/A gate measured it before this
 * existed: 24 of 189 shots differed across two captures of the same server, on exactly the four
 * pages that shuffle, with byte-identical computed styles on both sides.
 *
 * A GENERATOR PER REQUEST, SEEDED FROM THE REQUEST'S OWN URL, and each of those three words is
 * load-bearing:
 *
 *   - PER REQUEST, carried on `AsyncLocalStorage`, because a server is not a browser. A browser
 *     gets a fresh JS context per page, so one seeded sequence there is deterministic; a server
 *     handles four playwright workers at once against one global, so which value a given request
 *     draws would depend on how the requests interleaved. Async context follows the `await` chain
 *     SSR is built out of, so each render draws from its own sequence whatever else is in flight.
 *   - SEEDED FROM THE URL, so the same path renders the same document in both captures of an A/B
 *     no matter what order the pages were visited in, and two different pages still shuffle
 *     differently rather than all sharing one permutation.
 *   - A GENERATOR AND NOT A CONSTANT. `Math.random = () => 0.5` is the obvious version and it
 *     breaks the dev server outright: vite's module runner derives cache keys from random values,
 *     so a constant collides two different modules onto one entry and SvelteKit's client state
 *     module gets evaluated in the SSR runner (`TypeError: Cannot set properties of undefined`).
 *
 * OUTSIDE A REQUEST THE REAL `Math.random` IS UNTOUCHED — module initialisation, vite's own
 * internals, anything that needs genuine entropy for correctness rather than for presentation.
 * That is what keeps this a harness affordance rather than a change to how the server works.
 *
 * THIS IS APPLIED TO BOTH SIDES OF AN A/B OR TO NEITHER. Nothing in `src/` knows it exists; it is
 * the same act as `capture.ts`'s `addInitScript`, one process further out.
 * `playwright/visual/README.md` puts it in the command that starts the server.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import http from 'node:http';

const store = new AsyncLocalStorage();
const entropy = Math.random;

/** FNV-1a over the url, so the seed is a pure function of what was asked for. */
function seedOf(url) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < url.length; i += 1) {
    hash ^= url.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash & 0x7fffffff || 1;
}

Math.random = () => {
  const state = store.getStore();
  if (state === undefined) return entropy();
  state.seed = (Math.imul(state.seed, 1103515245) + 12345) & 0x7fffffff;
  return state.seed / 0x80000000;
};

/*
 * `emit('request')` rather than a vite plugin or a SvelteKit hook: the server is started by
 * `npm run dev`, which the caller runs and this file must not have to modify, and `http.Server` is
 * what every node http stack — vite's dev server, `vite preview`, an adapter's node server —
 * ultimately emits through. Hooking it here means one preload covers all three.
 */
const emit = http.Server.prototype.emit;
http.Server.prototype.emit = function patched(event, ...args) {
  if (event !== 'request') return emit.call(this, event, ...args);
  return store.run({ seed: seedOf(String(args[0]?.url ?? '')) }, () => emit.call(this, event, ...args));
};
