/**
 * THE CAPTURE MATRIX, and the naming that makes two captures comparable (ISS-9319, copied under
 * ISS-9327).
 *
 * Kept apart from the browser so it can be unit-tested: the thing a parity harness gets wrong
 * silently is not the screenshot, it is the BOOKKEEPING around it. Two captures are only comparable
 * if every shot on one side has exactly one counterpart on the other, and the only thing that pairs
 * them is this key. A key that collides makes two different pages compare equal; a key that is not
 * stable across runs makes every shot look new. Both failures read as "the harness said nothing was
 * wrong".
 *
 * WHY EACH AXIS IS HERE. A CSS-toolchain upgrade changes what a stylesheet COMPILES TO, and a
 * single screenshot of a page at rest exercises a small part of that:
 *
 *   - THEME, in the repos that have one, because their declared colour is half on
 *     `:root[data-theme='dark']` and the `dark:` variant has to keep keying off that attribute
 *     rather than off a class. THIS SITE HAS NO THEME — no `dark:` utility, no `data-theme`, no
 *     toggle — so the axis is degenerate and each page is captured twice identically. The axis is
 *     kept rather than dropped because the region below is shared byte for byte with the repos that
 *     do have one, and because two shots that must be equal are a free control on the harness
 *     itself: a `dark` hash that differs from its `light` twin inside ONE capture is a harness
 *     fault.
 *   - VIEWPORT, because responsive variants are separate compiled rules, and this site is built out
 *     of them: every page is a `sm:`/`md:`/`lg:` grid over a mobile column.
 *   - STATE, because `hover:` and the focus ring are the two utility families a rest screenshot
 *     cannot see at all — and `hover:` is precisely the one Tailwind 4 changes the meaning of, by
 *     wrapping it in `@media (hover: hover)`. This site writes 117 of them, and its focus ring is
 *     declared once in `app.css` on `:focus-visible` for every page at once.
 *
 * The three multiply out to twelve shots per page plus one per hover target — `hover` is the axis
 * member that is not a single shot, see `STATES`. That is the point: the upgrade is claimed to be a
 * no-op, and a no-op claim is only worth what it was tested against.
 */

/**
 * The two values `capture.ts` boots a context under. Both render identically here; see the axis
 * note above for why the degenerate axis is kept.
 */
export const THEMES = ['dark', 'light'] as const;
export type ThemeName = (typeof THEMES)[number];

export interface Viewport {
  /** Appears in the key, so it is short and stable. */
  name: string;
  width: number;
  height: number;
}

/**
 * Phone, tablet, desktop. `desktop` is 1920x1080 because that is what `playwright.config.ts`
 * already uses, so a shot taken here is the same page the e2e suite sees. 375 and 768 are
 * Tailwind's own `sm` and `md` boundaries — below `sm`, and exactly ON `md` — so a responsive
 * variant that changed the width it applies at lands on one of the three rather than between them.
 * This repo's `app.css` declares no `@media` block of its own, so Tailwind's are the only ones.
 */
export const VIEWPORTS: readonly Viewport[] = [
  { name: 'phone', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 }
] as const;

/**
 * `rest` is the page as it loads. `focus` puts the keyboard focus on the first form control that is
 * already inside the viewport. `hover` puts the pointer on EVERY interactive element that is, one
 * shot each — all three constrained to the initial viewport ON PURPOSE, because the alternative
 * (playwright's own `hover()`, which scrolls) would move the document under a full-page screenshot
 * and make the shot depend on where the target happened to sit.
 *
 * `hover` IS THE ONE MEMBER OF THIS AXIS THAT IS NOT ONE SHOT, which is why `shotStates` exists
 * below: a page contributes `hover-0`, `hover-1`, ... up to `DEFAULT_HOVER_LIMIT`. The first
 * interactive element in document order is deterministic and is almost never the affordance a
 * `hover:` rule is about, so hovering only it spends every button shot on a form's decoration
 * (ISS-9603).
 */
export const STATES = ['rest', 'focus', 'hover'] as const;
export type StateName = (typeof STATES)[number];

// dry-copy: visual-parity/matrix — every copy of this region must match; `dev repo copies` checks it
/** One page to capture: the url path, and the slug that names it in every key. */
export interface PageTarget {
  /** The url path to navigate to, e.g. `/login/password/reset`. */
  path: string;
  /** `login-password-reset` — filename-safe, lowercase, unique within a set. */
  slug: string;
}

/**
 * `hover-0`, `hover-1`, ... -- the state segment of the key for one indexed hover shot.
 *
 * `hover` is the one state that is not a single shot: the pointer goes on every eligible element
 * inside the viewport in turn, because the FIRST one in document order is almost never the
 * affordance a `hover:` rule is about. `capture.ts`'s `hoverTargetCount` carries the argument and
 * the measurement behind it (ISS-9603).
 */
export type HoverState = `hover-${number}`;

export function hoverState(index: number): HoverState {
  return `hover-${index}`;
}

/** What a shot key's last segment can be: a singleton state, or one indexed hover. */
export type ShotState = StateName | HoverState;

