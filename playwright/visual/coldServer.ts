/**
 * IS THE SERVER THIS CAPTURE IS POINTED AT COLD? (ISS-10161)
 *
 * THE A/A GATE STRUCTURALLY CANNOT ASK THIS. The gate captures one server twice before anybody
 * edits anything, so it passes every shot and says nothing about the capture taken AFTER the
 * operator edited the tree and re-captured from the server that is still running. Vite's HMR
 * re-instantiates the module it invalidated and re-injects that module's stylesheet as its own
 * element rather than in the position a cold load gives it -- and a layered cascade is exactly the
 * thing that ordering decides, so a harness whose whole subject is stylesheet ordering is the one
 * most exposed to it.
 *
 * IT FAILS THE WAY A PARITY HARNESS MUST NEVER FAIL: quietly, with plausible numbers. Measured on
 * one working tree and one server: 112 mismatched shots captured cold, 144 captured after HMR
 * applied one edit to the stylesheet entry -- the extra 32 spread across four pages the branch
 * does not touch, every one of them with ZERO computed-style differences to explain it, two of
 * them differing only in document height. A reader who saw only the 144 would have concluded the
 * change broke four pages it never went near.
 *
 * THE STAMP IS WHAT MAKES IT VISIBLE FROM OUTSIDE. The harness manages no server, on purpose --
 * the two sides of an A/B are two different working trees -- so it cannot watch a boot. It does
 * not have to: vite keeps the invalidation timestamp on the module node for the life of the
 * process and re-applies it to every later request, so the `?t=` is there in the cold document a
 * brand-new browser context asks for, which is the same reason the capture is wrong in the first
 * place.
 */
// dry-copy: visual-parity/cold-server — every copy of this region must match; `dev repo copies` checks it
/**
 * A url vite serves as a module rather than as an asset or a route.
 *
 * The crawl follows these and nothing else. A route path would make the proof a site crawl —
 * every SSR document on the server, for a question none of them answer — and an image or a font
 * carries no imports to follow.
 */
const DEV_MODULE = /^\/(?:@fs\/|@id\/|@vite\/|src\/|node_modules\/|\.svelte-kit\/)/;

/** Quoted references to such a url, in a served HTML document or a transformed module body. */
const DEV_MODULE_REFERENCE = /["'`](\/(?:@fs\/|@id\/|@vite\/|src\/|node_modules\/|\.svelte-kit\/)[^"'`\s\\]*)/g;

/**
 * The stamp vite puts on an import of a module it has invalidated: `?t=<epoch ms>`.
 *
 * IT OUTLIVES THE UPDATE THAT CAUSED IT, which is the whole reason this is detectable at all. The
 * timestamp is kept on the module node for the life of the server process and re-applied by import
 * analysis to every later request, INCLUDING the cold document a fresh browser context asks for —
 * so a capture that opens 174 brand-new pages against a hot-reloaded server still gets the
 * re-instantiated module, in the re-instantiated order.
 *
 * Thirteen digits, because a shorter `t=` is somebody's ordinary query parameter.
 */
const HMR_STAMP = /[?&]t=\d{13}(?:&|$)/;

/** How many modules the proof may fetch before it reports itself incomplete rather than clean. */
const SCAN_LIMIT = 4000;

/** How many of those fetches are in flight at once. */
const SCAN_WORKERS = 12;

/** Every module url a served body references, deduplicated, in the order they first appear. */
export function devModuleReferences(body: string): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(DEV_MODULE_REFERENCE)) {
    const url = match[1];
    if (url !== undefined && DEV_MODULE.test(url)) found.add(url);
  }
  return [...found];
}

/** Whether this import url is one vite has stamped with an HMR timestamp. */
export function isHmrStamped(url: string): boolean {
  return HMR_STAMP.test(url);
}

/**
 * The result of asking the server whether it has hot-reloaded since it started.
 *
 * `scanned` is how many modules were fetched, and it is reported on success as well as on failure:
 * a proof that scanned four modules because the server answered the base url with something that
 * is not a dev document is not the same claim as one that scanned two thousand, and an operator
 * who cannot tell them apart is back to trusting a number that means nothing.
 */
export interface ColdServerScan {
  /** Modules fetched. */
  scanned: number;
  /** Stamped import urls found, in the order the crawl reached them. */
  stamped: string[];
  /** True when the crawl hit `SCAN_LIMIT` with modules still unvisited, so `stamped` is partial. */
  truncated: boolean;
}

