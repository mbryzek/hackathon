// dry-copy: sveltekit/reap-leaked-children
import { execFileSync } from 'node:child_process';

import { isMainThread } from 'node:worker_threads';

// stderr already closed
// dry-copy-end
import adapter from '@sveltejs/adapter-cloudflare';

import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

/**
 * KILL WHAT THIS PROCESS STILL OWNS WHEN IT EXITS.
 *
 * `@sveltejs/adapter-cloudflare`'s `emulate()` calls wrangler's `getPlatformProxy()`, which
 * starts a miniflare `workerd`, and the adapter disposes it nowhere. SvelteKit calls
 * `emulate()` from its prerender pass, and that pass runs in a worker THREAD rather than a
 * subprocess — so the `workerd` is a child of THIS pid, it outlives the build, and it is
 * reparented to init still holding two loopback-specific ephemeral ports. Every `vite build`
 * of a prerendering app leaks exactly one.
 *
 * A held loopback port is not inert. A wildcard bind does not reserve a port: the kernel's
 * wildcard allocator hands out `0.0.0.0:N` while the squatter keeps `127.0.0.1:N`, both binds
 * coexist, and a connection to `127.0.0.1:N` goes to the MOST SPECIFIC listener — the
 * squatter. That is how a frontend build makes an unrelated repo's forked test runner hang on
 * a handshake nothing will ever answer.
 *
 * This matches on nothing — not a process name, not an age, not a port. A direct child still
 * alive once `exit` has been reached is provably ours (it is a child of this pid) and provably
 * finished with (this process is going away), which is true of any daemon a build leaves
 * behind and not only of `workerd`.
 *
 * This region is copied verbatim into every SvelteKit repo in this account that builds on
 * `adapter-cloudflare`. The `dry-copy` markers are the declaration — `dev repo copies`
 * enumerates every copy carrying them and reports one that has drifted, so a change here
 * that does not reach the others is caught rather than merely regretted (ISS-3894).
 *
 * Delete this once every repo carrying this block is on `@sveltejs/adapter-cloudflare`
 * v8+. v8 drops `emulate()`: the platform proxy moves into a Vite plugin that runs only
 * for dev and preview servers, so a build never creates one. The adapter still disposes
 * the proxy nowhere, so the version is the trigger to watch for — not a `dispose()` call,
 * which is not coming. The check is that `emulate` no longer appears in
 * `node_modules/@sveltejs/adapter-cloudflare/index.js`. ISS-5600
 */
if (isMainThread) {
  // Absolute path so nothing earlier on PATH can change what runs, and `-P` so the only thing
  // this can ever name is a child of this pid. Never a pattern: on a machine running several
  // builds at once a pattern matches the other builds too. `pgrep` exits 1 when there are no
  // children and is absent on some platforms; neither is worth a word on a build that has
  // otherwise succeeded.
  const ownChildren = () => {
    try {
      return execFileSync('/usr/bin/pgrep', ['-P', String(process.pid)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
        .split('\n')
        .map((line) => Number(line.trim()))
        .filter((pid) => pid > 0);
    } catch {
      return [];
    }
  };

  let reaped = false;

  process.on('exit', () => {
    if (reaped) return;

    reaped = true;

    let killed = 0;

    for (const pid of ownChildren()) {
      try {
        process.kill(pid, 'SIGTERM');
        killed++;
      } catch {}
    }

    // Already gone between the listing and the signal.
    // Say so rather than reaping in silence: this line is how anyone learns the leak is still
    // there, and its absence is how they learn it is not.
    if (killed > 0) {
      try {
        console.error(`svelte.config.js: reaped ${killed} leftover child process(es) — ISS-5600`);
      } catch {}
    }
  });
}

export default defineConfig({
  // Tailwind 4 through its own vite plugin rather than through postcss: it compiles with
  // Lightning CSS, which also does the vendor prefixing autoprefixer used to, so this repo has no
  // postcss.config.js and no autoprefixer. First in the list, as the plugin's own docs require.
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      // No `routes` option: it only ever generated `_routes.json`, which is how a Cloudflare
      // PAGES project decides which requests reach its Function. This app deploys as a Worker
      // with static assets (`main` + `[assets]` in wrangler.toml), where the asset server
      // answers what it has and the Worker gets the rest — so the adapter reads the option
      // nowhere and passing one would read as routing configuration that does nothing.
      adapter: adapter(),
      alias: { $generated: 'src/generated' }
    })
  ],
  resolve: {
    alias: {
      url: path.resolve(__dirname, 'src/lib/url-shim.ts')
    },
    // Under vitest, resolve Svelte to its client build so component tests can `mount()` a component
    // into jsdom. Without this the server build is loaded and mount() throws
    // `lifecycle_function_unavailable`. Guarded by VITEST so the app's own build is untouched.
    ...(process.env['VITEST'] ? { conditions: ['browser'] } : {})
  },
  test: {
    // The visual parity harness's own units (`playwright/visual/*.test.ts`) run here too: they
    // pin the bookkeeping a capture cannot assert about itself -- the shot key, the page-set
    // derivation, the manifest compare. See playwright/visual/README.md.
    // `playwright/*.test.ts` is the suite's own top-level harness on the same terms: the readiness
    // probe global setup classifies a server with, which no spec can assert because a spec runs only
    // once it has passed.
    include: ['src/**/*.test.ts', 'playwright/*.test.ts', 'playwright/visual/**/*.test.ts'],
    // NODE'S OWN `localStorage` HIDES JSDOM'S. From Node 25 Web Storage is on by default, and
    // without `--localstorage-file` the global it installs reads `undefined` — and vitest's jsdom
    // environment leaves a global Node already defines alone, so a jsdom test reaching for
    // `localStorage` gets Node's nothing instead of jsdom's store. `engines` admits Node 26, so a
    // runner on it fails every such test while one on 24 passes them. Turning the Node feature off
    // in the test workers leaves jsdom's the only `localStorage` there is; the flag is accepted by
    // every Node line `engines` names. ISS-11542
    execArgv: ['--no-experimental-webstorage']
  }
});