/**
 * How many hover shots one page/theme/viewport may contribute when nothing says otherwise.
 *
 * SIX, not "all of them", because every shot is a full-page PNG and a style dump: a console page
 * carrying a nav, a breadcrumb and a table of row links offers dozens of eligible elements, and an
 * uncapped capture would multiply its own size by that. Six reaches past the decoration a form puts
 * first -- the failure this cap sits on top of -- on every page measured, and what it does not
 * reach is REPORTED in the manifest rather than dropped.
 */
export const DEFAULT_HOVER_LIMIT = 6;

/**
 * `VISUAL_HOVER_LIMIT`, parsed.
 *
 * A THROW RATHER THAN A FALLBACK on anything unparseable. The limit decides the key set a capture
 * writes, so a typo that silently became the default would produce a capture whose keys do not
 * match the other side's, and the compare would report hundreds of shots present on one side only
 * -- which is loud, but names the wrong cause.
 */
export function hoverLimit(raw: string | undefined): number {
  if (raw === undefined || raw === '') return DEFAULT_HOVER_LIMIT;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`visual: VISUAL_HOVER_LIMIT must be a positive integer, got "${raw}"`);
  }
  return value;
}

/**
 * How long ONE SHOT may take, in milliseconds, when nothing says otherwise -- the unit
 * `VISUAL_SHOT_BUDGET_MS` sets and `parity.spec.ts` multiplies out into a per-page budget.
 *
 * A PAGE IS NOT A FIXED AMOUNT OF WORK, which is why the budget is per shot rather than per page.
 * `hover` is one shot per eligible element, so a page contributes anywhere between
 * `THEMES * VIEWPORTS * 3` shots and `THEMES * VIEWPORTS * (2 + VISUAL_HOVER_LIMIT)` -- eighteen
 * and forty-eight on the default matrix, a spread of nearly three to one inside a single set. So a
 * per-page constant cannot be right for both ends of it, and it is the forty-eight-shot pages that
 * a loaded machine loses first.
 *
 * MEASURED, on one capture of playbook-app's preview set at two workers on an otherwise quiet
 * runner: its eighteen-shot page took 1.9 minutes, its thirty-eight-shot page 6.5, and its
 * forty-eight-shot page 10.0 -- between 6 and 13 seconds a shot, because one shot is a state
 * change, a settle that outlasts the stylesheet's longest declared transition, a full-page
 * screenshot of a document twelve thousand pixels tall, and a computed-style walk of every element
 * on it. The fixed five minutes this replaced could not fit that page on an IDLE machine, never
 * mind a shared one (ISS-9957).
 *
 * FORTY-FIVE SECONDS is three times the worst of those, and the headroom is deliberate because the
 * error is not symmetric. A budget larger than a page needs costs nothing whatever: a page that
 * finishes never reaches the timer. A budget smaller than a page needs costs the WHOLE CAPTURE --
 * the test fails, its shard is never written, and a capture missing one page cannot pass the A/A
 * gate the README puts before every verdict, so a run that dropped two pages out of twenty-nine
 * answered exactly as much as one that dropped all of them. Raise it on a machine that shares its
 * cores; there is no reason to lower it.
 */
export const DEFAULT_SHOT_BUDGET_MS = 45_000;

/**
 * `VISUAL_SHOT_BUDGET_MS`, parsed. The lever a caller on a loaded machine has.
 *
 * A THROW RATHER THAN A FALLBACK, as `hoverLimit` throws, and for a sharper reason: a typo that
 * silently became the default fails on the very machine the caller raised it FOR, reporting the
 * same timed-out pages as before and saying nothing about why the number did not take.
 *
 * ZERO IS ACCEPTED, AND ASKS FOR NO PER-PAGE BUDGET AT ALL -- playwright reads a zero timeout that
 * way. It is a defensible thing to want here in a way it would not be in a test suite, because
 * nothing inside one test is unbounded on its own: every navigation and load-state wait carries
 * `VISUAL_SETTLE_TIMEOUT_MS`, a screenshot carries playwright's, and a page that will not settle
 * is recorded as a dropped rendering rather than waited on. What the per-page budget bounds is
 * total WORK, not a hang, so a caller who would rather wait than lose a capture is not switching
 * off a guard.
 */
export function shotBudget(raw: string | undefined): number {
  if (raw === undefined || raw === '') return DEFAULT_SHOT_BUDGET_MS;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`visual: VISUAL_SHOT_BUDGET_MS must be a non-negative integer of milliseconds, got "${raw}"`);
  }
  return value;
}

