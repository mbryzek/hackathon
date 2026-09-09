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

## The two deadlines, and the knobs for a loaded machine

A capture is only worth anything if it is COMPLETE: the A/A gate above compares two captures key for
key, so a rendering that timed out is not a smaller answer, it is no answer. Two different deadlines
can take one away, they fail at completely different scales, and both are settable.

```sh
VISUAL_SHOT_BUDGET_MS=90000 VISUAL_SETTLE_TIMEOUT_MS=90000 VISUAL_SET=preview ... npm run visual:capture
```

| variable                   | default | what it does                                                        |
| -------------------------- | ------- | ------------------------------------------------------------------- |
| `VISUAL_SHOT_BUDGET_MS`    | `45000` | how long one shot may take; `0` asks for no per-page budget         |
| `VISUAL_SETTLE_TIMEOUT_MS` | `30000` | how long one navigation or load-state wait inside a settle may take |
| `VISUAL_WORKERS`           | `4`     | how many pages are captured at once                                 |

The **per-page budget** is the outer one, set per shot in `parity.spec.ts` and raised as each page
says how many hover shots it turned out to owe. Missing it loses a whole PAGE: the test times out
and writes no shard at all.

The **settle deadline** is the inner one, and it bounds each navigation and each `networkidle` wait
separately. Missing it loses one theme/viewport CONTEXT — a sixth of a page — and it is the one that
fires first on a loaded box, because a page that needs 31 seconds to go quiet was never going to
reach the per-page budget's thirteen minutes. A context that misses it is navigated a second time at
twice the deadline before it is given up on, which is not the shot retry
`playwright.visual.config.ts` forbids: that rule is about re-rendering a shot that already
succeeded, and a context that never settled rendered nothing.

A page owes between 18 and 48 shots depending on how many hover targets it offers, and the
difference is real time: on one quiet two-worker capture of playbook-app's preview set the 18-shot
page took 1.9 minutes and the 48-shot page took 10.0.

Raise the budget, not the workers, on a machine that shares its cores. Halving the workers doubles
the wall time and does not clear the failures, because the contention is the machine's total load
rather than this run's own parallelism.

`VISUAL_SHOT_BUDGET_MS=0` is a real answer rather than an escape hatch: nothing inside one test is
unbounded on its own — every navigation and load-state wait carries `VISUAL_SETTLE_TIMEOUT_MS`, a
screenshot carries playwright's, and a context that will not settle is recorded as a dropped
rendering rather than waited on. The per-page budget bounds total work, not a hang.
`VISUAL_SETTLE_TIMEOUT_MS=0` is refused for the mirror-image reason: that number IS the guard the
sentence above leans on, and a `networkidle` wait with no deadline on a page holding one request
open forever is a capture that never ends.

## A dropped rendering fails the run

The manifest carries two lists, and they mean opposite things.

`uncovered` is what the capture was never going to shoot: a route with no seeded value, a
`[...rest]` template, a dev-only route, a page offering more hover targets than `VISUAL_HOVER_LIMIT`.
Every capture of the same tree produces the same list, so it costs the comparison no key. It is a
note.

`dropped` is what the capture was asked for and did not produce: a context that never settled, a
shot whose font metrics could not be reproduced, a page whose test died before writing a shard. It
is fatal, in four places at once — the page's test FAILS, so the playwright summary says so; the
merge prints each loss and fails the capture; the manifest records it with its scope (`page`,
`context` or `shot`); and `visual:compare` refuses a capture carrying one, on either side.

That last one is the half that is easy to leave out and is the reason `dropped` is on the manifest
at all. `compareManifests` reports a context ONE capture lost as shots present on one side only —
loudly, and blaming the diff — and it is blind to a context BOTH lost, which is the likelier case
when the cause is the runner's load: no key is missing from either side, every remaining shot
matches, and the harness reports "every shot is byte-for-byte identical" about a console it did not
finish rendering.

## A page that navigates mid-capture costs a document, not the page

The page can leave the route half way through its own capture: a client-side redirect that lost its
race with the settle, or the dev server reloading the document because something regenerated
`.svelte-kit` underneath it — a `npm run check` in the same checkout is enough to do that. Chromium
destroys the execution context every read of the page runs in, and playwright reports it as an
ordinary failure of whichever call happened to be in flight.

