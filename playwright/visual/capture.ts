// dry-copy: sveltekit/visual-parity-capture — every copy of this region must match; `dev repo copies` checks it (ISS-3894)
/**
 * THE BROWSER HALF (ISS-9319): everything done to a page so that two runs of it are the same bytes.
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
 *   - THE CLOCK. Half the console renders a relative time ("3 minutes ago") or today's date.
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
 *     declared face LOADED, since a shot taken before a self-hosted webfont swaps in is a shot
 *     of the fallback metrics. Then a RELOAD when the document turns out to
 *     have laid itself out before the face arrived, because a `ch` resolved then is kept for the
 *     life of that document. Then the same question again before EVERY shot, because the face can
 *     go away mid-page. See `settle` and `awaitMeasurableFont`.
 *   - THE COLOUR SCHEME. Pinned to `light` at the context. The console's dark mode is a
 *     `data-theme` attribute, not `prefers-color-scheme`, so this pins nothing the app reads — it
 *     pins what the UA stylesheet and any third-party CSS read, which otherwise follows the
 *     MACHINE the capture ran on.
 *   - THE DEVICE SCALE. `deviceScaleFactor: 1` and `scale: 'css'`, so the PNG is in CSS pixels and
 *     a capture taken on a retina box is comparable with one taken on a runner.
 *   - WHERE THE PAGE IS SCROLLED. A full-page screenshot renders fixed and sticky chrome at the
 *     current scroll offset, so `focus` and `hover` deliberately never scroll: both pick a target
 *     that is already inside the initial viewport, and skip the state when there is none.
 */
import type { Browser, BrowserContext, Page } from '@playwright/test';
import { SETTLE_MS, themeInitScript, type StateName, type ThemeName, type Viewport } from './matrix.ts';
import { encodeStyles, type RawElement, type StyleDump } from './styles.ts';

/**
 * The instant every capture believes it is.
 *
 * Arbitrary, fixed forever, and deliberately in the past: a date in the future makes a page that
 * renders "in 3 days" read as nonsense to whoever opens the PNG to see what broke.
 */
export const FIXED_TIME = new Date('2025-06-15T12:00:00.000Z');

/** The id of the `100ch` box planted before first layout. See `settle`. */
const CH_PROBE_ID = '__visual_ch_probe__';

