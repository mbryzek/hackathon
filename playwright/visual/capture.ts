/**
 * THE BROWSER HALF (ISS-9319, copied under ISS-9325): everything done to a page so that two runs
 * of it are the same bytes.
 *
 * A parity harness is worth exactly what its determinism is worth. Every hash difference this
 * thing reports has to mean "the stylesheet renders differently", so anything else that can move a
 * pixel between two runs has to be pinned here, applied identically on both sides, and — this is
 * the part that is easy to skip — PROVED, by capturing `main` twice and requiring every hash to
 * match before the harness is allowed to judge anything. That A/A gate is why the list below is a
 * list of measured hazards rather than of plausible ones.
 *
 * WHAT MOVES BETWEEN TWO RUNS OF THE SAME PAGE, and what is done about it:
 *
 *   - THE CLOCK. Nothing in this app renders a date today, but a page that grows one must not
 *     silently start failing every A/B from that day on.
 *     `clock.setFixedTime` rather than `clock.install`: it freezes what `Date.now()` and
 *     `new Date()` answer and leaves the timers running, which is what a page that schedules a
 *     microtask on mount needs in order to finish rendering at all.
 *   - RANDOMNESS. A fixture is free to call `Math.random()`, and one that does would make every
 *     capture new. Seeded here rather than banned in fixtures, because a rule that fixtures have
 *     to remember is a rule that stops being true.
 *   - ANIMATION AND TRANSITION. `reducedMotion: 'reduce'` at the context, playwright's own
 *     `animations: 'disabled'` at the screenshot, and a settle after each state change that
 *     outlasts the stylesheet's longest declared transition.
 *   - THE SHOT ITSELF, which would resize the viewport and destroy the very state being shot. A
 *     full-page screenshot of a document taller than the viewport renders it at its own height,
 *     and Chromium is briefly at other sizes on the way there and back -- 1x1 among them,
 *     measured. Every resize re-decides what is under the pointer, so a hover lost there is lost
 *     to the raster. So the viewport is made the document's own size BEFORE a state is applied,
 *     and the shot is of that viewport, which needs no resize. See `fitToDocument`. Every pointer
 *     event is also SEALED off from the page for the length of the shot, for any resize Chromium
 *     still makes on its own: at 1x1 it dispatches `pointerout`/`mouseleave` at a pointer that
 *     never moved, and a page that mounts something on hover tears it down. The DOM's structure
 *     is still read on both sides of the screenshot, and a shot whose page moved across its own
 *     raster is retaken rather than recorded. See `screenshotFrozen`. The stylesheet is NOT
 *     patched with an injected `transition: none` rule: that would change the CSSOM the
 *     computed-style dump then reads, and the dump is meant to describe the page, not the harness.
 *   - A HOVER THAT IS NOT A FIXED POINT. A `hover:` rule that widens its own target can move it
 *     out from under the pointer -- a chip that grows wraps to the next line, the pointer is over
 *     the gap, the chip shrinks and wraps back. That page flickers in a real browser too, and
 *     which half of the flicker a raster catches is timing. It is recorded as `unstable`, which is
 *     the same answer on every run, rather than shot. See `applyState`.
 *   - WHETHER A FOCUS DRAWS ITS RING. A scripted `focus()` matches `:focus-visible` or not by the
 *     document's input history -- Chromium's modality heuristic -- not by anything on the page, so
 *     the same focus shot rendered the UA ring on one capture and no ring on the next (ISS-15883).
 *     Keyboard modality is set before every focus, and a focus that still comes back without its
 *     ring is retaken rather than shot. See `KEYBOARD_MODALITY_KEY`.
 *   - FONTS, asked at the LAST POSSIBLE MOMENT and answered on both sides of every shot.
 *     `document.fonts.ready` plus every declared face LOADED is where it starts, since a shot
 *     taken before a self-hosted face swaps in is a shot of the fallback
 *     metrics. That is not enough on its own and never was: a `ch` is resolved AT LAYOUT and kept,
 *     so a document that laid itself out without the face goes on being that wide however loaded
 *     the face is by the time anything asks. So a `100ch` box is planted before the first layout
 *     and kept for the LIFE of the document, and "does the box the page was laid out with still
 *     measure what a box created now measures" is asked immediately before AND immediately after
 *     the screenshot -- planting the freeze stylesheet is a whole-tree style recalc, and one that
 *     lands while the face is momentarily gone re-resolves every `ch` on the page to `0.5em` after
 *     every earlier check has passed. A shot that cannot be taken on honest metrics is not
 *     recorded on the wrong ones: the document is reloaded and the shot retaken. See `metrics`,
 *     `screenshotFrozen` and `captureShot`. A face served from another host is kept on disk after
 *     its first fetch, so whether that host answers is not a property of the capture, and a face
 *     that failed anyway is a reload rather than a shot on the fallback. See `serveCached`.
 *     THIS APP DECLARES NO `@font-face` — its stack is Inter with system fallbacks — so all of this
 *     is inert here and is kept for the reason the whole module is: the region below is shared byte
 *     for byte with the repos that do self-host one, and a probe that measures an installed font is
 *     a correct answer, not a skipped one.
 *   - THE THEME KEY. `themedContext` writes `localStorage['playbook-theme']` before the first byte
 *     of the document runs. Nothing in this app reads it; see `matrix.ts` on why the axis is kept.
 *   - THE COLOUR SCHEME. Pinned to `light` at the context. This app has no dark mode at all, so
 *     this pins nothing the app reads — it pins what the UA stylesheet reads (form controls,
 *     scrollbars, the canvas), which otherwise follows the MACHINE the capture ran on.
 *   - THE DEVICE SCALE. `deviceScaleFactor: 1` and `scale: 'css'`, so the PNG is in CSS pixels and
 *     a capture taken on a retina box is comparable with one taken on a runner.
 *   - WHERE THE PAGE IS SCROLLED. A full-page screenshot renders fixed and sticky chrome at the
 *     current scroll offset, so `focus` and `hover` deliberately never scroll: both pick a target
 *     that is already inside the initial viewport, and skip the state when there is none.
 *   - IMAGES AND POSTER FRAMES, decoded rather than merely fetched, and `loading="lazy"` forced
 *     eager first. `networkidle` cannot see a lazy image: it has not been REQUESTED yet, and a
 *     full-page screenshot resizes the viewport to the whole document, which starts those requests
 *     after the wait is already over. See `awaitMedia` (ISS-9327).
 *   - THIRD-PARTY BITMAPS AND VIDEO, replaced by a flat rectangle of the same intrinsic size and
 *     by nothing at all. Chromium does not downscale a large photograph reproducibly across page
 *     loads, and a `<video>` with no poster paints whichever frame `preload="metadata"` happened
 *     to decode; neither is something a CSS parity harness has a question about. See
 *     `stubForeignMedia` (ISS-9327).
 *   - A LATE CLIENT-SIDE REDIRECT, waited out before any shot. See `settle` (ISS-9327).
 *   - THE ORDER OF THE DEV SERVER'S STYLESHEETS, which vite decides by when each module happened
 *     to evaluate, so two equally specific rules in two files trade places with the runner's load.
 *     Put into one canonical order before every shot. See `canonicalStyleOrder` (ISS-15642).
 *   - WHERE AN INNER SCROLLER WAS LEFT, which is the history of the page's own layout rather than
 *     anything the stylesheet says. Every one is put back at its origin. See `canonicalize`
 *     (ISS-15642).
 */
// dry-copy: visual-parity/capture — every copy of this region must match; `dev repo copies` checks it
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Browser, BrowserContext, Cookie, Page, Request, Route } from '@playwright/test';
import { settleTimeout, type StateName, type ThemeName, type Viewport } from './matrix.ts';
import { encodeStyles, type RawElement, type StyleDump } from './styles.ts';

/**
 * The instant every capture believes it is.
 *
 * Arbitrary, fixed forever, and deliberately in the past: a date in the future makes a page that
 * renders "in 3 days" read as nonsense to whoever opens the PNG to see what broke.
 */
export const FIXED_TIME = new Date('2025-06-15T12:00:00.000Z');

/**
 * How long to let declared transitions finish after a state change.
 *
 * MUST OUTLAST THE LONGEST TRANSITION ANY REPO CARRYING THIS REGION DECLARES, or a hover shot is
 * taken part-way through one and two captures of the same page disagree about where an element
 * was. The longest is playbook-www's `--v2-dur-slow` at 780ms, which the chart entrance
 * choreography and the product tour's frame transition both run on; hackathon's `duration-500` is
 * the next one down, and a console's is 0.25s.
 */
const SETTLE_MS = 900;

/**
 * How long any one navigation or load-state wait inside `settle` may take.
 *
 * READ ONCE, AT IMPORT, so a typo in `VISUAL_SETTLE_TIMEOUT_MS` throws before the capture has taken
 * a single shot rather than on the page that happens to need it. `matrix.ts` carries the number and
 * the argument for it; this is the only place the harness spells the deadline out (ISS-9985).
 */
const SETTLE_TIMEOUT_MS = settleTimeout(process.env['VISUAL_SETTLE_TIMEOUT_MS']);

/**
 * THE DOCUMENT A PAGE OPERATION WAS ADDRESSING WENT AWAY, BECAUSE THE PAGE NAVIGATED (ISS-10052).
 *
 * PLAYWRIGHT REPORTS THIS AS AN ORDINARY FAILURE OF WHATEVER CALL WAS IN FLIGHT -- `page.evaluate:
 * Execution context was destroyed, most likely because of a navigation` -- with nothing in it to
 * separate "this page is broken" from "this page moved". Left as a throw it takes the WHOLE TEST
 * with it: every shot already written is orphaned, no shard is written, and `merge.ts` records the
 * page as dropped at `page` scope. One late navigation on one of a page's six contexts therefore
 * costs a thirty-minute capture, because a capture missing a page cannot pass an A/A gate. Measured on
 * playbook-app's preview set: five of twenty-nine pages, from three different call sites -- the
 * diagnostic size read, `loadDeclaredFaces` inside `screenshotFrozen`, and `awaitMeasurable`
 * inside `applyState`.
 *
 * A TYPED ERROR RATHER THAN A FAILURE VALUE, and the reason is that nothing between the `evaluate`
 * and the caller can repair it. Six functions sit on that path and every one of them would have to
 * grow a third return arm for a condition none of them can answer; the repair needs the ROUTE,
 * which only `parity.spec.ts` holds -- a fresh document at the url this context was asked for.
 * Everything in between says nothing and passes it up.
 */
export class NavigatedAway extends Error {
  /** The url the context settled on, which is the one every key it writes is filed under. */
  readonly from: string;
  /** Where the document went instead. */
  readonly to: string;

  /**
   * `replaced` is the same url served as a NEW DOCUMENT, which is a navigation that moves nothing a
   * url can show. See `refuseIfNavigated`.
   */
  constructor(from: string, to: string, replaced = false) {
    super(
      replaced
        ? `the document at ${from} was replaced by a new document during its own capture`
        : `the document left ${from} for ${to} during its own capture`
    );
    this.name = 'NavigatedAway';
    this.from = from;
    this.to = to;
  }
}

/**
 * Whether playwright's failure is a context destroyed under the call rather than anything about
 * the page.
 *
 * MATCHED ON THE MESSAGE, because playwright does not type these, and DELIBERATELY NARROW. A closed
 * target ("Target page, context or browser has been closed") is NOT this: treating it as a
 * navigation would turn a browser that died into a re-settle loop that can never succeed, and would
 * hide the death behind a `dropped` row blaming a navigation that never happened.
 */
function destroyedByNavigation(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes('execution context was destroyed') ||
    message.includes('cannot find context with specified id') ||
    message.includes('frame was detached') ||
    message.includes('frame got detached')
  );
}

/**
 * Run `body`, reporting a context destroyed by a navigation as `NavigatedAway`.
 *
 * WRAPPED AT THE EXPORTED ENTRY POINTS RATHER THAN AT EACH `page.evaluate`, and the difference is
 * the whole point: this region reaches the page from a dozen places and grows more, so a guard
 * written per `evaluate` is one somebody has to remember on the thirteenth. Every one of those
 * calls is reached through one of the handful of functions `parity.spec.ts` calls, so guarding
 * those covers the sites written so far and the sites written next.
 */