/**
 * How long ONE navigation or load-state wait inside `settle` may take, when nothing says otherwise.
 *
 * THIRTY SECONDS IS PLAYWRIGHT'S OWN DEFAULT and it is here as a NUMBER rather than as six literals
 * in `capture.ts` because it is the deadline that fires on a loaded box, and the per-page budget is
 * no help against it: a page whose `goto` misses this deadline loses its whole theme/viewport
 * context in a hundredth of the time the budget would have allowed it (ISS-9985). Measured on
 * playbook-app's preview set, two captures of ONE dev server minutes apart: the second was slower
 * across the board -- one page went from 6.4 to 12.5 minutes -- and eight contexts across five
 * pages came back "never settled", every one of which had settled in the first capture and settled
 * in its other five contexts inside the second. Nothing was wrong with any of them; the box was
 * busy.
 *
 * SO THE ERROR IS NOT SYMMETRIC, exactly as it is not for the shot budget. A deadline larger than a
 * page needs costs nothing at all, because a page that settles never reaches it. A deadline smaller
 * than a page needs costs a whole context, which costs the CAPTURE: the A/A gate compares key for
 * key, so 62 shots present on one side only is a failed gate however good the other 1146 were.
 * Raise it on a machine that shares its cores.
 */
export const DEFAULT_SETTLE_TIMEOUT_MS = 30_000;

/**
 * `VISUAL_SETTLE_TIMEOUT_MS`, parsed. The second lever a caller on a loaded machine has.
 *
 * A THROW RATHER THAN A FALLBACK, as `shotBudget` and `hoverLimit` throw: a typo that silently
 * became the default fails on the very machine the caller raised it FOR, dropping the same contexts
 * as before and saying nothing about why the number did not take.
 *
 * ZERO IS REFUSED HERE THOUGH `shotBudget` ACCEPTS IT, and the asymmetry is the whole point of
 * having two numbers. The per-page budget bounds total WORK and every wait beneath it is bounded
 * separately, so switching it off leaves the guards in place. THIS number IS those guards -- it is
 * what a `waitForLoadState('networkidle')` on a page holding one request open forever is bounded
 * by, and a page like that exists (a socket, a poll, an analytics beacon the runner's egress
 * swallows). Zero there is not patience, it is a capture that never ends and reports nothing.
 */
export function settleTimeout(raw: string | undefined): number {
  if (raw === undefined || raw === '') return DEFAULT_SETTLE_TIMEOUT_MS;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`visual: VISUAL_SETTLE_TIMEOUT_MS must be a positive integer of milliseconds, got "${raw}"`);
  }
  return value;
}

/** One shot: a page in one theme, at one viewport, in one state. */
export interface Shot {
  key: string;
  page: PageTarget;
  theme: ThemeName;
  viewport: Viewport;
  state: ShotState;
}

/**
 * A url path as a filename-safe slug.
 *
 * LOWERCASED, and that is the part with a trap in it. Two paths can differ only in case — a
 * camelCase fixture key is the usual way — and macOS filesystems are case-INSENSITIVE, so a slug
 * that preserved case would write two shots to one file and the second would silently win.
 * Lowercasing makes the collision visible instead, and `pageTargets` below refuses one rather than
 * letting it through.
 */
export function slugOf(path: string): string {
  const slug = path
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug === '' ? 'root' : slug;
}

/**
 * Paths to targets, refusing a slug collision by naming both paths.
 *
 * A throw rather than a rename: an auto-disambiguated slug is stable only as long as the set is
 * unchanged, so a page added later would renumber somebody else's shot and every key after it
 * would compare as new. Two paths that collide here is a harness bug to fix by hand, and it has
 * to be loud enough that nobody reads the resulting "812 new keys" as a real diff.
 */
export function pageTargets(paths: readonly string[]): PageTarget[] {
  const bySlug = new Map<string, string>();
  return paths.map((path) => {
    const slug = slugOf(path);
    const seen = bySlug.get(slug);
    if (seen !== undefined) {
      throw new Error(`visual: paths ${seen} and ${path} both slugify to "${slug}" — rename one or widen slugOf()`);
    }
    bySlug.set(slug, path);
    return { path, slug };
  });
}

/** `<slug>--<theme>--<viewport>--<state>`, the identity of one shot in both captures. */
export function shotKey(slug: string, theme: ThemeName, viewport: string, state: ShotState): string {
  return `${slug}--${theme}--${viewport}--${state}`;
}

/**
 * The state segments one page/theme/viewport contributes, given how many hover targets it offered.
 *
 * A PAGE OFFERING NONE STILL CONTRIBUTES `hover-0`, recorded with the target `none`. That keeps the
 * key set independent of whether a page has a button today: the day it grows one, that is a
 * `target` change on a key both captures hold, rather than a new key with nothing to compare it to.
 */
export function shotStates(hoverShots: number): ShotState[] {
  return STATES.flatMap((state) =>
    state === 'hover' ? Array.from({ length: Math.max(hoverShots, 1) }, (_, index) => hoverState(index)) : [state]
  );
}

/**
 * Every shot for one page, in a fixed order: theme outermost, then viewport, then state.
 *
 * `hoverShots` is a per-page number the browser answers (`hoverTargetCount`), so this takes it
 * rather than deriving it: the count is a property of the rendered page, not of the matrix.
 */
export function shotsFor(page: PageTarget, hoverShots: number): Shot[] {
  const shots: Shot[] = [];
  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      for (const state of shotStates(hoverShots)) {
        shots.push({ key: shotKey(page.slug, theme, viewport.name, state), page, theme, viewport, state });
      }
    }
  }
  return shots;
}
// dry-copy-end
