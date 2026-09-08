# Visual parity harness

Answers one question: **does this branch render the site byte-for-byte as `main` does?**

It exists because a CSS-toolchain change (Tailwind 3 → 4, ISS-9327; a Svelte or vite major; a
plugin bump) is claimed to be a no-op, and a no-op claim is worth exactly what it was tested
against. Twenty-one pages, two themes, three viewports and three interaction states is more than anybody
eyeballs, and the differences that matter — a border that fell back to `currentColor`, a radius one
step larger, a `hover:` rule that stopped applying — are precisely the ones an eye skips.

The verdict is a **sha256 of the PNG**. There is no threshold, no tolerance and no accepted-diff
list, on purpose: a threshold turns "one step of border colour, on every page" into a pass.

Copied from playbook-admin (ISS-9319), which built it and found what is in the "Determinism"
section below, under the `visual-parity/*` `dry-copy` groups `account` established (ISS-9325).
What this repo owns is the head of `matrix.ts` (themes, viewports, states), `pages.ts`, `plan.ts`,
`files.ts`, `server-determinism.mjs` and this file; everything else is a marked region that must
stay byte-identical, and `dev repo copies` reports a change that reaches one repo and not the
others.

## The three commands

```sh
# 1. Stand a server up. The harness manages none, because the two sides of an A/B are two
#    different working trees. NODE_OPTIONS is not optional: this site shuffles its galleries
#    during SSR, so without it the server serves a different document to every request. See
#    server-determinism.mjs.
NODE_OPTIONS="--import $PWD/playwright/visual/server-determinism.mjs" \
  npm run dev -- --port 5744 --strictPort

# 2. Capture.
VISUAL_SET=static VISUAL_BASE_URL=http://localhost:5744 VISUAL_OUT=../visual/baseline \
  npm run visual:capture

# 3. Compare two capture directories. Non-zero exit on any difference.
npm run visual:compare -- ../visual/baseline ../visual/candidate
```

`VISUAL_OUT` should be **outside the repo** — a capture of the static set is a few hundred
megabytes of full-page PNGs.

## The A/A gate comes first, always

Before a capture is allowed to judge anything, capture the **same server twice** and compare the
two. Every hash must match.

```sh
VISUAL_SET=static VISUAL_BASE_URL=http://localhost:5744 VISUAL_OUT=../visual/aa1 npm run visual:capture
VISUAL_SET=static VISUAL_BASE_URL=http://localhost:5744 VISUAL_OUT=../visual/aa2 npm run visual:capture
npm run visual:compare -- ../visual/aa1 ../visual/aa2
```

Anything that differs there is a **harness** bug — an unfrozen timer, a scrollbar, a lazy image, an
unseeded `Math.random()` — and it gets fixed in `capture.ts` before the harness is pointed at a real
change. Skipping this step is how a parity harness comes to report a number that means nothing:
without it, a green A/B is indistinguishable from a harness whose noise happens to be zero today,
and a red A/B is indistinguishable from noise.

## The two sets

| `VISUAL_SET` | What it captures                                                                          | What it needs                                                             |
| ------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `static`     | every route that renders with no backend — 22 pages, the set `npm run build` prerenders   | `npm run dev`, nothing else                                               |
| `live`       | every `+page.svelte` under `src/routes`, with `[param]` routes filled from `VISUAL_SEEDS` | a platform serving `VITE_API_BASE_URL`, a seeded event, a signed-in admin |

`static` is the set a CSS change is judged on: it needs no backend, so the same 22 pages render
identically from any checkout, which is exactly what an A/B requires. `live` adds the voting and
admin surface at the cost of a backend — and two runs against one differ in row ids and timestamps,
which read as CSS regressions, so a live A/B wants one container pinned across both captures.

```sh
VISUAL_SET=live VISUAL_SEEDS='{"event_key":"bths-2026","id":"1"}' ...
```