async function throughNavigation<T>(page: Page, body: () => Promise<T>): Promise<T> {
  const from = page.url();
  try {
    return await body();
  } catch (error) {
    if (!destroyedByNavigation(error)) throw error;
    throw new NavigatedAway(from, page.url());
  }
}

/**
 * Raise `NavigatedAway` when the page is no longer on the url its context settled on.
 *
 * THE SILENT HALF OF THE SAME FAILURE, and the one no error can report. A navigation that lands in
 * a gap between two of the harness's own calls destroys nothing: the next `evaluate` runs happily
 * against the NEW document, `captureShot`'s reload reloads the NEW url, and every remaining shot of
 * that context is filed under this route's keys while depicting another page. That is worse than
 * the loud failure, because a mixture of two documents under one page's keys is a difference the
 * next A/B blames on a stylesheet.
 *
 * `page.url()` is a local read of what playwright already knows -- no round trip and no execution
 * context -- so it is asked on both sides of every shot, exactly as `structure` is asked on both
 * sides of every raster.
 *
 * A NEW DOCUMENT AT THE SAME URL IS THE SAME FAILURE, AND THE URL CANNOT SEE IT (ISS-15888). A dev
 * server's full page reload -- vite's dependency optimizer finishing on a cold server, a regenerated
 * `.svelte-kit` module -- replaces the document without moving the url, and a client-rendered page
 * then spends seconds as an empty shell before it mounts again. Measured on trips' A/A: one context
 * of the checklist preview fitted itself to the empty shell, shot rest and focus as two
 * byte-identical PNGs of the bare viewport with no focus target, and recorded both beside a height
 * read after the page had mounted again. So the document is counted as well (`documentOf`), and a
 * page whose count has moved since it settled is refused exactly as a page whose url has.
 */
export function refuseIfNavigated(page: Page, settledAt: string): void {
  if (page.url() !== settledAt) throw new NavigatedAway(settledAt, page.url());
  refuseIfReplaced(page);
}

/** Raise `NavigatedAway` when the page is no longer showing the document it last settled. */
function refuseIfReplaced(page: Page): void {
  const settled = settledDocuments.get(page);
  if (settled !== undefined && documentOf(page) !== settled) throw new NavigatedAway(page.url(), page.url(), true);
}

/** How many documents each page's main frame has asked for, counted as each request leaves. */
const documentRequests = new WeakMap<Page, number>();

/** `documentOf` at the moment each page last became quiet: the document every shot of it is of. */
const settledDocuments = new WeakMap<Page, number>();

/**
 * Count every document `page` asks for from now on.
 *
 * A NAVIGATION REQUEST OF THE MAIN FRAME, BECAUSE THAT IS WHAT A NEW DOCUMENT IS. A reload, a
 * `location` assignment and a server redirect each issue one; a SvelteKit client navigation and a
 * `history.replaceState` issue none and replace no document, and the url check already covers the
 * first of those. Counted when the request LEAVES rather than when the new document commits, so the
 * count has moved before anything can be read off the document it is fetching.
 *
 * A local read, like `page.url()`, so `refuseIfNavigated` stays one without a round trip.
 */
function watchDocuments(page: Page): void {
  if (documentRequests.has(page)) return;
  documentRequests.set(page, 0);
  page.on('request', (request) => {
    if (!request.isNavigationRequest()) return;
    if (request.frame() !== page.mainFrame()) return;
    documentRequests.set(page, documentOf(page) + 1);
  });
}

/** Which document `page` is on, as a count of the ones it has asked for. */
function documentOf(page: Page): number {
  return documentRequests.get(page) ?? 0;
}

/**
 * How many documents one context may be given after a navigation took the one it was shooting.
 *
 * A RE-SETTLE IS NOT THE RETRY `playwright.visual.config.ts` FORBIDS, for the same reason
 * `SETTLE_ATTEMPTS` is not. That rule is about re-rendering a shot that already succeeded, and
 * nothing here is re-rendered: the shots already recorded are KEPT and skipped by key, and the shot
 * the navigation landed in produced no bytes, no key and no row -- so the new document is this
 * harness's first sample of it rather than its second opinion.
 *
 * THREE, because both measured causes are transient AND recur. A vite full page reload fires once
 * per touched file and a `npm run check` in the same checkout touches many; a client-side redirect
 * that lost its race with the settle can lose it again on the next document. Two documents is one
 * coin flipped twice. Three bounds the cost at two extra settles per context, paid only where a
 * navigation actually happened.
 */
export const NAVIGATION_ATTEMPTS = 3;

/**
 * The id of the `100ch` box planted before first layout and kept until the document goes away.
 *
 * IT IS NOT REMOVED AFTER THE NAVIGATION, because the question it answers is not a question about
 * the navigation. A box created now cannot see a resolution the page made earlier and is still
 * carrying, and the page can acquire one at any style recalc after the load — so the only box that
 * can be compared against a fresh one is one that has been there since before the first layout.
 * `dumpStyles` skips it by this id and it paints nothing, so it is in no shot and no diagnostic.
 */
const CH_PROBE_ID = '__visual_ch_probe__';

/** Off-flow, zero-height and unpainted, so a box that stays in the document is in no screenshot. */
const CH_PROBE_STYLE = 'position:absolute;top:-9999px;left:-9999px;width:100ch;height:0;visibility:hidden;pointer-events:none';

/**
 * The window property that, while `true`, keeps every pointer event away from the page. Set and
 * cleared by `screenshotFrozen`; the listener that reads it is installed by `DETERMINISM_INIT`.
 */
const POINTER_SEAL = '__visual_pointer_sealed__';

/** What Chromium dispatches at a pointer whose page moved under it, without the pointer moving. */
const SEALED_POINTER_EVENTS = [
  'pointerover',
  'pointerenter',
  'pointerout',
  'pointerleave',
  'pointermove',
  'mouseover',
  'mouseenter',
  'mouseout',
  'mouseleave',
  'mousemove'
];

/** Applied identically to both sides. See the class comment for why each line is here. */
const DETERMINISM_INIT = `(() => {
  // Seeded LCG, not crypto: the only requirement is that two runs agree.
  let seed = 0x2f6e2b1;
  Math.random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x80000000;
  };
  // A 100ch box in the document from the moment there is a document, so that it resolves ch in
  // the same first layout the page's own elements do, and stays for as long as they do.
  document.addEventListener('DOMContentLoaded', () => {
    const probe = document.createElement('div');
    probe.id = ${JSON.stringify(CH_PROBE_ID)};
    probe.style.cssText = ${JSON.stringify(CH_PROBE_STYLE)};
    document.body.appendChild(probe);
  });
  // Installed before any page script runs, so it is the FIRST capture-phase listener on the window
  // and stopImmediatePropagation keeps a sealed event from every listener the page adds -- on the
  // window, on the root a framework delegates to, and on the element itself. See screenshotFrozen.
  for (const type of ${JSON.stringify(SEALED_POINTER_EVENTS)}) {
    window.addEventListener(
      type,
      (event) => {
        if (window[${JSON.stringify(POINTER_SEAL)}] === true) event.stopImmediatePropagation();
      },
      { capture: true }
    );
  }
})();`;

/**
 * Where the intrinsic size of each foreign image is remembered between captures (ISS-9327).
 *
 * BESIDE the output directory rather than inside it: `setup.ts` clears `VISUAL_OUT` at the start
 * of every capture, and the whole value of this cache is that the two sides of an A/B share it.
 * `VISUAL_CACHE` overrides it when the two captures do not sit under one parent.
 */
function cacheDir(): string {
  const explicit = process.env['VISUAL_CACHE'];
  if (explicit !== undefined && explicit !== '') return explicit;
  return join(dirname(process.env['VISUAL_OUT'] ?? '.'), 'image-sizes');
}

/** The foreign resource types a capture is served from disk rather than from their host. */
const CACHED_TYPES = new Set(['font', 'stylesheet']);

/** What a cached response was served with, beside its body. */
interface CachedResponse {
  contentType: string;
}

/**
 * SERVE A CROSS-ORIGIN FONT OR STYLESHEET FROM DISK, fetching it from its host only the first time.
 *
 * A WEBFONT THAT FAILS TO ARRIVE IS A WHOLE CONTEXT ON THE WRONG FACE, and nothing about the
 * failure is visible in the computed style: the family is still the one the stylesheet names, and
 * the system font it falls back to has a `0` glyph, so the `ch` check in `metrics` measures a real
 * font and passes. Measured on playbook-app, whose face is served by Google Fonts: one context in
 * two captures of one server under load had every text box 3 to 8 percent wider -- a tab label
 * 141.734px on one side and 148.719px on the other -- and aborting the font host's requests by hand
 * reproduces those widths to the thousandth. Whether that host answers inside the settle is a
 * property of the runner's egress and its load, not of either stylesheet.
 *
 * SO THE BYTES ARE KEPT, as `stubForeignMedia` keeps an image's size and for the same two reasons:
 * the second capture of an A/B cannot get a different answer from the first, and neither can depend
 * on the host having a good minute. The stylesheet is kept as well as the font, because the
 * `@font-face` rules it declares are what decide which file each weight comes from.
 *
 * WRITTEN BY RENAME, because several workers and both sides of an A/B can ask for one url at once,
 * and a reader must never see half a font. A response that does not come back is passed through
 * untouched: the browser's own request fails or succeeds on its own, and a face that fails is
 * caught by `metrics` rather than shot.
 */
async function serveCached(route: Route, directory: string): Promise<void> {
  const base = join(directory, createHash('sha256').update(route.request().url()).digest('hex').slice(0, 32));
  const headers = (contentType: string): Record<string, string> => ({
    'content-type': contentType,
    // A font is a CORS fetch, and a face whose response carries no grant is refused.
    'access-control-allow-origin': '*',
    'cache-control': 'no-store'
  });
  if (existsSync(`${base}.json`) && existsSync(`${base}.body`)) {
    const cached = JSON.parse(readFileSync(`${base}.json`, 'utf8')) as CachedResponse;
    await route.fulfill({ status: 200, headers: headers(cached.contentType), body: readFileSync(`${base}.body`) });
    return;
  }
  const response = await route.fetch().catch(() => null);
  const body = response === null || !response.ok() ? null : await response.body().catch(() => null);
  if (response === null || body === null) {
    await route.fallback();
    return;
  }
  const contentType = response.headers()['content-type'] ?? 'application/octet-stream';
  const temporary = `${base}.${process.pid}.tmp`;
  writeFileSync(temporary, body);
  renameSync(temporary, `${base}.body`);
  writeFileSync(temporary, JSON.stringify({ contentType } satisfies CachedResponse));
  renameSync(temporary, `${base}.json`);
  await route.fulfill({ status: 200, headers: headers(contentType), body });
}

/**
 * `width`/`height` out of a PNG or JPEG header, without decoding the image.
 *
 * Enough of each format to read the one thing that matters: PNG states it in `IHDR`, 16 bytes in;
 * JPEG states it in whichever `SOF` marker the encoder used, which is why this walks the segment
 * chain rather than looking at a fixed offset. `null` for anything else -- a format this does not
 * know is served through unchanged rather than guessed at.
 */
export function imageSize(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let at = 2;
    while (at + 9 < bytes.length) {
      if (bytes[at] !== 0xff) {
        at += 1;
        continue;
      }
      const marker = bytes[at + 1] ?? 0;
      // SOF0..SOF15, except the four that are not frame headers (DHT, JPG, DAC, RST).
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: bytes.readUInt16BE(at + 5), width: bytes.readUInt16BE(at + 7) };
      }
      at += 2 + bytes.readUInt16BE(at + 2);
    }
  }
  return null;
}

/** What one fetch of a foreign image came back with, or `null` when nothing came back at all. */
export interface FetchedImage {
  status: number;
  headers: Record<string, string>;
  body: Buffer;
}