/**
 * Crawl the module graph the base url pulls in, looking for vite's HMR stamp.
 *
 * BREADTH FIRST FROM THE BASE URL, because the base document is the one that pulls in the
 * stylesheet entry, the root layout and the shell — the surface a CSS-toolchain change is about
 * and the surface an operator edits between two captures. It is not the whole server: a module
 * reachable only from one preview route is not in this graph, which is why the README states the
 * rule as a rule the operator keeps rather than as one the harness enforces for them.
 */
export async function scanForHmr(baseUrl: string, document: string): Promise<ColdServerScan> {
  const queue = devModuleReferences(document);
  const seen = new Set(queue);
  const stamped = queue.filter(isHmrStamped);
  let scanned = 0;

  while (queue.length > 0 && scanned < SCAN_LIMIT) {
    const batch = queue.splice(0, Math.min(SCAN_WORKERS, SCAN_LIMIT - scanned));
    scanned += batch.length;
    const bodies = await Promise.all(
      batch.map(async (url) => {
        const response = await fetch(new URL(url, baseUrl)).catch(() => null);
        // A module the server refuses is not evidence either way, and it is not this check's job
        // to have an opinion about it: the capture is about to open every page anyway.
        if (response === null || !response.ok) return '';
        return response.text();
      })
    );
    for (const body of bodies) {
      for (const url of devModuleReferences(body)) {
        if (seen.has(url)) continue;
        seen.add(url);
        if (isHmrStamped(url)) stamped.push(url);
        queue.push(url);
      }
    }
  }

  return { scanned, stamped, truncated: queue.length > 0 };
}

/**
 * Refuse a capture off a server that has hot-reloaded since it booted.
 *
 * A THROW RATHER THAN A WARNING, because the cost of being wrong is asymmetric and both halves
 * were measured: a false refusal costs the operator one `Ctrl-C` and one `npm run dev`, and a
 * missed one costs a twenty-five-minute capture and — if nobody notices the pages in the diff are
 * pages the branch does not touch — a wrong verdict about whether a stylesheet change is a no-op.
 * `VISUAL_ALLOW_HOT_SERVER=1` is the escape hatch for the operator who has looked and decided the
 * stamp is not what this thinks it is; it warns and continues.
 *
 * A SERVER THAT IS NOT A VITE DEV SERVER IS NOT REFUSED. `npm run preview` serves a built bundle
 * with no HMR to have happened, and it references no dev module urls, so the crawl finds nothing
 * to follow and says so.
 */
export async function assertColdServer(baseUrl: string): Promise<void> {
  // `redirect: 'follow'` and a fetch of its own, rather than reusing the reachability probe above:
  // that one is deliberately `manual`, so a base url that redirects to a login answers it with an
  // EMPTY body -- and an empty body crawls to zero modules and passes this proof for a reason that
  // has nothing to do with the server being cold.
  const document = await fetch(baseUrl)
    .then(async (response) => response.text())
    .catch(() => '');
  const scan = await scanForHmr(baseUrl, document);
  if (scan.stamped.length === 0) {
    console.log(
      scan.scanned === 0
        ? `visual: cold-server proof -- ${baseUrl} references no vite dev modules, so there is no HMR state to have; nothing checked`
        : `visual: cold-server proof -- ${scan.scanned} dev module(s) scanned, none carrying an HMR timestamp` +
            (scan.truncated ? ` (stopped at the ${SCAN_LIMIT}-module limit; the proof is PARTIAL)` : '')
    );
    return;
  }

  const first = scan.stamped.slice(0, 5).join('\n  ');
  const message =
    `visual: the server at ${baseUrl} has HOT-RELOADED since it started -- ${scan.stamped.length} module(s) are served with a vite ` +
    `HMR timestamp:\n  ${first}\n` +
    "HMR re-injects an invalidated module's stylesheet as its own element rather than in the position a cold load gives it, and the " +
    'layered cascade depends on that order -- so a capture taken from this server is not comparable with one taken from a cold one, ' +
    'and the shots it moves are on pages the branch never touched. Restart the server and capture again ' +
    '(VISUAL_ALLOW_HOT_SERVER=1 to capture anyway).';

  if (process.env['VISUAL_ALLOW_HOT_SERVER'] === '1') {
    console.warn(`${message}\nvisual: VISUAL_ALLOW_HOT_SERVER=1 -- capturing anyway.`);
    return;
  }
  throw new Error(message);
}
// dry-copy-end