A route with no seeded value is **listed in `manifest.json` under `uncovered`**, never silently
skipped. A harness that quietly drops half the site and reports "all equal" is worse than one that
reports a smaller number honestly.

## What a capture directory holds

```
manifest.json                 sha256 + document size + state target per shot; the verdict
png/<key>.png                 the shot
styles/<key>.json.gz          every element's full getComputedStyle map; the diagnostic
```

`<key>` is `<page-slug>--<theme>--<viewport>--<state>`, where `<state>` is `rest`, `focus`,
or `hover-<n>` — one per interactive element the page offered inside the viewport. This site has no theme, so the two theme
values render identically and each page is captured twice — see `matrix.ts` on why the degenerate
axis is kept, and why two shots that must be equal are a free control on the harness itself.

The style dump is **never a verdict** — it cannot see a background image, a font fallback or a
sub-pixel shift. It is read only after a hash has already failed, and it is what turns "page X
moved" into `div.card border-color: rgb(229,233,241) -> rgb(0,0,0)`, which names the rule to fix.

### What a screenshot cannot see

`cursor`, `pointer-events`, `user-select` and `touch-action` render no pixels, so the verdict is
blind to them — and Tailwind 4 changes the default button cursor, which is exactly the kind of
regression a green A/B would have said nothing about. `--audit` walks the style dumps of the shots
that already MATCHED and reports differences in the named properties:

```sh
npm run visual:compare -- ../visual/baseline ../visual/candidate --audit cursor,pointer-events,user-select
```

It prints; it does not change the exit code. A property list is an argument about what matters, and
the verdict deliberately is not.

## Determinism

Pinned identically on both sides, and each line is a hazard that was measured rather than imagined:
a fixed clock (`Date.now()` frozen, timers still running), a seeded `Math.random`, reduced motion,
`animations: 'disabled'` at screenshot time, `document.fonts.ready`, a pinned `colorScheme` and
`deviceScaleFactor`, and a settle after each state change that outlasts the stylesheet's longest
transition (`SETTLE_MS` in `capture.ts` is 650ms; this site's longest is `duration-500`, which is
the longest any repo carrying that region declares and therefore what the constant is set from). `capture.ts`
documents why each one is there, and `playwright.visual.config.ts` pins Chromium's rasteriser,
which is not deterministic by default.

**And the server, which is the half a browser-side harness cannot reach.** This site shuffles its
photo and video galleries during SSR, so it serves a different document to every request;
`server-determinism.mjs` is `--import`ed into the server process to pin that, and the A/A gate is
what found it (24 of 189 shots, on exactly the four shuffling pages, with identical computed
styles). Start both sides of an A/B the same way or neither.

`focus` and `hover` never scroll, because a full-page screenshot renders fixed and sticky chrome at
the current scroll offset: both are confined to the elements already inside the initial viewport.
`focus` takes the first of them. **`hover` takes every one of them, in turn** — one shot per
element, keyed `hover-0`, `hover-1`, ..., capped at `VISUAL_HOVER_LIMIT` (default 6). The first
interactive element in document order is deterministic, which is why it was the original target, and
it is almost never the affordance a `hover:` rule is about: a form puts its decoration before its
submit, so a harness that hovered only it spent every button-bearing shot on a 20x20
password-visibility toggle and reported "equal" about a primary button it never touched. A page that
offers no target records one shot targeted `none`; a _change_ in which element a key was targeted at
is itself reported; and whatever the cap did not reach is listed in the manifest's `uncovered`.

## What is repo-specific

The head of `matrix.ts` (themes, viewports, states), `pages.ts` (how the two sets are derived from
the routes tree), `plan.ts` (which set one capture is doing), `files.ts`, `server-determinism.mjs`,
`pages.test.ts` and this file. Everything else is a `dry-copy` region shared with `account` and
`playbook-admin`, and must not be edited in one repo alone.