/**
 * What `stubForeignMedia` learned about a foreign image: its size, a real answer that is not one
 * (served as it came back), or nothing it may paint.
 */
export type ImageMeasurement =
  { kind: 'sized'; width: number; height: number } | ({ kind: 'unsized' } & FetchedImage) | { kind: 'unreachable' };

/** How many times a foreign image's size is asked for before its page is reloaded instead. */
const MEASURE_ATTEMPTS = 3;

/** How long to wait before the n-th retry of a measurement: 0.5s, then 1s. */
const MEASURE_BACKOFF_MS = 500;

/**
 * THE SIZE OF A FOREIGN IMAGE, ASKED UNTIL THE HOST GIVES AN ANSWER THAT IS ABOUT THE IMAGE.
 *
 * Nothing coming back, and a 5xx or a 429, are answers about the HOST and its minute: they are
 * asked again, after a pause, and `unreachable` is what is left when every attempt was one. A 2xx
 * that is not a PNG or JPEG, and any other status, are answers about the IMAGE -- the same on every
 * run -- and are returned `unsized` at once, to be served as they came back.
 *
 * `pause` is a parameter so the tests do not wait out the backoff.
 */
export async function measureForeignImage(
  probe: () => Promise<FetchedImage | null>,
  pause: (ms: number) => Promise<void> = async (ms) => new Promise((resolve) => setTimeout(resolve, ms))
): Promise<ImageMeasurement> {
  for (let attempt = 0; attempt < MEASURE_ATTEMPTS; attempt += 1) {
    if (attempt > 0) await pause(MEASURE_BACKOFF_MS * attempt);
    const fetched = await probe();
    if (fetched === null || fetched.status >= 500 || fetched.status === 429) continue;
    const size = fetched.status >= 200 && fetched.status < 300 ? imageSize(fetched.body) : null;
    return size === null ? { kind: 'unsized', ...fetched } : { kind: 'sized', ...size };
  }
  return { kind: 'unreachable' };
}

/**
 * Pages whose CURRENT document asked for a foreign image `stubForeignMedia` could not measure.
 *
 * Kept on this side rather than in the page, because the page cannot tell a refused probe from an
 * image that is broken for real. Cleared by every navigation this module makes (`freshDocument`),
 * since a fresh document asks for every image again.
 */
const unmeasured = new WeakSet<Page>();

/** Mark the page that asked for `request` as carrying an image the harness may not paint. */
export function markUnmeasured(request: Request): void {
  try {
    unmeasured.add(request.frame().page());
  } catch {
    // A request with no frame -- a service worker's -- belongs to no document that is shot.
  }
}

/** Whether `page`'s current document is carrying an image `stubForeignMedia` refused. */
export function hasUnmeasuredImage(page: Page): boolean {
  return unmeasured.has(page);
}

/** Forget the mark, immediately before `page` is given a document that will ask for every image again. */
function freshDocument(page: Page): void {
  unmeasured.delete(page);
}

/**
 * REPLACE EVERY CROSS-ORIGIN IMAGE WITH A FLAT RECTANGLE OF ITS OWN SIZE (ISS-9327).
 *
 * Chromium does not rasterise a downscaled photograph reproducibly. Measured across three captures
 * of one unchanged page, with the config's whole rasteriser-pinning flag list in force and every
 * image loaded and `decode()`d before the shot: the hash differed every time, on five bands of the
 * page, with byte-identical computed styles and the same images in the same order. Within ONE page
 * load three consecutive screenshots are identical, so what varies is which scaled decode Chromium
 * cached during that load -- not something a flag or a longer wait reaches.
 *
 * A photograph is also not a thing a CSS parity harness has a question about. What it has questions
 * about is the BOX: the aspect ratio the image contributes to layout, the radius it is clipped to,
 * the shadow under it, the opacity transition over it. So the bytes are replaced and the box is
 * kept exactly -- an SVG carrying the original's `width`/`height` as its `viewBox` has the same
 * intrinsic dimensions and the same intrinsic ratio, so `h-auto w-full`, `aspect-*` and
 * `object-contain` all resolve to the pixel they did before, and the raster is a solid fill.
 *
 * SAME-ORIGIN IMAGES ARE LEFT ALONE. They are the app's own assets, they are usually small, they
 * are served by the same tree the A/B is judging, and they do not go over a third-party network.
 * The rule is about removing what the harness cannot reproduce and cannot ask a question about,
 * not about removing images.
 *
 * CROSS-ORIGIN VIDEO IS ABORTED rather than stubbed, for the same reason with a blunter
 * instrument. A `<video>` with no poster and `preload="metadata"` paints whichever frame the
 * decoder happened to reach, which varies between page loads exactly as a downscaled photograph
 * does -- measured at 9 of 9 shots differing across two captures of one unchanged page after the
 * image stub had made every other page stable. There is no cheap stub for a media stream, and none
 * is needed: with the request refused the element paints its empty state, and the box the
 * stylesheet decides is untouched.
 *
 * THE SIZE IS LEARNED ONCE AND CACHED ON DISK, so the second capture of an A/B does not re-fetch
 * the images and -- more importantly -- cannot learn a different answer if the host has a bad
 * minute. An image the host answered with something that is not a PNG or JPEG -- another format, a
 * 404 -- is served exactly as it came back, which is the same answer on every run.
 *
 * AN IMAGE THAT CANNOT BE MEASURED AT ALL IS NEVER PAINTED (ISS-15866). Whether the host answers
 * the probe is a property of its minute and of the runner's load, not of the page, so passing the
 * request through painted the real photograph on the capture that found the cache cold and the stub
 * on the one that found it warm -- measured on hackathon as every state of one page differing in an
 * A/A. So the probe is asked again (`measureForeignImage`), and an image still unmeasured is
 * refused and its page marked: `metrics` reads the mark as `stale`, the document is reloaded and the
 * shot retaken, and a page whose image never answers is dropped rather than shot -- exactly what a
 * face that failed to arrive is. See `serveCached` for the same rule applied to a font.
 */
async function stubForeignMedia(context: BrowserContext, baseUrl: string): Promise<void> {
  const origin = new URL(baseUrl).origin;
  const directory = cacheDir();
  mkdirSync(directory, { recursive: true });

  const responses = join(directory, 'responses');
  mkdirSync(responses, { recursive: true });

  await context.route('**/*', async (route) => {
    const request = route.request();
    const foreign = !request.url().startsWith(origin);
    if (foreign && request.resourceType() === 'media') {
      await route.abort();
      return;
    }
    if (foreign && request.method() === 'GET' && CACHED_TYPES.has(request.resourceType())) {
      await serveCached(route, responses);
      return;
    }
    if (!foreign || request.resourceType() !== 'image') {
      await route.fallback();
      return;
    }
    const file = join(directory, `${createHash('sha256').update(request.url()).digest('hex').slice(0, 32)}.json`);
    const size = await (async (): Promise<ImageMeasurement> => {
      if (existsSync(file)) return { kind: 'sized', ...(JSON.parse(readFileSync(file, 'utf8')) as { width: number; height: number }) };
      const measured = await measureForeignImage(async () => {
        const response = await route.fetch().catch(() => null);
        const body = response === null ? null : await response.body().catch(() => null);
        return response === null || body === null ? null : { status: response.status(), headers: response.headers(), body };
      });
      if (measured.kind === 'sized') writeFileSync(file, JSON.stringify({ width: measured.width, height: measured.height }));
      return measured;
    })();
    if (size.kind === 'unreachable') {
      markUnmeasured(request);
      await route.abort('failed');
      return;
    }
    if (size.kind === 'unsized') {
      // The body is already decoded, so the host's `content-encoding` and `content-length` would lie about it.
      const contentType = size.headers['content-type'] ?? 'application/octet-stream';
      await route.fulfill({ status: size.status, headers: { 'content-type': contentType, 'cache-control': 'no-store' }, body: size.body });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      headers: { 'cache-control': 'no-store' },
      body:
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" ` +
        `viewBox="0 0 ${size.width} ${size.height}"><rect width="100%" height="100%" fill="#8a8a8a"/></svg>`
    });
  });
}

/**
 * COOKIES TO PLANT BEFORE THE FIRST NAVIGATION, from `VISUAL_COOKIES` (ISS-9329).
 *
 * A `{"NAME":"value"}` JSON object, scoped to the base url. Unset is the ordinary case and plants
 * nothing, so a repo whose captured pages are all public is untouched by this.
 *
 * IT HAS TO BE A COOKIE ON THE CONTEXT, and that is the whole reason it is here rather than in a
 * repo's own page list. A session cookie in these apps is `httpOnly`, so an init script cannot
 * write one; and it has to ride the VERY FIRST request, because the guard that redirects a
 * signed-out visitor to the login form runs in the page's server load. Anything later captures the
 * login form under the guarded route's name -- the worst kind of coverage, a number that grows
 * while the thing it counts is not there. lakeviewsummit-ui is the first repo in this epic whose
 * interesting pages are behind a session: five of its fourteen routes are, and they hold the admin
 * table, the pagination and the status badge, which appear nowhere else in the app.
 *
 * The value is a session id minted by the repo's own playwright fixtures against the backend the
 * capture is running against, so it is meaningless outside that one `dev e2e run` and there is
 * nothing here worth keeping out of a log.
 */
function plantedCookies(baseUrl: string): Cookie[] {
  const raw = process.env['VISUAL_COOKIES'];
  if (raw === undefined || raw === '') return [];
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('visual: VISUAL_COOKIES must be a JSON object of cookie name to value');
  }
  return Object.entries(parsed as Record<string, unknown>).map(([name, value]) => {
    if (typeof value !== 'string') throw new Error(`visual: VISUAL_COOKIES.${name} must be a string`);
    // `url` rather than domain/path: playwright derives both from it, so the pairing cannot be got
    // wrong and a cookie can never be planted for an origin the capture is not talking to.
    return { name, value, url: baseUrl } as unknown as Cookie;
  });
}

/**
 * A context per (theme, viewport), which is also the only way the theme can be set.
 *
 * In an app that has a theme, `app.html` reads `localStorage[THEME_STORAGE_KEY]` in an INLINE
 * script in `<head>`, before SvelteKit boots, and sets `data-theme` from it. So the theme has to
 * be in storage before the first byte of the document runs — an init script is the only hook early
 * enough, and setting it after navigation would capture the page mid-swap. An app that has no
 * theme ignores the key and renders both contexts identically; see `matrix.ts`.
 *
 * THE KEY ITSELF IS REPO-SPECIFIC and is declared BELOW this region, as `THEME_STORAGE_KEY`,
 * because it is the app's own key and not the harness's: the apps do not agree on one, and each
 * states its own beside that declaration. Naming a key HERE is what kept the repos that differ
 * out of this region, and out of every determinism fix the region has had since.
 */
export async function themedContext(browser: Browser, theme: ThemeName, viewport: Viewport, baseUrl: string): Promise<BrowserContext> {
  const context = await browser.newContext({
    baseURL: baseUrl,
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    colorScheme: 'light',
    // The e2e suite sends this on every request; the dev server ignores it and a live platform needs it.
    extraHTTPHeaders: { 'X-Bypass-Rate-Limit': 'true' }
  });
  const cookies = plantedCookies(baseUrl);
  if (cookies.length > 0) await context.addCookies(cookies);
  await stubForeignMedia(context, baseUrl);
  await context.addInitScript(DETERMINISM_INIT);
  await context.addInitScript(`try { localStorage.setItem(${JSON.stringify(THEME_STORAGE_KEY)}, ${JSON.stringify(theme)}); } catch (e) {}`);
  await context.clock.setFixedTime(FIXED_TIME);
  return context;
}

/**
 * Load every face the document declares, and wait for all of them.
 *
 * `document.fonts.ready` IS NOT ENOUGH ON ITS OWN: it resolves when the loads already IN FLIGHT
 * have finished, so a face the browser has not requested yet leaves it satisfied. `forEach` rather
 * than `Array.from`: `FontFaceSet` is only iterable under the DOM.Iterable lib, which
 * `tsconfig.playwright.json` does not include, and it has a `forEach` regardless.
 */
