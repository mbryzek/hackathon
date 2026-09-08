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
 *     outlasts the stylesheet's longest declared transition. The stylesheet is NOT patched with an
 *     injected `transition: none` rule: that would change the CSSOM the computed-style dump then
 *     reads, and the dump is meant to describe the page, not the harness.
 *   - FONTS, in three places, because one is not enough. `document.fonts.ready` plus every
 *     declared face LOADED, since a shot taken before a self-hosted face swaps in is a shot of the
 *     fallback metrics. Then a RELOAD when the document turns out to have laid itself out before
 *     the face arrived, because a `ch` resolved then is kept for the life of that document. Then
 *     the same question again before EVERY shot, because the face can go away mid-page. See
 *     `settle`, `metrics` and `captureShot`. THIS APP DECLARES NO `@font-face` — its stack is Inter
 *     with system fallbacks — so all three are inert here and are kept for the reason the whole
 *     module is: the region below is shared byte for byte with the repos that do self-host one,
 *     and a probe that measures an installed font is a correct answer, not a skipped one.
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
 */
// dry-copy: visual-parity/capture — every copy of this region must match; `dev repo copies` checks it
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Browser, BrowserContext, Cookie, Page } from '@playwright/test';
import type { StateName, ThemeName, Viewport } from './matrix.ts';
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
 * minute. A url whose bytes cannot be read at all is passed through: a broken image is a real
 * rendering and both sides get it.
 */