Left as a throw it costs the whole PAGE, not the shot: every shot already written is orphaned, no
shard is written, and the merge records the page as dropped. One late navigation on one of a page's
six contexts therefore costs the entire capture, because a capture missing a page cannot pass the
A/A gate. Measured at five of twenty-nine pages on one run, from three different call sites.

So every page operation `capture.ts` exports reports it as `NavigatedAway`, and `parity.spec.ts`
repairs it the only way it can be repaired: a fresh document at the url this context was asked for,
in the **same context** — which keeps the theme, the viewport, the pinned clock, the cookies and the
warm face cache — resuming at the first shot it has no answer for. Shots already recorded are kept
and never taken again; re-rendering a shot that already succeeded is the one retry
`playwright.visual.config.ts` forbids outright. Three documents, and then the context is recorded as
dropped, naming the url the page kept leaving for.

The navigation that destroys nothing is the other half, and it is the one no error can report: one
that lands in a gap between two of the harness's own calls leaves every later read answering happily
about the new document, so half a context's keys end up filed against a page they are not about —
which the compare then blames on a stylesheet. `page.url()` is a local read that costs no round
trip, so it is asked on both sides of every shot, exactly as the document's structure is asked on
both sides of every raster.

## Determinism

Pinned identically on both sides, and each line is a hazard that was measured rather than imagined:
a fixed clock (`Date.now()` frozen, timers still running), a seeded `Math.random`, reduced motion,
`animations: 'disabled'` at screenshot time, `document.fonts.ready`, a pinned `colorScheme` and
`deviceScaleFactor`, and a settle after each state change that outlasts the stylesheet's longest
transition (`SETTLE_MS` in `capture.ts` is 900ms; this site's longest is `duration-500`, which is
the longest any repo carrying that region declares and therefore what the constant is set from). `capture.ts`
documents why each one is there, and `playwright.visual.config.ts` pins Chromium's rasteriser,
which is not deterministic by default.

**And the server, which is the half a browser-side harness cannot reach.** This site shuffles its
photo and video galleries during SSR, so it serves a different document to every request;
`server-determinism.mjs` is `--import`ed into the server process to pin that, and the A/A gate is
what found it (24 of 189 shots, on exactly the four shuffling pages, with identical computed
styles). Start both sides of an A/B the same way or neither.

The font is the one that needed more than waiting. A `ch` is resolved **at layout** and kept, so a
document that laid itself out while the self-hosted face was momentarily gone renders every
`max-width: 88ch` on it at `0.5em` per `ch` and goes on doing so however loaded the face is by the
time anything asks — which is how one page came back 714.56px wide in one capture and 638px wide in
the next of the same server. A `100ch` box is therefore planted before the first layout and kept for
the life of the document, and the shot is only taken while it still measures what a box created now
measures. A page that cannot answer that is reloaded and shot again, and dropped rather than
recorded on fallback metrics if three documents running cannot.

The shot itself is the other one, and it is the one that is easy to miss because the harness is
doing it. A full-page screenshot is not a passive read: Chromium renders the document at its own
height and is briefly at other viewport sizes on the way there and back — 1x1 among them, measured
from inside the page. A page that mounts something on hover sees a reflow at that moment, the
pointer is no longer over what it was over, and the app tears the node down on whatever grace
period its hover clear runs on. The pointer never moves again, so nothing brings it back. Measured
on the chart previews, which portal a tooltip bubble: eight consecutive shots of one hovered chart
band, no other input, and the bubble vanished at the fourth and stayed gone. So the document's
structure — every element's tag and class — is read either side of the screenshot, and a shot whose
page moved across its own raster is **retaken with the state re-applied**, not recorded. Re-applying
is the whole repair; a second screenshot of the same page is a second screenshot of the torn-down
state.

`VISUAL_COOKIES` is a `{"NAME":"value"}` object planted on every context before the first
navigation, for a repo whose interesting pages are behind a session. Unset is the ordinary case and
plants nothing.

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