async function loadDeclaredFaces(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const faces: FontFace[] = [];
    document.fonts.forEach((face) => faces.push(face));
    await Promise.all(faces.map(async (face) => face.load().catch(() => undefined)));
    await document.fonts.ready;
  });
}

/** How long to keep asking for the webfont back before giving up on the shot. */
const FONT_ATTEMPTS = 40;

/** How many times to reload a document that laid itself out against metrics it no longer has. */
const RELOAD_ATTEMPTS = 3;

/**
 * A cheap fingerprint of what the document CONTAINS, for asking whether it moved across the shot.
 *
 * TAG AND CLASS OF EVERY ELEMENT, IN ORDER, hashed to one integer. That is the widest question
 * that can be asked for the price of a single `evaluate`, and it is the right question: a state a
 * hover shot exists to capture is either a node that appeared (a tooltip, a popover, a menu) or a
 * class that toggled, and both move this number. `dumpStyles` asks a far bigger version of the
 * same question and costs a hundred times as much, which is why it is taken once per shot rather
 * than twice.
 *
 * WHAT IT CANNOT SEE is a pure `:hover` pseudo-class -- a button whose only reaction is a CSS rule
 * puts nothing in the DOM, so a pointer that came off it during the raster is invisible here. That
 * is why the raster is given nothing to resize (`fitToDocument`), which is what took the pointer
 * off in the first place, and why a hover that takes its own target out from under the pointer is
 * refused before the shot rather than detected after it (`applyState`).
 *
 * The class attribute is NOT sorted, unlike `dumpStyles`'s. The two readings compared here are of
 * one document seconds apart, so nothing has re-sorted anything in between, and the ORDER moving
 * would itself be a change worth catching.
 */
async function structure(page: Page): Promise<number> {
  return page.evaluate(() => {
    let hash = 0;
    for (const element of Array.from(document.querySelectorAll('*'))) {
      const text = `${element.tagName}.${element.getAttribute('class') ?? ''}|`;
      for (let at = 0; at < text.length; at += 1) hash = (Math.imul(hash, 31) + text.charCodeAt(at)) | 0;
    }
    return hash;
  });
}

/** `100ch` in css pixels, and the `em` it was measured against, for a box created NOW. */
async function freshCh(page: Page): Promise<{ width: number; em: number }> {
  return page.evaluate(
    ({ style }) => {
      const probe = document.createElement('div');
      probe.style.cssText = style;
      document.body.appendChild(probe);
      const width = probe.getBoundingClientRect().width;
      const em = Number.parseFloat(window.getComputedStyle(probe).fontSize);
      probe.remove();
      return { width, em };
    },
    { style: CH_PROBE_STYLE }
  );
}

/** The same measurement for the box that has been in the document since before the first layout. */
async function plantedCh(page: Page): Promise<{ width: number; em: number } | null> {
  return page.evaluate(
    ({ id }) => {
      const probe = document.getElementById(id);
      if (probe === null) return null;
      return { width: probe.getBoundingClientRect().width, em: Number.parseFloat(window.getComputedStyle(probe).fontSize) };
    },
    { id: CH_PROBE_ID }
  );
}

/** The width a `ch` on this page is being resolved with, taken from the oldest box available. */
async function chWidth(page: Page): Promise<number> {
  const planted = await plantedCh(page);
  return planted === null ? (await freshCh(page)).width : planted.width;
}

/**
 * Whether any face the document declares FAILED to load.
 *
 * A failed face is not retried by the document that declared it, and the text it was for is laid
 * out on whatever the family list falls back to -- which the `ch` probe cannot tell from the real
 * face when the fallback has a `0` glyph, as every system font does. See `serveCached` for the
 * measurement. Only a fresh document asks for the face again, so this reads as `stale`.
 */
async function faceFailed(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    let failed = false;
    document.fonts.forEach((face) => {
      if (face.status === 'error') failed = true;
    });
    return failed;
  });
}

/** What the page's font-relative units are currently resolving against. See `metrics`. */
type Metrics = 'ok' | 'no-face' | 'stale';

/**
 * Whether a `ch` on this page means what the stylesheet says it means, RIGHT NOW.
 *
 * TWO DIFFERENT FAILURES, separated because only one of them can be waited out.
 *
 * `no-face` is the momentary one. A box created NOW measures `100ch` as exactly `50em`, and 0.5em
 * is not a font metric: it is what CSS says `ch` means when there is no `0` glyph to measure, so
 * the browser has no face at all at this instant. It comes back — a full-page screenshot
 * rasterises a document twelve thousand pixels tall and the face does not survive every one of
 * them — and `awaitMeasurable` waits for it. 100ch against 50em is a comparison with six ems of
 * daylight in it for this console's Hanken Grotesk (0.56em per `ch`), and the probe inherits
 * `<body>`'s font, so it asks about the font the page is actually set in.
 *
 * `stale` is the permanent one, and it is the failure a fresh probe ALONE cannot see. The box
 * created now measures a real face and the box that has been in the document since before the
 * first layout does not agree with it: Chromium resolves a font-relative unit at layout and keeps
 * the result, so the document is carrying widths it can no longer reproduce. Every `max-width:
 * 88ch` on that page is wrong, waiting does not fix it and neither does loading the face — the
 * resolution has already been made. Only a fresh document has none. A face that FAILED to load is
 * `stale` too, and asked first: the document will not fetch it again, and the probe measures the
 * fallback's `0` as happily as the real one's. See `faceFailed`. So is a document carrying a foreign
 * image the harness could not measure and refused, which only a fresh document asks for again. See
 * `stubForeignMedia`.
 *
 * A document with no planted probe can only be asked the first question and is answered on that.
 */
async function metrics(page: Page): Promise<Metrics> {
  if (hasUnmeasuredImage(page)) return 'stale';
  if (await faceFailed(page)) return 'stale';
  const fresh = await freshCh(page);
  if (Math.abs(fresh.width - fresh.em * 50) <= 0.5) return 'no-face';
  const planted = await plantedCh(page);
  if (planted !== null && Math.abs(planted.width - fresh.width) > 0.5) return 'stale';
  return 'ok';
}

/**
 * Keep asking for the face back, and say what the page settled on.
 *
 * `stale` is returned the moment it is seen rather than retried: reloading every face is exactly
 * what does not repair a resolution the document has already made, so spending ten seconds on it
 * would only delay the reload that does.
 */
async function awaitMeasurable(page: Page): Promise<Metrics> {
  for (let attempt = 0; attempt < FONT_ATTEMPTS; attempt += 1) {
    const state = await metrics(page);
    if (state !== 'no-face') return state;
    await loadDeclaredFaces(page);
    await page.waitForTimeout(SETTLE_MS);
  }
  return 'no-face';
}

/**
 * Every image decoded, and every `<video>` poster fetched, before a shot is taken (ISS-9327).
 *
 * `networkidle` IS BLIND TO A LAZY IMAGE, which is the failure this exists for. `loading="lazy"`
 * means the browser has not requested the image at all while it is below the fold, so the network
 * genuinely is idle -- and then playwright's full-page screenshot resizes the viewport to the whole
 * document, which brings those images into view and starts the requests after every wait has
 * already returned. Whether a given one arrived before the raster is a coin flip on the network.
 *
 * DECODED, NOT MERELY LOADED. `complete` turns true when the bytes are in; the first paint that
 * needs the bitmap can still be a frame later, and `decode()` is the documented way to wait for the
 * bitmap rather than for the transfer.
 *
 * A POSTER IS FETCHED THROUGH A DETACHED `Image` because a `<video>` exposes no load event for it,
 * and the browser serves the second request from cache.
 *
 * Forcing `loading` eager changes an attribute and no computed style, so the style dump is
 * unaffected -- and it is applied identically to both sides of an A/B, like everything else here.
 */
async function awaitMedia(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    for (const image of images) image.loading = 'eager';
    const posters = Array.from(document.querySelectorAll('video'))
      .map((video) => video.poster)
      .filter((poster) => poster !== '')
      .map(
        async (poster) =>
          new Promise<void>((resolve) => {
            const preload = new Image();
            preload.onload = () => resolve();
            preload.onerror = () => resolve();
            preload.src = poster;
          })
      );
    const loads = images.map(
      async (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        })
    );
    await Promise.all([...loads, ...posters]);
    await Promise.all(images.map(async (image) => image.decode().catch(() => undefined)));
  });
}

/**
 * Navigate and wait until the page has stopped changing.
 *
 * THE DOCUMENT IS RELOADED IF IT LAID ITSELF OUT AGAINST METRICS IT NO LONGER HAS. Chromium
 * resolves a font-relative unit at FIRST LAYOUT and does not re-resolve it when a face arrives
 * afterwards, so a face that loses that race decides the width of a whole page permanently --
 * loading every face and waiting for it, which is what `loadDeclaredFaces` does, comes too late to
 * undo a resolution already made. Measured on the decision detail page, whose `max-width: 88ch`
 * resolved to 665.28px where the webfont won the race and to 594px -- exactly `0.5em`, which is
 * what `ch` means when the font has no `0` glyph to measure -- in one capture out of five, on one
 * of its six contexts, and stayed there for the shot that was then taken.
 *
 * A BOX CREATED NOW CANNOT SEE THAT, and that is the whole reason for the planted one: it resolves
 * `ch` correctly because it is being laid out correctly, at the same instant the page around it is
 * still wrong. So the comparison is between a box that has been in the document since before the
 * first layout and a box created after the faces are in: they agree when the first layout had the
 * face, and disagree exactly when the page is carrying a resolution it can no longer reproduce.
 *
 * The repair is a reload, not a nudge: a fresh document has no stale resolution to keep, and by
 * then the face is in the CONTEXT's HTTP cache, so the race is one the second load does not
 * usually lose. Three tries, and then the page is dropped rather than shot -- a missing key is a
 * compare failure, which is loud and correct, and a shot recorded against fallback metrics is a
 * difference the next A/B blames on a stylesheet.
 *
 * Returns false when the page never reached a quiet state. A THROW WOULD BE WRONG HERE: one route
 * that will not settle must not lose the other 800 shots. What the caller does with the false is
 * `settledPage` below -- try again, and then record the loss as a DROPPED rendering, which fails
 * the capture by name rather than leaving the compare to report 62 shots present on one side only
 * and blame a stylesheet for the runner's load (ISS-9985).
 *
 * `timeoutMs` bounds each navigation and each load-state wait separately rather than the call as a
 * whole, which is what playwright's own timeouts are and is why there is no single number here for
 * how long a settle can take. `VISUAL_SETTLE_TIMEOUT_MS` sets it; `settledPage` raises it per
 * attempt.
 */