async function stubForeignMedia(context: BrowserContext, baseUrl: string): Promise<void> {
  const origin = new URL(baseUrl).origin;
  const directory = cacheDir();
  mkdirSync(directory, { recursive: true });

  await context.route('**/*', async (route) => {
    const request = route.request();
    const foreign = !request.url().startsWith(origin);
    if (foreign && request.resourceType() === 'media') {
      await route.abort();
      return;
    }
    if (!foreign || request.resourceType() !== 'image') {
      await route.fallback();
      return;
    }
    const file = join(directory, `${createHash('sha256').update(request.url()).digest('hex').slice(0, 32)}.json`);
    const size = await (async (): Promise<{ width: number; height: number } | null> => {
      if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as { width: number; height: number };
      const response = await route.fetch().catch(() => null);
      const bytes = response === null ? null : await response.body().catch(() => null);
      const measured = bytes === null ? null : imageSize(bytes);
      if (measured !== null) writeFileSync(file, JSON.stringify(measured));
      return measured;
    })();
    if (size === null) {
      await route.fallback();
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
 * THE KEY ITSELF IS REPO-SPECIFIC and is declared ABOVE this region, because it is the app's own
 * key and not the harness's: playbook-www reads `ca-theme` where the consoles read
 * `playbook-theme`. Hard-coding it here is what kept that repo out of this region, and out of
 * every determinism fix the region has had since.
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
 * resolution has already been made. Only a fresh document has none.
 *
 * A document with no planted probe can only be asked the first question and is answered on that.
 */
async function metrics(page: Page): Promise<Metrics> {
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
 * that will not settle must not lose the other 800 shots, and a shot that is missing from one side
 * is already a failure in `compareManifests` -- so the honest thing is to record nothing for it and
 * let the compare report it as present on one side only.
 */
export async function settle(page: Page, path: string): Promise<boolean> {
  try {
    await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    return await quiet(page);
  } catch {
    return false;
  }
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
 */
async function quiet(page: Page): Promise<boolean> {
  for (let attempt = 0; ; attempt += 1) {
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await loadDeclaredFaces(page);
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    if ((await awaitMeasurable(page)) !== 'stale') break;
    if (attempt + 1 >= RELOAD_ATTEMPTS) return false;
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
  }
  await awaitMedia(page);
  await page.waitForLoadState('networkidle', { timeout: 30_000 });
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.waitForTimeout(SETTLE_MS);

  for (let attempt = 0; attempt < RELOAD_ATTEMPTS; attempt += 1) {
    const before = page.url();
    await page.waitForTimeout(SETTLE_MS);
    if (page.url() === before) break;
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await loadDeclaredFaces(page);
  }
  return true;
}

/** A fresh document of the same url, for a page that is carrying a resolution it cannot reproduce. */
async function reload(page: Page): Promise<boolean> {
  try {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    return await quiet(page);
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
  const total = await page.evaluate((selector) => {
    // The eligibility test `applyState` applies, counted rather than acted on. Written twice
    // because both copies run INSIDE the page, where nothing this module defines exists.
    let count = 0;
    for (const element of Array.from(document.querySelectorAll(selector))) {
      if ((element as HTMLInputElement).disabled) continue;
      const rect = element.getBoundingClientRect();
      const onScreen =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth;
      if (onScreen) count += 1;
    }
    return count;
  }, HOVER_SELECTOR);
  return { shots: Math.min(total, limit), total };
}

/**
 * Put the page into `state`, and say what it was applied to.
 *
 * BOTH TARGETS ARE CONSTRAINED TO THE INITIAL VIEWPORT, and are chosen in document order among
 * elements that are visible and enabled. Playwright's own `focus()`/`hover()` scroll the element
 * into view, which would move a fixed header inside the very screenshot being compared; `hover` is
 * therefore a raw mouse move to the element's centre, and `focus` passes `preventScroll`.
 *
 * `index` SKIPS THAT MANY ELIGIBLE ELEMENTS FIRST, which is how `hover` becomes one shot per
 * element rather than one per page: `hoverTargetCount` says how many there are and `parity.spec.ts`
 * walks them, keying each one `hover-<index>`. `focus` is only ever asked for index 0 -- a form's
 * first control is the affordance a focus ring is about, and the same is not true of its first
 * button.
 *
 * `none` is a legitimate answer — a page with no button has no hover state — and it is recorded in
 * the manifest rather than hidden, because "the same page offered a different target after the
 * upgrade" is itself a finding. `null` is the other answer and is not legitimate: it means a `ch`
 * on this page does not currently mean what the stylesheet says it means, so there is nothing
 * honest to record. `captureShot` reloads and asks again. See `metrics`.
 */
export async function applyState(page: Page, state: StateName, index = 0): Promise<string | null> {
  if (state === 'rest') return (await awaitMeasurable(page)) === 'ok' ? 'n/a' : null;

  const selector = state === 'focus' ? FOCUS_SELECTOR : HOVER_SELECTOR;

  const found = await page.evaluate(
    ({ selector: sel, wantFocus, skip }) => {
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
          rect.width > 0 &&
          rect.height > 0 &&
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth;
        if (!onScreen) continue;
        if (skipped < skip) {
          skipped += 1;
          continue;
        }
        if (wantFocus) {
          (element as HTMLElement).focus({ preventScroll: true });
          return { description: describe(element), x: 0, y: 0 };
        }
        return { description: describe(element), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
      return null;
    },
    { selector, wantFocus: state === 'focus', skip: index }
  );

  if (found === null) return 'none';
  if (state === 'hover') await page.mouse.move(found.x, found.y);
  await page.waitForTimeout(SETTLE_MS);
  return (await awaitMeasurable(page)) === 'ok' ? found.description : null;
}

/** Undo whatever `applyState` did, so the next state starts from rest rather than from the last one. */
export async function clearState(page: Page): Promise<void> {
  await page.mouse.move(-1, -1);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.waitForTimeout(SETTLE_MS);
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
 * `null` is the answer when the page could not be shot on metrics it can reproduce. It is not a
 * dropped shot: `captureShot` reloads the document, which is the one thing that clears a stale
 * resolution, and takes it again.
 */
export async function screenshotFrozen(page: Page): Promise<Buffer | null> {
  await page.evaluate(
    ({ id, css }) => {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = css;
      document.head.appendChild(style);
    },
    { id: FREEZE_ID, css: FREEZE_CSS }
  );
  await page.waitForTimeout(SETTLE_MS);
  try {
    await loadDeclaredFaces(page);
    if ((await awaitMeasurable(page)) !== 'ok') return null;
    const before = await chWidth(page);
    const png = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide', scale: 'css', type: 'png' });
    if ((await awaitMeasurable(page)) !== 'ok') return null;
    if (Math.abs((await chWidth(page)) - before) > 0.5) return null;
    return png;
  } finally {
    await page.evaluate(({ id }) => document.getElementById(id)?.remove(), { id: FREEZE_ID });
  }
}

/** How many documents a single shot is allowed to need before it is given up on. */
const SHOT_ATTEMPTS = 3;

/** One shot: what the state was applied to, and the png. */
export interface Shot {
  /** The element `applyState` targeted, or `none` where the page offered none. */
  target: string;
  png: Buffer;
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
 */
export async function captureShot(page: Page, state: StateName, index = 0): Promise<Shot | null> {
  for (let attempt = 0; attempt < SHOT_ATTEMPTS; attempt += 1) {
    if (attempt > 0 && !(await reload(page))) return null;
    const target = await applyState(page, state, index);
    if (target === null) continue;
    const png = await screenshotFrozen(page);
    if (png !== null) return { target, png };
  }
  return null;
}
// dry-copy-end

/**
 * The `localStorage` key `app.html` reads the theme from, in an inline script before SvelteKit
 * boots.
 *
 * REPO-SPECIFIC, and outside the shared region above for exactly that reason: it is the app's own
 * key and not the harness's — the consoles read `playbook-theme`, playbook-www reads `ca-theme`.
 * Hard-coding it inside the region is what kept playbook-www out of it, and out of every
 * determinism fix the region has had since. `themedContext` reads it at call time, so declaring it
 * here is enough for a repo to state its own key and still share every line of the harness.
 */
const THEME_STORAGE_KEY = 'playbook-theme';