/** Off-flow, unpainted, and removed before any shot is taken. */
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
  // the same first layout the page's own elements do. settle() reads it and removes it.
  document.addEventListener('DOMContentLoaded', () => {
    const probe = document.createElement('div');
    probe.id = ${JSON.stringify(CH_PROBE_ID)};
    probe.style.cssText = ${JSON.stringify(CH_PROBE_STYLE)};
    document.body.appendChild(probe);
  });
})();`;

/**
 * A context per (theme, viewport), which is also the only way the theme can be set.
 *
 * THE THEME IS APPLIED AS AN INIT SCRIPT, never after navigation. A repo that boots a theme out
 * of storage does it in an inline `<head>` script that runs before SvelteKit does, so the value
 * has to be there before the first byte of the document runs; setting it afterwards would
 * capture the page mid-swap. What that script IS belongs to the repo, so it comes from
 * `themeInitScript` in `matrix.ts` — a repo with one theme returns an empty string and nothing
 * is injected.
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
  await context.addInitScript(DETERMINISM_INIT);
  const themeScript = themeInitScript(theme);
  if (themeScript !== '') await context.addInitScript(themeScript);
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

/** Take the planted probe back out, so it is in no screenshot and in no style dump. */
async function removePlantedCh(page: Page): Promise<void> {
  await page.evaluate(({ id }) => document.getElementById(id)?.remove(), { id: CH_PROBE_ID });
}

/**
 * Wait until a font-relative unit measures against a REAL face, and say whether it ever did.
 *
 * THE FACE CAN GO AWAY IN THE MIDDLE OF A PAGE, which is what the A/A gate found and is why this
 * is checked before every shot rather than once after the navigation. On playbook-admin's decision detail and
 * workflow authority pages, `max-width: 88ch` and `max-width: 62ch` measured correctly for
 * the `rest` shot, measured 0.5em per `ch` for the `hover` shot taken seconds later, and measured
 * correctly again for the `focus` shot after that -- one shot in 810, on a page whose stylesheet
 * had not changed and whose fonts had all been loaded and awaited before any of the three. 0.5em
 * is not a font metric: it is what CSS says `ch` means when there is no `0` glyph to measure, so
 * the browser had no face at all at that instant. The full-page screenshot between the two shots
 * rasterises a document twelve thousand pixels tall, and the face does not survive it every time.
 *
 * A FRESH PROBE IS A HONEST DETECTOR precisely because the condition is momentary and global: the
 * page's own elements re-resolve on their own once the face returns (which is why `focus` was
 * right again), so what has to be established is that the face is back BEFORE the shot is taken,
 * not that some particular element is stale. The probe inherits `<body>`'s font, so it asks the
 * question about the font the page is actually set in, and 100ch against 50em is a comparison with
 * six ems of daylight in it for any real face (playbook-admin's Hanken Grotesk is 0.56em per `ch`).
 *
 * Returns false when the face never came back. The caller drops the shot rather than recording it:
 * a missing key is a compare failure, which is loud and correct, and a shot recorded against
 * fallback metrics is a difference the next A/B blames on a stylesheet.
 */
async function awaitMeasurableFont(page: Page): Promise<boolean> {
  for (let attempt = 0; attempt < FONT_ATTEMPTS; attempt += 1) {
    const measurable = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:100ch;height:0;visibility:hidden;pointer-events:none';
      document.body.appendChild(probe);
      const width = probe.getBoundingClientRect().width;
      const em = Number.parseFloat(window.getComputedStyle(probe).fontSize);
      probe.remove();
      return Math.abs(width - em * 50) > 0.5;
    });
    if (measurable) return true;
    await loadDeclaredFaces(page);
    await page.waitForTimeout(SETTLE_MS);
  }
  return false;
}

/**
 * Navigate and wait until the page has stopped changing.
 *
 * THE DOCUMENT IS RELOADED IF IT LAID ITSELF OUT AGAINST METRICS IT NO LONGER HAS. Chromium
 * resolves a font-relative unit at FIRST LAYOUT and does not re-resolve it when a face arrives
 * afterwards, so a face that loses that race decides the width of a whole page permanently --
 * loading every face and waiting for it, which is what `loadDeclaredFaces` does, comes too late to
 * undo a resolution already made. Measured on playbook-admin's decision detail page, whose `max-width: 88ch`
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
    for (let attempt = 0; ; attempt += 1) {
      await page.waitForLoadState('networkidle', { timeout: 30_000 });
      await loadDeclaredFaces(page);
      await page.waitForLoadState('networkidle', { timeout: 30_000 });

      const planted = await plantedCh(page);
      const fresh = await freshCh(page);
      const stale = planted !== null && Math.abs(planted.width - fresh.width) > 0.5;
      if (!stale) break;
      if (attempt + 1 >= RELOAD_ATTEMPTS) return false;
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    }
    await removePlantedCh(page);

    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await page.waitForTimeout(SETTLE_MS);
    return true;
  } catch {
    return false;
  }
}

/**
 * Put the page into `state`, and say what it was applied to.
 *
 * BOTH TARGETS ARE CONSTRAINED TO THE INITIAL VIEWPORT, and are chosen in document order among
 * elements that are visible and enabled. Playwright's own `focus()`/`hover()` scroll the element
 * into view, which would move a fixed header inside the very screenshot being compared; `hover` is
 * therefore a raw mouse move to the element's centre, and `focus` passes `preventScroll`.
 *
 * `none` is a legitimate answer — a page with no button has no hover state — and it is recorded in
 * the manifest rather than hidden, because "the same page offered a different target after the
 * upgrade" is itself a finding. `null` is the other answer and is not legitimate: it means the
 * webfont was not measurable when the shot was due, so there is nothing honest to record. See
 * `awaitMeasurableFont`.
 */
export async function applyState(page: Page, state: StateName): Promise<string | null> {
  if (state === 'rest') return (await awaitMeasurableFont(page)) ? 'n/a' : null;

  const selector =
    state === 'focus'
      ? 'input:not([type=hidden]), select, textarea, [contenteditable="true"], button, a[href]'
      : 'button, [role="button"], a[href]';

  const found = await page.evaluate(
    ({ selector: sel, wantFocus }) => {
      const describe = (element: Element): string => {
        const id = element.id ? `#${element.id}` : '';
        const testId = element.getAttribute('data-testid');
        return `${element.tagName.toLowerCase()}${id}${testId ? `[data-testid=${testId}]` : ''}`;
      };
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
        if (wantFocus) {
          (element as HTMLElement).focus({ preventScroll: true });
          return { description: describe(element), x: 0, y: 0 };
        }
        return { description: describe(element), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
      return null;
    },
    { selector, wantFocus: state === 'focus' }
  );

  if (found === null) return 'none';
  if (state === 'hover') await page.mouse.move(found.x, found.y);
  await page.waitForTimeout(SETTLE_MS);
  return (await awaitMeasurableFont(page)) ? found.description : null;
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
  const raw = await page.evaluate(() => {
    const SKIP = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'HEAD', 'NOSCRIPT', 'TEMPLATE']);
    const root = document.documentElement;
    const props = Array.from(getComputedStyle(root));
    const elements: { index: number; tag: string; id?: string; testId?: string; className?: string; values: string[] }[] = [];
    let index = 0;
    const walk = (element: Element): void => {
      if (SKIP.has(element.tagName)) return;
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
  });
  return encodeStyles(raw.props, raw.elements as RawElement[]);
}
// dry-copy-end