export async function settle(page: Page, path: string, timeoutMs = SETTLE_TIMEOUT_MS): Promise<boolean> {
  try {
    freshDocument(page);
    watchDocuments(page);
    await page.goto(path, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    if (await quiet(page, timeoutMs)) return true;
    console.warn(
      `visual: ${path} did not settle: its webfont never loaded, a foreign image never answered its size probe, or the server kept replacing the document, in ${RELOAD_ATTEMPTS} document(s)`
    );
    return false;
  } catch (error) {
    // Which wait ran out is what tells the runner's load from a page that is broken, so it is said.
    console.warn(`visual: ${path} did not settle within ${timeoutMs}ms: ${String(error).split('\n')[0]}`);
    return false;
  }
}

/**
 * How many documents one theme/viewport context may need before it is given up on.
 *
 * A FIRST ATTEMPT AT A CONTEXT THAT PRODUCED NOTHING IS NOT THE RETRY `playwright.visual.config.ts`
 * FORBIDS. "NO RETRIES, EVER" is about re-rendering a shot that already succeeded -- a shot that
 * only matched on the second try proves the opposite of what it is recorded as, so the harness must
 * never take one. Nothing was rendered here: the context produced no bytes, no key and no row, and
 * a second navigation is the harness's first sample of it rather than its second opinion.
 *
 * TWO, AND THE SECOND ONE IS SLOWER (`SETTLE_RETRY_FACTOR`). The measured cause is the runner's
 * load, and load on a box running a 37-minute capture is sustained rather than a spike -- so a
 * retry at the identical deadline is the same coin weighted the same way, which is worth very
 * little. Doubling the deadline is what addresses the thing that actually happened.
 *
 * THE COST IS BOUNDED AND IS PAID ONLY ON FAILURE. A context that settles never reaches any of
 * this. A context that never will costs `timeout * (1 + 2)` before it is recorded, and six of them
 * -- a page that is wholly broken -- costs about nine minutes against a floor budget of thirteen,
 * so the page still writes its shard and still names what it lost. A page whose test dies without
 * writing one is recorded by `merge.ts` instead, at `page` scope.
 */
export const SETTLE_ATTEMPTS = 2;

/** What attempt N's deadline is multiplied by: 1x, then 2x. */
const SETTLE_RETRY_FACTOR = 2;

/**
 * A page of `context`, navigated to `path` and quiet, or `null` if it never got there.
 *
 * A FRESH DOCUMENT PER ATTEMPT, IN THE SAME CONTEXT. The page is where the failure is -- a
 * navigation that timed out leaves a document part-way through a load, and `goto` on it again
 * inherits whatever it was still waiting for. The CONTEXT is what must not be rebuilt: it carries
 * the theme, the viewport, the pinned clock, the seeded `Math.random`, the cookies and the HTTP
 * cache the faces are now in, all of which the second attempt wants to keep and one of which
 * (the warm face cache) is why a second attempt is faster than the first.
 */
export async function settledPage(context: BrowserContext, path: string): Promise<Page | null> {
  for (let attempt = 0; attempt < SETTLE_ATTEMPTS; attempt += 1) {
    const page = await context.newPage();
    if (await settle(page, path, SETTLE_TIMEOUT_MS * (attempt === 0 ? 1 : SETTLE_RETRY_FACTOR))) return page;
    await page.close();
  }
  return null;
}

/**
 * Everything `settle` does after the navigation, so that a reload can have it too.
 *
 * THE URL IS WAITED ON LAST (ISS-9327). A route whose load issues a redirect runs that load TWICE
 * -- once on the server, which is the navigation, and once on the client after hydration, which is
 * a second navigation at an unpredictable moment well after `networkidle` and the fonts have gone
 * quiet. Caught on hackathon's `/`, which redirects to the current year: the shot was taken, and
 * the `document.scrollWidth` read immediately after it died with `Execution context was destroyed,
 * most likely because of a navigation`. A shot that survived that race would be worse -- a
 * screenshot of a page that no longer exists, recorded under the redirecting route's key.
 *
 * QUIET IS A PROPERTY OF ONE DOCUMENT (ISS-15888). A reload the dev server sends in the middle of
 * the wait leaves the url where it was and every wait already passed answering about the document
 * it replaced, so the page would be called settled while it is an empty shell. A wait whose
 * document was replaced under it is therefore started again on the new one, and the document that
 * finally answers is recorded as the one every shot of this page is of (`refuseIfNavigated`).
 */
async function quiet(page: Page, timeoutMs: number): Promise<boolean> {
  for (let replaced = 0; replaced < RELOAD_ATTEMPTS; replaced += 1) {
    const settled = await quietOnce(page, timeoutMs);
    if (settled === null) return false;
    if (documentOf(page) === settled) {
      settledDocuments.set(page, settled);
      return true;
    }
    console.warn(`visual: ${page.url()} was replaced by a new document while it settled; settling that one instead`);
  }
  return false;
}

/**
 * `quiet` on whichever document the page is showing, answering WHICH document that was -- the
 * count after the last navigation this function made itself -- or `null` if it never got quiet.
 */
async function quietOnce(page: Page, timeoutMs: number): Promise<number | null> {
  // The document the caller navigated to, moved on only by a reload this function makes itself, so
  // that a document SOMETHING ELSE asked for, at any point in the wait, counts as a replacement.
  let document = documentOf(page);
  for (let attempt = 0; ; attempt += 1) {
    await page.waitForLoadState('networkidle', { timeout: timeoutMs });
    await hydrated(page, timeoutMs);
    await loadDeclaredFaces(page);
    await page.waitForLoadState('networkidle', { timeout: timeoutMs });
    if ((await awaitMeasurable(page)) !== 'stale') break;
    if (attempt + 1 >= RELOAD_ATTEMPTS) return null;
    freshDocument(page);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: timeoutMs });
    document = documentOf(page);
  }
  await awaitMedia(page);
  await page.waitForLoadState('networkidle', { timeout: timeoutMs });
  await canonicalize(page);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.waitForTimeout(SETTLE_MS);

  for (let attempt = 0; attempt < RELOAD_ATTEMPTS; attempt += 1) {
    const before = page.url();
    await page.waitForTimeout(SETTLE_MS);
    if (page.url() === before) break;
    await page.waitForLoadState('networkidle', { timeout: timeoutMs });
    await loadDeclaredFaces(page);
  }
  return document;
}

/**
 * The element SvelteKit's root component mounts in its own `onMount`, so its presence says the
 * document has hydrated. Every repo this harness is copied into is a SvelteKit app and none turns
 * client-side rendering off, so every page it captures mounts one.
 */
const HYDRATED_MARKER_ID = 'svelte-announcer';

/**
 * Wait until SvelteKit has hydrated the document.
 *
 * `networkidle` IS NOT HYDRATION. It says the module graph has finished FETCHING; evaluating it
 * and mounting the root come after, on the main thread, and a document can be shot in between as
 * the server rendered it. Measured on rallyd's A/A (ISS-15877): a page the dev server reloaded under
 * the capture was shot with the footer's year from the server's clock rather than the pinned one,
 * and no `#svelte-announcer`, while every other shot of the same page carried both. A page that
 * never hydrates times out here, and `settle` records it as a page that did not settle.
 */
async function hydrated(page: Page, timeoutMs: number): Promise<void> {
  await page.waitForFunction((id) => document.getElementById(id) !== null, HYDRATED_MARKER_ID, { timeout: timeoutMs });
}

/**
 * THE ORDER THE DEV SERVER'S STYLESHEETS ARE PUT IN BEFORE A SHOT, given the ids they carry
 * (ISS-15642).
 *
 * VITE'S DEV CLIENT ORDERS THEM BY TIMING. Each CSS module calls `updateStyle` when it evaluates,
 * and that appends a `<style data-vite-dev-id>` to `<head>` -- chained after the previous one only
 * until a `setTimeout(0)` fires, at the end of the head after it. SvelteKit loads the root layout's
 * node and the page's node CONCURRENTLY, and a page load that does not call `parent()` goes on to
 * import its own components without waiting for the layout. So whether the global stylesheet the
 * layout imports lands before or after a page component's stylesheet is decided by which module
 * graph finished fetching first, and under load either one can.
 *
 * THAT DECIDES THE CASCADE WHEREVER TWO RULES TIE ON SPECIFICITY, which a global `.field .hint`
 * and a component's scoped `.hint.svelte-xyz` do. Measured on playbook-admin's undo-confirm
 * preview, one server, one page: the hint rendered at 12px with app.css arriving first and at
 * 12.5px with app.css held back three seconds -- and the A/A gate it broke differed on 35 shots
 * across three pages, every one a hover state, a font size or a chip border, with nothing changed
 * in between.
 *
 * THE CANONICAL ORDER IS THE ONE A PRODUCTION BUILD GIVES: plain stylesheets first, component
 * styles after, so a component wins a tie against the global sheet as it does when the layout's CSS
 * is linked ahead of the page's. A component style is told apart by its id carrying a query -- vite
 * names one `<file>?svelte&type=style&lang.css` (or `?vue&...`), and a plain file has none. Within
 * each group the order is the id's, which is what makes it the same on every run: two captures of
 * one tree carry the same ids, and two working trees of an A/B differ only in a shared prefix.
 *
 * A capture of a production build has no `data-vite-dev-id` element at all, so this is a no-op
 * there: its order was never the dev client's to decide.
 */
export function canonicalStyleOrder(ids: readonly string[]): string[] {
  const byId = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
  const plain = ids.filter((id) => !id.includes('?')).sort(byId);
  const component = ids.filter((id) => id.includes('?')).sort(byId);
  return [...plain, ...component];
}

/**
 * Put the page into the state a shot is allowed to depend on: the dev server's stylesheets in
 * `canonicalStyleOrder`, and every inner scroller at its origin (ISS-15642).
 *
 * THE STYLESHEETS ARE MOVED AS ONE BLOCK to where the first of them stood, and only when they are
 * out of order -- a move is a whole-document style recalc, and the usual page is already in order.
 *
 * AN INNER SCROLLER'S OFFSET IS HISTORY, NOT STYLE. A chat thread that sets `scrollTop` to its
 * `scrollHeight` on mount keeps whatever offset that produced, and anything that grows the thread
 * afterwards -- a face, an image, a late stylesheet -- leaves it short of the bottom by an amount
 * that depends on when it arrived. Measured on the issue-chat preview: the turns column stopped at
 * 308px of 454 on one load and 332px on the next with a font held back, with identical computed
 * styles, and that offset then held for every shot of the context. The ORIGIN is the one position
 * that no history can reach differently, so every element but the document's own scroller is put
 * there. The document is left alone, as `focus` and `hover` leave it: the harness never scrolls it.
 *
 * Called at the end of every settle, so the hover targets are measured against the page the shot
 * will show, and again inside `screenshotFrozen`, because a state change can mount a component
 * whose stylesheet arrives with it.
 */
async function canonicalize(page: Page): Promise<void> {
  const ids = await page.evaluate(() =>
    Array.from(document.head.querySelectorAll('style[data-vite-dev-id]')).map((style) => style.getAttribute('data-vite-dev-id') ?? '')
  );
  const order = canonicalStyleOrder(ids);
  if (order.some((id, at) => id !== ids[at])) {
    await page.evaluate((wanted) => {
      const styles = Array.from(document.head.querySelectorAll('style[data-vite-dev-id]'));
      const first = styles[0];
      if (first === undefined) return;
      const marker = document.createComment('visual-style-order');
      first.before(marker);
      const byId = new Map(styles.map((style) => [style.getAttribute('data-vite-dev-id') ?? '', style]));
      for (const id of wanted) {
        const style = byId.get(id);
        if (style !== undefined) marker.before(style);
      }
      marker.remove();
    }, order);
  }
  await page.evaluate(() => {
    for (const element of Array.from(document.querySelectorAll('*'))) {
      if (element === document.scrollingElement || element === document.body) continue;
      if (element.scrollTop !== 0) element.scrollTop = 0;
      if (element.scrollLeft !== 0) element.scrollLeft = 0;
    }
  });
}

/** A fresh document of the same url, for a page that is carrying a resolution it cannot reproduce. */
async function reload(page: Page): Promise<boolean> {
  try {
    freshDocument(page);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: SETTLE_TIMEOUT_MS });
    return await quiet(page, SETTLE_TIMEOUT_MS);
  } catch {
    return false;
  }
}

/** What a `hover` shot can be taken on: the elements a `hover:` rule reaches. */
const HOVER_SELECTOR = 'button, [role="button"], a[href]';

/** What a `focus` shot can be taken on: `HOVER_SELECTOR` plus every form control. */
const FOCUS_SELECTOR = 'input:not([type=hidden]), select, textarea, [contenteditable="true"], button, a[href]';

/**
 * How many `hover` shots this page offers at this viewport, and how many it would offer uncapped.
 *
 * ONE SHOT PER ELIGIBLE ELEMENT, NOT ONE PER PAGE. The first eligible element in document order is
 * deterministic -- which is why it was the original choice -- and it is almost never the affordance
 * a `hover:` rule is about: a form puts its decoration before its submit. Measured on account,
 * where every login-shaped page put the pointer on a 20x20 password-visibility toggle: a change to
 * the primary button's hover colour moved 6 of 126 shots, and the other 24 button-bearing hover
 * shots reported equal -- correctly, and uselessly. The harness would have reported the same number
 * with the change reverted on four of the five pages, which is the sentence this exists to stop
 * anybody being able to write (ISS-9603).
 *
 * THE INDEX IS THE KEY, and it is exactly as stable as the single target it replaces. An element
 * inserted before another changes what the later indices point at -- a `target` change on a key
 * both captures hold, which the manifest records and `compare.ts` prints. An element added past the
 * end is a key present on one side only, which is a compare failure: the loudest outcome available,
 * and the right one.
 *
 * `limit` bounds the count, because the shots are full-page PNGs and a page carrying a forty-link
 * nav would otherwise multiply the whole capture by forty. `total` comes back alongside it so the
 * shortfall is REPORTED in the manifest rather than being a smaller number nobody notices.
 */
