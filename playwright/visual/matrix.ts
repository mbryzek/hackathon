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
 * The three multiply out to eighteen shots per page. That is the point: the upgrade is claimed to
 * be a no-op, and a no-op claim is only worth what it was tested against.
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
 * `rest` is the page as it loads. `focus` puts the keyboard focus on the first form control that
 * is already inside the viewport, and `hover` puts the pointer on the first button that is — both
 * constrained to the initial viewport ON PURPOSE, because the alternative (playwright's own
 * `hover()`, which scrolls) would move the document under a full-page screenshot and make the shot
 * depend on where the target happened to sit.
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
// dry-copy-end
