/**
 * THE CAPTURE MATRIX, and the naming that makes two captures comparable (ISS-9319, ISS-9327).
 *
 * THIS FILE IS THE ONE THE COPY OF THIS HARNESS IN EACH REPO OWNS. Everything around it carries
 * `dry-copy` markers and must stay byte-identical across repos; this states what is true about
 * THIS site — how many themes it has and how one is applied, how long its longest transition runs,
 * which viewports its stylesheet breaks at — and the shared half reads those out of here rather
 * than assuming playbook-admin's answers.
 *
 * Kept apart from the browser so it can be unit-tested: the thing a parity harness gets wrong
 * silently is not the screenshot, it is the BOOKKEEPING around it. Two captures are only
 * comparable if every shot on one side has exactly one counterpart on the other, and the only
 * thing that pairs them is this key. A key that collides makes two different pages compare equal;
 * a key that is not stable across runs makes every shot look new. Both failures read as "the
 * harness said nothing was wrong".
 *
 * WHY EACH AXIS IS HERE. A CSS-toolchain upgrade changes what a stylesheet COMPILES TO, and a
 * single screenshot of a page at rest exercises a small part of that:
 *
 *   - VIEWPORT, because responsive variants are separate compiled rules, and this site is built
 *     out of them: every page is a `sm:`/`md:`/`lg:` grid over a mobile column.
 *   - STATE, because `hover:` and the focus ring are the two utility families a rest screenshot
 *     cannot see at all — and `hover:` is precisely the one Tailwind 4 changes the meaning of, by
 *     wrapping it in `@media (hover: hover)`. This site writes 117 of them, and its focus ring is
 *     declared once in `app.css` on `:focus-visible` for every page at once.
 *   - THEME, which is a one-element axis here and stays an axis anyway. This site has no dark mode
 *     — no `dark:` utility, no `data-theme`, no toggle — so there is one theme and
 *     `themeInitScript` injects nothing. Keeping the axis rather than deleting it is what lets the
 *     shared half be shared: `capture.ts` and `parity.spec.ts` are the same bytes here as in a
 *     repo that has two.
 */

/**
 * The themes this site can boot into: one.
 *
 * `default` rather than `light`, because nothing in this repo names a theme at all and calling it
 * `light` would imply a `dark` that is coming.
 */
export const THEMES = ['default'] as const;
export type ThemeName = (typeof THEMES)[number];

/**
 * How to put the browser into `theme` before the first byte of the document runs.
 *
 * Empty here, because there is nothing to put it into. A repo whose `app.html` reads a stored
 * theme in an inline `<head>` script returns the `localStorage.setItem` that feeds it; see
 * `themedContext` in `capture.ts` for why it has to be an init script rather than a navigation
 * step.
 */
export function themeInitScript(_theme: ThemeName): string {
  return '';
}

export interface Viewport {
  /** Appears in the key, so it is short and stable. */
  name: string;
  width: number;
  height: number;
}

/**
 * Phone, tablet, desktop.
 *
 * `desktop` is 1920x1080 because that is what `playwright.config.ts` already uses, so a shot taken
 * here is the same page the e2e suite sees. The other two straddle Tailwind's own breakpoints,
 * which are the only ones this repo has — `app.css` declares no `@media` block of its own — so 375
 * is below `sm` (640), and 768 is exactly `md` and below `lg` (1024).
 */
export const VIEWPORTS: readonly Viewport[] = [
  { name: 'phone', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 }
] as const;

/**
 * `rest` is the page as it loads. `focus` puts the keyboard focus on the first form control that
 * is already inside the viewport, and `hover` puts the pointer on the first button that is — both
 * constrained to the initial viewport ON PURPOSE, because the alternative (playwright's own
 * `hover()`, which scrolls) would move the document under a full-page screenshot and make the shot
 * depend on where the target happened to sit.
 */
export const STATES = ['rest', 'focus', 'hover'] as const;
export type StateName = (typeof STATES)[number];

/**
 * How many shots one page produces. Read by the setup and the teardown so that "N of M captured"
 * is derived from the matrix rather than from a literal somebody has to remember to change.
 */
export const SHOTS_PER_PAGE = THEMES.length * VIEWPORTS.length * STATES.length;

/**
 * How long to let declared transitions finish after a state change.
 *
 * MUST OUTLAST THE LONGEST TRANSITION THE STYLESHEET DECLARES, or a hover shot is taken part-way
 * through one and the two sides of an A/B disagree about where an element was. This repo's longest
 * is `duration-500` (a `PhotoGallery` lightbox fade), so 650 leaves a margin; playbook-admin's is
 * 0.25s and it uses 250.
 */
export const SETTLE_MS = 650;

/** One page to capture: the url path, and the slug that names it in every key. */
export interface PageTarget {
  /** `/Y26/program` */
  path: string;
  /** `y26-program` — filename-safe, lowercase, unique within a set. */
  slug: string;
}

/** One shot: a page in one theme, at one viewport, in one state. */
export interface Shot {
  key: string;
  page: PageTarget;
  theme: ThemeName;
  viewport: Viewport;
  state: StateName;
}

/**
 * A url path as a filename-safe slug.
 *
 * LOWERCASED, and that is the part with a trap in it. This site's routes are `Y24`, `Y25`, `Y26`,
 * and macOS filesystems are case-INSENSITIVE, so a slug that preserved case would let two paths
 * differing only in case write to one file and the second would silently win. Lowercasing makes
 * the collision visible instead, and `pageTargets` below refuses one rather than letting it
 * through.
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
 * to be loud enough that nobody reads the resulting "198 new keys" as a real diff.
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
export function shotKey(slug: string, theme: ThemeName, viewport: string, state: StateName): string {
  return `${slug}--${theme}--${viewport}--${state}`;
}

/** Every shot for one page, in a fixed order: theme outermost, then viewport, then state. */
export function shotsFor(page: PageTarget): Shot[] {
  const shots: Shot[] = [];
  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      for (const state of STATES) {
        shots.push({ key: shotKey(page.slug, theme, viewport.name, state), page, theme, viewport, state });
      }
    }
  }
  return shots;
}