export async function hoverTargetCount(page: Page, limit: number): Promise<{ shots: number; total: number }> {
  return throughNavigation(page, async () => {
    // Counted on the page `applyState` will act on: fitted to the document, with the targets
    // chosen above the fold. A count taken on any other layout can disagree with it.
    await fitToDocument(page);
    const total = await page.evaluate(
      ({ selector, fold }) => {
        // The eligibility test `applyState` applies, counted rather than acted on. Written twice
        // because both copies run INSIDE the page, where nothing this module defines exists.
        let count = 0;
        for (const element of Array.from(document.querySelectorAll(selector))) {
          if ((element as HTMLInputElement).disabled) continue;
          const rect = element.getBoundingClientRect();
          const onScreen =
            rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0 && rect.bottom <= fold.height && rect.right <= fold.width;
          if (onScreen) count += 1;
        }
        return count;
      },
      { selector: HOVER_SELECTOR, fold: foldOf(page) }
    );
    // The count decides the context's KEY SET and is kept across a re-settle, so a count taken off
    // a document that was replaced under it -- an empty shell, offering nothing -- must not escape.
    refuseIfReplaced(page);
    return { shots: Math.min(total, limit), total };
  });
}

/**
 * The viewport each page was opened at, which is the FOLD every state's target is chosen above.
 *
 * KEPT RATHER THAN READ, because `fitToDocument` changes the viewport for the length of every shot
 * and `window.innerHeight` then answers with the whole document. The first harness call on a page
 * is made at the context's own viewport, so that is what is remembered.
 */
const folds = new WeakMap<Page, { width: number; height: number }>();

function foldOf(page: Page): { width: number; height: number } {
  const known = folds.get(page);
  if (known !== undefined) return known;
  const viewport = page.viewportSize();
  if (viewport === null) throw new Error('visual: a capture page has no viewport; themedContext always sets one');
  folds.set(page, viewport);
  return viewport;
}

/** What each page measured at its fold, which is the viewport every shot of it is taken at. */
const fitted = new WeakMap<Page, { width: number; height: number }>();

/**
 * Make the viewport the document's own size, BEFORE a state is applied to it.
 *
 * A FULL-PAGE SCREENSHOT OF A DOCUMENT TALLER THAN THE VIEWPORT RESIZES THE VIEWPORT FOR THE RASTER.
 * Playwright passes `captureBeyondViewport` to Chromium, which re-lays the page out at the
 * document's size, shoots, and puts it back -- and every one of those layouts re-decides what is
 * under the pointer. A hover is lost there and, because the pointer never moves again, stays lost
 * or comes back depending on how far the raster got before the next frame. Measured on
 * playbook-app's team-hub-tab: the boundary events of one raster were `mouseout` from the hovered
 * chip, `mouseover` of its row, `resize`, and back again, and two captures of one server
 * disagreed on that shot by exactly that. A page that mounts a node on hover tears it down in the
 * same gap, which is the `disturbed` retake loop in `captureShot`; on a loaded runner the retakes
 * ran out.
 *
 * SO THE RESIZE HAPPENS FIRST, WHILE THERE IS NO STATE FOR IT TO DESTROY. The page is measured at
 * the fold exactly as playwright measures it for a full-page shot, and given a viewport of that size;
 * `screenshotFrozen` then shoots the viewport, which needs no resize. That is the shot a full-page
 * screenshot always took -- the page laid out at the size it measured at the fold, clipped to that
 * size -- and only the order has changed: resize, then state, then raster.
 *
 * THE CLIP IS THE MEASURED SIZE, NOT THE DOCUMENT'S SIZE AFTER THE FIT, because a page sized
 * against its own viewport grows when the viewport does. Every `/dev-viz` page is: its shell is
 * `min-height: 100dvh` under a header, so the document is always the viewport plus the header, and
 * fitting the viewport to that document again never converges. A full-page screenshot clipped it
 * at the measured size as well.
 *
 * MEASURED ONCE PER DOCUMENT, BEFORE IT HAS EVER BEEN RESIZED, and kept. A document shrunk back to
 * the fold does not answer honestly for several frames: an element already laid out against
 * `100dvh` keeps the old viewport's height after `innerHeight` and a freshly created `100dvh` box
 * both report the new one. Measured on team-approval-group at tablet width, the document read
 * 1448px for three frames after shrinking from 1400 to 1024 and 1256px from then on; two A/A
 * captures that measured after every shot disagreed by exactly the shell's header on 30 shots. The
 * size of the document at the fold is a property of the page, so the first reading -- taken on a
 * page that has been at the fold since it loaded -- is the one every later shot uses. A reload in
 * `captureShot` keeps it: the reloaded page is the same page.
 */
async function fitToDocument(page: Page): Promise<void> {
  let size = fitted.get(page);
  if (size === undefined) {
    const fold = foldOf(page);
    await resizeTo(page, fold);
    const measured = await stableDocumentSize(page);
    size = { width: Math.max(measured.width, fold.width), height: Math.max(measured.height, fold.height) };
    fitted.set(page, size);
  }
  await resizeTo(page, size);
}

/** How many frame pairs a document's size may keep changing for after a resize before it is taken. */
const SIZE_READS = 10;

/**
 * Give the page `size` and return once it is laid out at it, with two frames for anything that
 * resizes itself in a `ResizeObserver` to have run.
 */
async function resizeTo(page: Page, size: { width: number; height: number }): Promise<void> {
  const current = page.viewportSize();
  if (current !== null && current.width === size.width && current.height === size.height) return;
  await page.setViewportSize(size);
  await page.waitForFunction(({ width, height }) => window.innerWidth === width && window.innerHeight === height, size, {
    timeout: SETTLE_TIMEOUT_MS
  });
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

/**
 * Playwright's own full-page size (`_fullPageSize`), read until two readings two frames apart
 * agree: a chart that redraws from a `ResizeObserver` can take more than one frame to settle on a
 * height, and a size read in the middle of that is a different clip on every run.
 */
async function stableDocumentSize(page: Page): Promise<{ width: number; height: number }> {
  const read = async (): Promise<{ width: number; height: number }> =>
    page.evaluate(async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const body = document.body as HTMLElement | null;
      const root = document.documentElement;
      return {
        width: Math.max(
          body?.scrollWidth ?? 0,
          root.scrollWidth,
          body?.offsetWidth ?? 0,
          root.offsetWidth,
          body?.clientWidth ?? 0,
          root.clientWidth
        ),
        height: Math.max(
          body?.scrollHeight ?? 0,
          root.scrollHeight,
          body?.offsetHeight ?? 0,
          root.offsetHeight,
          body?.clientHeight ?? 0,
          root.clientHeight
        )
      };
    });
  let size = await read();
  for (let attempt = 0; attempt < SIZE_READS; attempt += 1) {
    const next = await read();
    if (next.width === size.width && next.height === size.height) return next;
    size = next;
  }
  return size;
}

/**
 * How finely `applyState` searches a hover target's box for a point that is over it, per side.
 *
 * THE CENTRE OF THE BOX IS OFTEN NOT ON THE ELEMENT. A donut segment's box is centred in the hole
 * (financial's "Open Play" band), and a link that wraps onto two lines is centred in the gap
 * between its line boxes (team-trust's activity rows) -- so a pointer sent to the centre hovers
 * the background, and the shot filed as that element's hover is a shot of nothing in particular.
 * Each line box's centre is tried first, then an eight-by-eight grid over the box, in a fixed
 * order, so the point chosen is the same on every run of the same layout.
 */
const HOVER_GRID = 8;

/** Where `applyState` keeps the element it hovered, for the fixed-point check after the settle. */
const HOVER_TARGET_KEY = '__visual_hover_target__';

/**
 * THE KEY PRESSED IMMEDIATELY BEFORE EVERY `focus`, so the focus is a keyboard focus (ISS-15883).
 *
 * Chromium decides whether a scripted `focus()` matches `:focus-visible` from the document's input
 * history: a keydown since the last pointer press makes it match, a pointer press makes it not. That
 * history is the harness's own earlier states and whatever the page did on load, so the ring was a
 * coin the page did not flip. A keydown pins it. Shift, because a keydown carrying Control, Alt or
 * Meta is a shortcut rather than keyboard navigation and does NOT set the modality, measured; and
 * because Shift on its own has no default action and moves no focus, as Tab would. Not
 * `FocusOptions.focusVisible`: measured honoured by Chromium 151 and ignored by Chromium 141, and
 * these repos pin different playwright versions, so it would pin the ring in some copies only.
 */
export const KEYBOARD_MODALITY_KEY = 'Shift';

/**
 * Put the page into `state`, and say what it was applied to.
 *
 * BOTH TARGETS ARE CONSTRAINED TO THE FOLD, the viewport the page was opened at, and are chosen in
 * document order among elements that are visible and enabled. The page is fitted to the document
 * by then (`fitToDocument`), so `window.innerHeight` is the whole document and is not the test.
 * Playwright's own `focus()`/`hover()` scroll the element into view, which would move a fixed
 * header inside the very screenshot being compared; `hover` is therefore a raw mouse move to the
 * element's centre, and `focus` passes `preventScroll`. `focus` is a KEYBOARD focus, so that it
 * draws the `:focus-visible` ring on every run; see `KEYBOARD_MODALITY_KEY`.
 *
 * `index` SKIPS THAT MANY ELIGIBLE ELEMENTS FIRST, which is how `hover` becomes one shot per
 * element rather than one per page: `hoverTargetCount` says how many there are and `parity.spec.ts`
 * walks them, keying each one `hover-<index>`. `focus` is only ever asked for index 0 -- a form's
 * first control is the affordance a focus ring is about, and the same is not true of its first
 * button.
 *
 * `none` is a legitimate answer — a page with no button has no hover state — and it is recorded in
 * the manifest rather than hidden, because "the same page offered a different target after the
 * upgrade" is itself a finding. Two failures can come back instead:
 *
 *   - `metrics`: a `ch` on this page does not currently mean what the stylesheet says it means,
 *     so there is nothing honest to record. `captureShot` reloads and asks again. See `metrics`.
 *   - `unstable`: the hover is not a FIXED POINT. Once the page has settled, either the target is
 *     no longer `:hover` or the pointer is no longer over it -- the `hover:` rule moved the element
 *     out from under the pointer, and the page alternates between the two layouts on every frame
 *     that re-decides what is under it. Measured on team-hub-tab's phone filter chips, where
 *     hovering a chip reveals its "only" link, the chip wraps onto the next line, and the pointer
 *     is left over the row. Both halves of that alternation fail the check, on every frame it
 *     is read, so it is the same answer on every run. Retaking cannot repair it and neither can reloading: the state asked for
 *     does not exist to be shot.
 *   - `disturbed`: the target took focus without matching `:focus-visible`, so the shot would be of
 *     a focus with no ring. `captureShot` retakes it, as it does a shot its own raster disturbed.
 *   - `unreachable`: no point of the target inside the fold hits anything at all. A target
 *     covered by another element is NOT this: a chart's marks sit under one transparent plot-wide
 *     hit area that picks the mark from the pointer's position, so the pointer goes to the
 *     target's first point and the fixed-point check is asked of whatever receives it. See
 *     `HOVER_GRID` for how the point is chosen.
 */
export async function applyState(page: Page, state: StateName, index = 0): Promise<string | ShotFailure> {
  if (state === 'rest') return (await awaitMeasurable(page)) === 'ok' ? 'n/a' : 'metrics';

  const selector = state === 'focus' ? FOCUS_SELECTOR : HOVER_SELECTOR;
  if (state === 'focus') await page.keyboard.press(KEYBOARD_MODALITY_KEY);

  const found = await page.evaluate(
    ({ selector: sel, wantFocus, skip, fold, key, grid }) => {
      const describe = (element: Element): string => {
        const id = element.id ? `#${element.id}` : '';
        const testId = element.getAttribute('data-testid');
        return `${element.tagName.toLowerCase()}${id}${testId ? `[data-testid=${testId}]` : ''}`;
      };
      let skipped = 0;
      for (const element of Array.from(document.querySelectorAll(sel))) {
        if ((element as HTMLInputElement).disabled) continue;
        const rect = element.getBoundingClientRect();
        const onScreen =
          rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0 && rect.bottom <= fold.height && rect.right <= fold.width;
        if (!onScreen) continue;
        if (skipped < skip) {
          skipped += 1;
          continue;
        }
        if (wantFocus) {
          (element as HTMLElement).focus({ preventScroll: true });
          // A page that moves focus on its own is shot as it is; one that took the focus without
          // the ring is not the state asked for.
          const ring = document.activeElement !== element || element.matches(':focus-visible');
          return { description: describe(element), x: 0, y: 0, ring };
        }
        // The first point, in a fixed order, at which the pointer is over this element and not
        // over something beside or above it: each line box's centre, then a grid over the box.
        const candidates: [number, number][] = Array.from(element.getClientRects()).map((box) => [
          box.left + box.width / 2,
          box.top + box.height / 2
        ]);
        for (let column = 1; column < grid; column += 1) {
          for (let row = 1; row < grid; row += 1) {
            candidates.push([rect.left + (rect.width * column) / grid, rect.top + (rect.height * row) / grid]);
          }
        }
        const inFold = candidates.filter(([x, y]) => x >= 0 && y >= 0 && x <= fold.width && y <= fold.height);
        const hits = inFold.flatMap(([x, y]) => {
          const hit = document.elementFromPoint(x, y);
          return hit === null ? [] : [{ x, y, hit }];
        });
        // Every point covered is not every point unreachable. A chart's marks sit under one
        // transparent plot-wide hit area that picks the mark from the pointer's position, so what
        // covers the first point IS the mark's hover, and it is what the fixed-point check asks.
        const chosen = hits.find((point) => element.contains(point.hit)) ?? hits[0];
        if (chosen === undefined) return { description: describe(element), x: null, y: null };
        // A property on the window, not an attribute on the element: nothing a selector, the
        // structure fingerprint or the style dump reads can see it.
        (window as unknown as Record<string, unknown>)[key] = element.contains(chosen.hit) ? element : chosen.hit;
        return { description: describe(element), x: chosen.x, y: chosen.y };
      }
      return null;
    },
    { selector, wantFocus: state === 'focus', skip: index, fold: foldOf(page), key: HOVER_TARGET_KEY, grid: HOVER_GRID }
  );

  if (found === null) return 'none';
  if (found.x === null || found.y === null) return 'unreachable';
  if (found.ring === false) return 'disturbed';
  if (state === 'hover') await page.mouse.move(found.x, found.y);
  await page.waitForTimeout(SETTLE_MS);
  if ((await awaitMeasurable(page)) !== 'ok') return 'metrics';
  if (state === 'hover' && !(await hoverHolds(page, { x: found.x, y: found.y }, found.description))) return 'unstable';
  return found.description;
}

/**
 * How many animation frames `hoverHolds` reads before it calls a hover unstable.
 *
 * ONE READ IS A SAMPLE, NOT A VERDICT. Anything still settling when it is taken -- hover state
 * Chromium has not re-resolved yet, a document finishing its hydration -- reads a target that IS a
 * fixed point as broken once, and a single read records it unstable (ISS-15877). A hover that
 * genuinely cancels itself alternates between two layouts that each fail the check, so it fails on
 * EVERY frame, and reading it this many times costs that case nothing but the frames.
 */
export const HOVER_HOLD_FRAMES = 12;

/**
 * Whether the hovered target is still `:hover` AND still under the pointer on any of the next
 * `HOVER_HOLD_FRAMES` animation frames. The target here is what `applyState` held: the element
 * itself, or the element covering it that receives the pointer.
 *
 * BOTH, because each half of a self-cancelling hover fails a different one. While the `hover:` rule
 * is applied the element has moved and the pointer is over something else; once the browser has
 * noticed, the element is back under the pointer and no longer `:hover`. `elementFromPoint` forces
 * the layout the hover state implies, so the reading is of the page as it would be rastered.
 * `contains` rather than equality: the pointer over the icon inside a button is over the button.
 *
 * ONE FRAME PER READ, each read its own `evaluate` after its own `requestAnimationFrame`, so a
 * frame on which the page re-decides what is under the pointer lands between two reads rather than
 * inside one.
 *
 * EACH FAILED READ SAYS WHICH HALF FAILED, and a hover recorded unstable logs every distinct reason.
 * The manifest records only the verdict, and a verdict that differs between two captures of one
 * server is a harness defect that cannot be chased without knowing what the page looked like.
 */
async function hoverHolds(page: Page, at: { x: number; y: number }, description: string): Promise<boolean> {
  const reasons = new Set<string>();
  for (let frame = 0; frame < HOVER_HOLD_FRAMES; frame += 1) {
    const reason = await page.evaluate(
      async ({ x, y, key }) => {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const describe = (element: Element | null | undefined): string => {
          if (element === null || element === undefined) return 'nothing';
          const id = element.id ? `#${element.id}` : '';
          return `${element.tagName.toLowerCase()}${id}`;
        };
        const target = (window as unknown as Record<string, unknown>)[key] as Element | undefined;
        if (target === undefined || !target.isConnected) return 'the target is no longer in the document';
        const hit = document.elementFromPoint(x, y);
        const holdsHover = target.matches(':hover');
        const underPointer = hit !== null && target.contains(hit);
        if (holdsHover && underPointer) return null;
        const hovered = Array.from(document.querySelectorAll(':hover')).at(-1);
        return `${holdsHover ? '' : 'not :hover (hovering ' + describe(hovered) + '); '}${underPointer ? '' : 'pointer over ' + describe(hit)}`;
      },
      { x: at.x, y: at.y, key: HOVER_TARGET_KEY }
    );
    if (reason === null) return true;
    reasons.add(reason);
  }
  console.warn(`visual: ${page.url()} hover on ${description} at (${at.x}, ${at.y}) never held: ${Array.from(reasons).join(' | ')}`);
  return false;
}

/** Undo whatever `applyState` did, so the next state starts from rest rather than from the last one. */
export async function clearState(page: Page): Promise<void> {
  return throughNavigation(page, async () => {
    await page.mouse.move(-1, -1);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.waitForTimeout(SETTLE_MS);
  });
}

/**
 * Every rendered element's full computed style, interned.
 *
 * THE PROPERTY LIST COMES FROM ONE ELEMENT and is then read by name off every other. Chromium's
 * enumeration includes registered custom properties, and those are inherited, so in practice every
 * element answers the same list — but reading by name rather than by index is what makes that an
 * assumption the data does not depend on.
 *
 * CLASS TOKENS ARE SORTED. The upgrade this harness was built for ends with a prettier run that
 * re-sorts every class attribute in the repo, and an unsorted dump would report that churn as a
 * difference on every element of every page — burying the handful of real ones. Sorting keeps the
 * class attribute in the dump (it is a genuinely useful thing to see next to a colour that moved)
 * without letting its ORDER be a finding, which it is not.
 */
export async function dumpStyles(page: Page): Promise<StyleDump> {
  return throughNavigation(page, async () => {
    const raw = await page.evaluate(
      ({ probeId }) => {
        const SKIP = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'HEAD', 'NOSCRIPT', 'TEMPLATE']);
        const root = document.documentElement;
        const props = Array.from(getComputedStyle(root));
        const elements: { index: number; tag: string; id?: string; testId?: string; className?: string; values: string[] }[] = [];
        let index = 0;
        const walk = (element: Element): void => {
          // The ch probe is the harness, not the page, and it stays in the document for the whole of
          // it -- so it is skipped WITHOUT taking an index, which keeps every other element's index
          // exactly what it would be in a document the harness had never touched.
          if (SKIP.has(element.tagName) || element.id === probeId) return;
          const computed = getComputedStyle(element);
          const testId = element.getAttribute('data-testid');
          const classAttribute = element.getAttribute('class');
          elements.push({
            index,
            tag: element.tagName.toLowerCase(),
            ...(element.id ? { id: element.id } : {}),
            ...(testId ? { testId: testId } : {}),
            ...(classAttribute ? { className: classAttribute.split(/\s+/).filter(Boolean).sort().join(' ') } : {}),
            values: props.map((property) => computed.getPropertyValue(property))
          });
          index += 1;
          for (const child of Array.from(element.children)) walk(child);
        };
        walk(root);
        return { props, elements };
      },
      { probeId: CH_PROBE_ID }
    );
    return encodeStyles(raw.props, raw.elements as RawElement[]);
  });
}
/** The id of the stylesheet planted for the duration of one shot. See `screenshotFrozen`. */
const FREEZE_ID = '__visual_freeze__';

/**
 * Every animation and transition off, and nothing promoted for one that is coming.
 *
 * `filter` and `opacity` are deliberately NOT touched: they are what a `hover:` state actually
 * looks like, and the shot is meant to show it.
 */
const FREEZE_CSS = `*, *::before, *::after, *::backdrop {
  animation: none !important;
  transition: none !important;
  will-change: auto !important;
}`;

/**
 * Why a shot could not be taken, when it could not.
 *
 * Two states rather than one `null`, because the two are repaired by opposite acts -- a fresh
 * document for one, the state re-applied to this one for the other. See `screenshotFrozen`.
 */
export type ShotFailure =
  /** A `ch` on this page does not currently mean what the stylesheet says it means. */
  | 'metrics'
  /**
   * The document changed across its own raster, or a focus came back without its `:focus-visible`
   * ring, so the png would not be of the state it was asked for. Re-applied on the same document.
   */
  | 'disturbed'
  /** The hover moves its own target out from under the pointer, so the state is never at rest. */
  | 'unstable'
  /** No point of the target inside the fold is under the pointer: something covers all of it. */
  | 'unreachable';

/**
 * The shot, taken with the page's animations removed and then put back.
 *
 * WHY THIS IS NOT `page.screenshot` WITH `animations: 'disabled'`. That option finishes an
 * animation and holds it at its end value, which is the right SEMANTICS and does nothing about the
 * COMPOSITING the animation caused: an element with a `transform` animation is promoted to its own
 * layer, text inside a layer is rasterised separately, and Chromium decides whether to keep that
 * layer on a budget rather than on anything the page says. The A/A gate measured the result on
 * playbook-app -- three or four shots in 450, on every run, never the same ones twice, differing
 * only in the glyph edges of one card, with identical computed styles on both sides. Every one of
 * them was inside a card carrying `animation: ... both`, whose fill mode keeps the animation
 * attached forever.
 *
 * Removing the animation for the length of the shot removes the promotion, so the text is
 * rasterised into the document exactly once and both sides of an A/B agree. It is put back
 * immediately afterwards, which is what keeps the style dump -- taken next, by the caller -- a
 * description of the page rather than of the harness.
 *
 * A SETTLE AFTER PLANTING IT, because de-compositing is a repaint like any other and a screenshot
 * taken in the same frame can catch the old raster.
 *
 * THE FONT METRICS ARE CHECKED ON BOTH SIDES OF THE SHOT, AND THIS IS THE ONLY PLACE WHERE THAT
 * CHECK IS WORTH ANYTHING. Planting the stylesheet above is a whole-tree style recalc, and a
 * recalc is exactly when Chromium re-resolves every font-relative unit on the page -- so a recalc
 * that lands in the instant the face is gone rewrites `max-width: 88ch` to `0.5em` per `ch` across
 * the whole document, AFTER every check made before the state was applied has passed. Measured on
 * the decision detail page: 88ch shot at 638px on one capture and 714.56px on the next, of the
 * same server, with 806 of the other 810 shots identical. The width is re-read after the
 * screenshot as well, because the shot itself rasterises a document twelve thousand pixels tall
 * and the face does not survive every one of them.
 *
 * THE DOCUMENT'S STRUCTURE IS CHECKED ON BOTH SIDES OF THE SHOT TOO, and it is a different hazard
 * with the same shape. A full-page screenshot is not a passive read: Chromium renders the document
 * at its own height and is briefly at other viewport sizes on the way there and back, 1x1 among
 * them -- measured, from inside the page, by listening for `resize` across a `page.screenshot`. A
 * page that mounts something on hover sees a reflow at that moment, the pointer is no longer over
 * the element it was over, and the app tears the node down on whatever grace period it schedules
 * its hover clear on. The pointer never moves again, so nothing brings it back: every later shot
 * of that page is of the torn-down state.
 *
 * Measured on playbook-app's chart previews, which portal a tooltip bubble on hover: eight
 * consecutive shots of ONE hovered chart band, no other input, and the bubble vanished at the
 * fourth and stayed gone -- 1604 elements before the raster, 1600 after, a different sha from
 * there on. That is the whole of ISS-9986: two captures of one dev server disagreeing on 14 hover
 * shots, every one of them the tooltip present on one side and absent on the other at the same
 * key, with no computed-style difference anywhere.
 *
 * THE TEARDOWN IS AN EVENT, AND THE EVENT IS SEALED OFF (ISS-15799). Logged from inside the page
 * across a disturbed shot: `pointerout` and `mouseout` on the hovered band, `mouseleave` on the
 * root, the bubble removed, all in the same millisecond as `resize` to 1x1 -- the pointer is
 * outside a 1x1 viewport -- then `pointerover` on the band again once the viewport is back. The
 * pointer never moved; the page moved under it. So from the moment the freeze stylesheet goes in
 * until it comes out, `DETERMINISM_INIT`'s first-registered window listener swallows every pointer
 * and mouse boundary or move event before the page can see one. The harness itself moves the
 * pointer only in `applyState` and `clearState`, both outside that window, so nothing sealed is an
 * input anybody gave. Unsealed, this was every hover shot of `/dev-viz?page=court` and `member` on
 * a runner at load 25-48, twelve raster attempts each, and roughly one shot in three of a hovered
 * band at load 10. It is also the A/A half of the same defect: the `pointerover` that follows
 * re-mounts the bubble, so a structure read taken after it matches the one taken before the raster
 * and a png of the torn-down state is RECORDED -- the shots two captures of one cold server
 * disagreed on, which no structure check can catch.
 *
 * Sealing the pointer is also why planting the freeze stylesheet cannot take a hover state away:
 * removing an entrance animation can move the hovered element out from under a pointer that never
 * moved, which is the same synthetic boundary event by a different route.
 *
 * THE STRUCTURE CHECK STAYS, for what an event seal cannot reach -- a `ResizeObserver` that
 * re-renders a chart at the 1x1 width, which is a callback and not an event. A SHOT WHOSE PAGE
 * MOVED ACROSS ITS OWN RASTER DOES NOT DEPICT THE STATE IT WOULD BE FILED UNDER, whichever half of
 * the raster caught the truth, so it is reported rather than recorded.
 *
 * `fitToDocument` takes the resize out of the raster, which is what makes this check rare rather
 * than routine: the shot is of the viewport, which is already the document's measured size. It
 * stays for what can still move a document across its own raster without a resize -- a timer, a
 * late stylesheet, a node the app mounts on its own schedule.
 *
 * The two failures are told apart because their repairs are opposites. `metrics` needs a FRESH
 * DOCUMENT -- a `ch` is resolved at layout and kept, so nothing short of reloading clears it.
 * `disturbed` needs the STATE PUT BACK on the document that is already there, and a reload is the
 * wrong instrument for it: it costs a navigation and lands back in the same coin flip. See
 * `captureShot`.
 */
export async function screenshotFrozen(page: Page): Promise<Buffer | ShotFailure> {
  await page.evaluate(
    ({ id, css, seal }) => {
      (window as unknown as Record<string, unknown>)[seal] = true;
      const style = document.createElement('style');
      style.id = id;
      style.textContent = css;
      document.head.appendChild(style);
    },
    { id: FREEZE_ID, css: FREEZE_CSS, seal: POINTER_SEAL }
  );
  await canonicalize(page);
  await page.waitForTimeout(SETTLE_MS);
  try {
    await loadDeclaredFaces(page);
    if ((await awaitMeasurable(page)) !== 'ok') return 'metrics';
    const beforeCh = await chWidth(page);
    // Read LAST before the raster and FIRST after it, with nothing of the harness's own in
    // between: `freshCh` and `chWidth` each plant a probe element and take it away again, so a
    // reading taken across one of them would be comparing the document with the harness in it.
    const beforeStructure = await structure(page);
    // The VIEWPORT, which `fitToDocument` has made the document's measured size: a full-page
    // shot would resize for the raster wherever the document has outgrown that, and that resize is
    // what took the state away.
    const png = await page.screenshot({ fullPage: false, animations: 'disabled', caret: 'hide', scale: 'css', type: 'png' });
    if ((await structure(page)) !== beforeStructure) return 'disturbed';
    if ((await awaitMeasurable(page)) !== 'ok') return 'metrics';
    if (Math.abs((await chWidth(page)) - beforeCh) > 0.5) return 'metrics';
    return png;
  } finally {
    // TAKING THE STYLESHEET BACK OUT MUST NOT DECIDE WHAT THIS CALL REPORTS. A `finally` that
    // throws replaces the error the `try` raised, and the one document state in which this
    // `evaluate` fails is the one where something more interesting has already gone wrong -- a
    // context destroyed by a navigation, which `captureShot`'s caller repairs by name and cannot
    // repair at all if the reason arrives as a bare cleanup failure. A document that is going away
    // takes the stylesheet, and the seal, with it regardless.
    await page
      .evaluate(
        ({ id, seal }) => {
          document.getElementById(id)?.remove();
          (window as unknown as Record<string, unknown>)[seal] = false;
        },
        { id: FREEZE_ID, seal: POINTER_SEAL }
      )
      .catch(() => undefined);
  }
}

/**
 * The png's size, or `null` when it is not the size `fitToDocument` measured the document at.
 *
 * THE RASTER IS THE VIEWPORT AND THE VIEWPORT IS THE MEASUREMENT, so the two can only disagree when
 * something resized the page between the fit and the raster -- and then the png is not of the
 * document the shot is filed as. That is `disturbed`'s shape, a page that moved across its own
 * raster, and it takes `disturbed`'s repair: the fit and the state applied again (ISS-15888).
 */
function rasterOf(page: Page, png: Buffer): { width: number; height: number } | null {
  const size = imageSize(png);
  const measured = fitted.get(page);
  if (size === null || measured === undefined) return null;
  return size.width === measured.width && size.height === measured.height ? size : null;
}

/** How many documents a single shot is allowed to need before it is given up on. */
const SHOT_ATTEMPTS = 3;

/**
 * How many times a shot disturbed by its own raster is re-taken on the document already loaded.
 *
 * Measured at roughly two shots in five on playbook-app's chart previews -- three sessions running
 * the same page in parallel came back with four of nine hovered-band shots missing the bubble --
 * so four retakes puts the odds of a page never being shot in the state it was asked for under two
 * in a hundred before the outer loop has reloaded even once, and under a thousandth once it has.
 * The cost is paid only where the disturbance actually happens: a shot that survives its first
 * raster takes exactly one.
 */
const RETAKES = 4;

/** One shot: what the state was applied to, the png, and the size of the png. */
export interface Shot {
  /** The element `applyState` targeted, or `none` where the page offered none. */
  target: string;
  png: Buffer;
  /**
   * The png's own size, which is the document's size as `fitToDocument` measured it: a shot whose
   * raster is any other size is refused rather than returned. So the manifest's size is the size
   * of the image its sha is of, by construction (ISS-15888).
   */
  width: number;
  height: number;
}

/**
 * One state, shot on metrics the page can reproduce, reloading the document until it can.
 *
 * THE REPAIR IS A RELOAD AND CANNOT BE ANYTHING ELSE. A `ch` is resolved at layout and kept, so a
 * document that has resolved one against a face it no longer has is carrying a width that no
 * amount of loading the face back will correct -- only a document that has not made that
 * resolution yet. Three tries, and then the shot is dropped rather than recorded on the wrong
 * metrics: a key missing from one side is a compare failure, which is loud and correct, and a shot
 * recorded against fallback metrics is a difference the next A/B blames on a stylesheet.
 *
 * A reload puts the page back at rest, which is why the state is applied again inside the loop
 * rather than once outside it. `index` survives that, and has to: it is an ordinal among the
 * page's own eligible elements rather than a coordinate, so the reloaded document resolves it to
 * the same element without anything having to be re-measured across the reload.
 *
 * AN `unstable` OR `unreachable` HOVER IS RETURNED AT ONCE. It is a property of the page, not of the attempt, so
 * neither a retake nor a reload can produce a shot of it. See `applyState`.
 *
 * A SHOT DISTURBED BY ITS OWN RASTER IS RETAKEN ON THIS DOCUMENT, and the inner loop is that. The
 * repair is not a reload -- the document is fine, it is the STATE that the screenshot's viewport
 * transient took away -- so `clearState` puts the pointer back off-target and `applyState` opens
 * it again. RE-APPLYING IS THE WHOLE OF IT AND A BARE SECOND SCREENSHOT WOULD FIX NOTHING: once a
 * hover-mounted node has been torn down the pointer never moves again, so it does not come back on
 * its own. Measured directly -- eight consecutive shots of one hovered chart band, the bubble gone
 * from the fourth onward.
 */
export async function captureShot(page: Page, state: StateName, index = 0): Promise<Shot | ShotFailure> {
  return throughNavigation(page, async () => {
    // What the last thing to go wrong WAS, so a dropped shot is reported as the failure it actually
    // hit. The two read identically in a manifest otherwise, and they send whoever opens it to
    // opposite halves of this file.
    let last: ShotFailure = 'metrics';
    for (let attempt = 0; attempt < SHOT_ATTEMPTS; attempt += 1) {
      if (attempt > 0 && !(await reload(page))) return last;
      for (let retake = 0; retake < RETAKES; retake += 1) {
        if (retake > 0) await clearState(page);
        // At rest, so the resize has no state to destroy. See `fitToDocument`.
        await fitToDocument(page);
        const target = await applyState(page, state, index);
        if (target === 'metrics') {
          last = 'metrics';
          break;
        }
        // The same answer however often it is asked, so it is returned rather than retaken -- unless
        // the document was replaced while it was asked, when it is an answer about no document this
        // page shows: a hover read across a dev server's reload finds its target gone (ISS-15877).
        if (target === 'unstable' || target === 'unreachable') {
          refuseIfReplaced(page);
          return target;
        }
        // A focus without its ring is re-applied to this document, as a disturbed raster is.
        if (target === 'disturbed') {
          last = 'disturbed';
          continue;
        }
        const shot = await screenshotFrozen(page);
        if (typeof shot !== 'string') {
          // A shot of a document that has since been replaced is of no document this page shows.
          refuseIfReplaced(page);
          const size = rasterOf(page, shot);
          if (size !== null) return { target, png: shot, ...size };
          last = 'disturbed';
          continue;
        }
        last = shot;
        if (shot === 'metrics') break;
      }
    }
    return last;
  });
}
// dry-copy-end

/**
 * The `localStorage` key `app.html` reads the theme from, in an inline script before SvelteKit
 * boots.
 *
 * REPO-SPECIFIC, and outside the shared region above for exactly that reason: it is the app's own
 * key and not the harness's, and the apps do not agree on one. Naming a key inside the region is
 * what kept the repos that differ out of it, and out of every determinism fix the region has had
 * since. `themedContext` reads it at call time, so declaring it here is enough for a repo to state
 * its own key and still share every line of the harness.
 */
const THEME_STORAGE_KEY = 'playbook-theme';
